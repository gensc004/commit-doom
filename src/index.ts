import * as core from "@actions/core";
import * as github from '@actions/github';
import { execSync } from 'child_process';

async function main() {
	const modelVersion = core.getInput("MODEL_VERSION");
	console.log(`The model version is: ${modelVersion}`);
    const event = github.context.eventName;

    if (event === 'push') {
        const commitMessage = github.context.payload.head_commit?.message;
        core.info(`Commit message (push): ${commitMessage}`);
    } else if (event === 'pull_request') {
        const commitMessage = execSync('git log -1 --pretty=%B').toString().trim();
        core.info(`Commit message (PR): ${commitMessage}`);
    } else {
        core.warning(`Event "${event}" not supported for commit message extraction.`);
    }
}

main();
