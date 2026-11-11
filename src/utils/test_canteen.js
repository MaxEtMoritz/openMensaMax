const { parseArgs } = require("node:util");
const { processCanteen } = require("../index.js");

async function main() {
    let options;
    try {
        ({ values: options } = parseArgs({
            args: process.argv.slice(2),
            options: {
                provider: { type: "string" },
                project: { type: "string", short: "p" },
                institution: { type: "string", short: "e" },
            },
            allowPositionals: false,
        }));
        for (const required of ["provider", "project", "institution"]) {
            if (!options[required]) throw new Error(`Missing required option: --${required}`);
        }
    } catch (error) {
        console.error(`${error.message}\nUsage: node src/utils/test_canteen.js --provider <host> -p <id> -e <canteen>`);
        process.exitCode = 1;
        return;
    }

    try {
        await processCanteen(options.project, options.institution, options.provider, undefined, undefined, false);
        console.log("Canteen processed successfully.");
    } catch (error) {
        console.error(error);
        process.exitCode = 1;
    }
}

main();