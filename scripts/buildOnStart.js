// import { buildBytecodeFiles } from './buildBytecodeFiles.js';
import { buildAbiAndContractNameFiles } from './buildAbiAndContractNameFiles.js';
import { buildMethods } from './buildMethods.js';
import { distMaker } from './createDist.js';
import { checkArtifactsForHash, getArtifactsHash, writeHashFile } from './hashHandling.js';
const sleeper = (amt) => ((new Promise(res => setTimeout(res, amt))));

// Es6 Path resolve
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from './configHandling.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @param {*} startRun - Is this a run cycle for pre-npm start?
 */
export async function buildOnStart(startRun = false) {

    // Load eth-adapter config && check artifacts hash for differences
    const ethAdapterConfig = await loadConfig()
    const artifactsHaveChanged = await checkArtifactsForHash();

    if (ethAdapterConfig.alwaysCompile) {
        console.log(`\x1B[31m"alwaysCompile" detected\n\x1B[36m-To avoid transpile when artifacts or configuration do not change set alwaysCompile to false\x1B[33m\n`);
    }

    if (artifactsHaveChanged || ethAdapterConfig.alwaysCompile) {
        
        console.log("\x1B[33m=====================================")
        console.log("========= TRANSPILER  START =========")
        console.log("=====================================\x1B[0m")

        console.log(`\n\x1B[36mPreparing to transpile ABI and Contract Names to ES6 formats to ${path.resolve(__dirname + '/../adapter/')}\x1B[33m\n`);
        await sleeper(1500);

        console.log("Transpiling ABI and Contract names to ES6 Syntax...\n");
        const ABIS = await buildAbiAndContractNameFiles();

        // TODO: Make conditional and include create2() address returns from using bytecode
        // await sleeper(1500);
        // console.log("\x1B[33mTranspiling Bytecodes to ES6 Syntax...\n");
        // await buildBytecodeFiles();

        await sleeper(1500);
        console.log("\x1B[33mExtracting Methods from Transpiled Contract Configuration...")
        await buildMethods(ABIS)

        await sleeper(1500);
        console.log("\x1B[33mBuilding Contract Configuration Files...");
        let configBuildModule = await import('../scripts/buildContractConfig.js');
        const configSuccess = await configBuildModule.buildContractConfig(ethAdapterConfig);

        if (!configSuccess) { 
            console.log("\x1B[31mError creating contract configuration. See logs\n");
            return 
        }

        await sleeper(1500);
        console.log("\x1B[33mBuilding eth-adapter /dist...\n");
        let distRes = await distMaker();

        if (!!distRes.error) {
            console.log("\x1B[31mError creating dist");
            console.log(distRes.error)
            return
        }

        // If no dist error -- Write the latest hash for comparing
        await writeHashFile(await getArtifactsHash())

        console.log(`\n\x1B[0;32mDist Successfully Created at *eth-adapter/dist/\n\x1B[0m`);

        console.log("\x1B[0;33m=====================================")
        console.log("========== TRANSPILER  END ==========")
        console.log("=====================================\x1B[0m\n")
    
    } else {
        console.log(`\x1B[0;32mArtifacts not changed -- No compilation necessary\n\x1B[0m`);
    }
    
    if (process.argv[2] === "startRun" || startRun) {
        await sleeper(500);
        console.log("Resuming ...\n")
        await sleeper(500)
    }

    return true;

}