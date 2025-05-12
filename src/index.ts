import * as core from "@actions/core";
import * as github from '@actions/github';
import { execSync } from 'child_process';

const COMPLETED_COMMIT_MESSAGE = 'commit-doom: '

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
    core.info('Running puppetteer on port 8080');

    core.info('Running action on puppetteer');

    core.info('Taking screenshot of current state of the game');

    core.info('Successfully took screenshot.')
}

async function runDoomServer() {
    core.info('Running doom server on port 8080');
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
    execSync(`git commit -m ${COMPLETED_COMMIT_MESSAGE} ${JSON.stringify(action)}`);

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
	const modelVersion = core.getInput("MODEL_VERSION");
	console.log(`The model version is: ${modelVersion}`);
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

        // Run doom, run the action, take screenshot
        try {
            await runDoomServer();
            await takeScreenshotOfAction(action);
            await commitImageToGithub(action);
        } catch(err) {
            core.setFailed((err as Error).message);
        }
    } else if (event === 'pull_request' && github.context.payload.action === 'closed' && github.context.payload.pull_request?.merged) {
        const commitMessage = execSync('git log -1 --pretty=%B').toString().trim();
        core.info(`Commit message (PR): ${commitMessage}`);
    } else {
        core.warning(`Event "${event}" not supported for commit message extraction.`);
    }
}

main();
