import * as core from "@actions/core";
import * as github from '@actions/github';
import { execSync } from 'child_process';
import { spawn } from "child_process";
import path, { join } from "path";
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const COMPLETED_COMMIT_MESSAGE = 'commit-doom:'

type Action = {
    command: string,
    frames: number
}

// (async () => {
//     const browser = await puppeteer.launch({ headless: false });
//     const page = await browser.newPage();

//     // If we add an item to cart by clicking on the "Add to cart" button:
//     await page.goto('https://web-scraping.dev/product/1');
//     await page.click('.add-to-cart');
//     // we can see it sets Local Storage
//     const localStorageData = await page.evaluate(() => JSON.parse(JSON.stringify(localStorage)));
//     console.log(localStorageData);
//     // {'cart': '{"1_orange-small":1}'}  // that's 1 product in the cart

//     // we can then modify cart by modifying Local Storage "cart" value:
//     // e.g. add one more item to the cart
//     const cart = JSON.parse(localStorageData.cart);
//     cart['1_cherry-small'] = 1;
//     // then call JavaScript to set the new value:
//     await page.evaluate((cart) => {
//         localStorage.setItem('cart', JSON.stringify(cart));
//     }, cart);

//     // check that the cart has 2 items now:
//     await page.goto('https://web-scraping.dev/cart');
//     await page.waitForSelector('.cart-full .cart-item');
//     const cartItems = await page.$$eval('.cart-item .cart-title', items => items.length);
//     console.log(`items in cart: ${cartItems}`);
//     // items in cart: 2

//     await browser.close();
// })();

async function takeScreenshotOfAction (action: Action) {
    const url = 'http://localhost:8080';
    const screenshotPath = join(__dirname, 'screenshots', 'latest.png');

    // Ensure directory exists
    mkdirSync(join(__dirname, 'screenshots'), { recursive: true });

    const browser = await chromium.launch();
    const page = await browser.newPage();

    core.info('Running playwright against doom');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });


    // TODO: Run commands
    core.info('Running action on puppetteer');

    console.log(`Taking screenshot and saving to ${screenshotPath}`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    await browser.close();

    core.info('Successfully took screenshot.')
}

async function runDoomServer() {
    const publicDir = path.join(__dirname, "public");

    const server = spawn(
        "npx",
        ["http-server", publicDir, "-p", "8080", "--silent"],
        {
            stdio: "inherit",
            shell: true,
        }
    );

    core.info('Running doom server on port 8080');

    return server
}

function getActionFromCommitMessage (commitMessage: string): Action | null {
     
    return {
        command: 'pause',
        frames: 10
    }
}

async function commitImageToGithub (action: Action) {
    // Set up Git
    execSync('git config user.name "github-actions"');
    execSync('git config user.email "github-actions@github.com"');

    // Add and commit the screenshot
    // execSync('git add screenshots');
    execSync(`git commit --allow-empty -m "${COMPLETED_COMMIT_MESSAGE} ${action.command} ${action.frames}"`);

    // Push using GITHUB_TOKEN
    const repo = process.env.GITHUB_REPOSITORY;
    const token = process.env.GITHUB_TOKEN;

    if (!repo || !token) {
      throw new Error('Missing GITHUB_REPOSITORY or GITHUB_TOKEN');
    }

    // Rewrite remote to include token
    const remoteUrl = `https://x-access-token:${token}@github.com/${repo}.git`;
    execSync(`git push "${remoteUrl}" HEAD`);
    core.info('Screenshot committed and pushed');
}

async function main() {
    const event = github.context.eventName;

    if (event === 'push') {
        const commitMessage = github.context.payload.head_commit?.message;

        // If the commit message is from this action, skip
        if (commitMessage.includes(COMPLETED_COMMIT_MESSAGE)) {
            core.info('Skipping commits from this action')
            return;
        }

        const action = getActionFromCommitMessage(commitMessage);

        // If the commit message doesn't contain an action, skip
        if (!action) {
            core.info('Action not found in commit message. Skipping.')
            return;
        }

        let doomServer;

        // Run doom, run the action, take screenshot
        try {
            doomServer = await runDoomServer();
            await takeScreenshotOfAction(action);
            await commitImageToGithub(action);
        } catch(err) {
            core.setFailed((err as Error).message);
        }

        doomServer?.kill();
    } else if (event === 'pull_request' && github.context.payload.action === 'closed' && github.context.payload.pull_request?.merged) {
        const commitMessage = execSync('git log -1 --pretty=%B').toString().trim();
        core.info(`Commit message (PR): ${commitMessage}`);
    } else {
        core.warning(`Event "${event}" not supported for commit message extraction.`);
    }
}

main();
