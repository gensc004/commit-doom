import * as core from "@actions/core";

async function main() {
	const modelVersion = core.getInput("MODEL_VERSION");

	core.debug(`The model version is: ${modelVersion}`);
}

main();
