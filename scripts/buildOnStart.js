import { buildBytecodeFiles } from './buildBytecodeFiles.js';
import { buildAbiAndContractNameFiles } from './buildAbiAndContractNameFiles.js';
import { buildMethods } from './buildMethods.js';
import { buildContractConfig } from './buildContractConfig.js';
const sleeper = (amt) => ((new Promise(res => setTimeout(res, amt))));

// Es6 Path resolve
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function buildOnStart(startRun = false) {

    console.log("\n\x1B[33m=====================================")
    console.log("========= TRANSPILER  START =========")
    console.log("=====================================\x1B[0m")

    console.log(`\n\x1B[36mPreparing to transpile ABI and Contract Names to ES6 formats to ${__dirname}/../adapter/\x1B[33m\n`);
    await sleeper(1500);

    console.log("Transpiling ABI and Contract names to ES6 Syntax...\n");
    const ABIS = await buildAbiAndContractNameFiles();

    await sleeper(1500);
    console.log("\x1B[33mTranspiling Bytecodes to ES6 Syntax...\n");
    await buildBytecodeFiles();

    await sleeper(1500);
    console.log("\x1B[33mExtracting Methods from Transpiled Contract Configuration...")
    await buildMethods(ABIS)

    await sleeper(1500);
    console.log("\x1B[33mBuilding Contract Configuration Files...");
    await buildContractConfig();

    console.log("\x1B[1;35m=====================================")
    console.log("========== TRANSPILER  END ==========")
    console.log("=====================================\x1B[0m\n")

    if (process.argv[2] === "startRun" || startRun) {
        await sleeper(1500);
        console.log("Resuming start up...\n")
        await sleeper(1250)
    }

}