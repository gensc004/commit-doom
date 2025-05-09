import * as core from "@actions/core";

async function main() {
	const modelVersion = core.getInput("MODEL_VERSION");

	console.log(`The model version is: ${modelVersion}`);
}

main();
