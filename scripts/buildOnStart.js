// import { buildBytecodeFiles } from './buildBytecodeFiles.js';
import { buildAbiAndContractNameFiles } from './buildAbiAndContractNameFiles.js';
import { buildMethods } from './buildMethods.js';
import { distMaker } from './createDist.js';
import { checkArtifactsForHash, getArtifactsHash, writeHashFile } from '../util/hashHandling.js';
const sleeper = (amt) => ((new Promise(res => setTimeout(res, amt))));

// Es6 Path resolve
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from '../util/configHandling.js';
import { colorBash } from '../util/util.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function buildOnStart() {

    // Load eth-adapter config && check artifacts hash for differences
    const ethAdapterConfig = await loadConfig()
    const artifactsHaveChanged = await checkArtifactsForHash();

    if (ethAdapterConfig.alwaysCompile) {
        console.log(`${colorBash.yellowB}"alwaysCompile" detected\n${colorBash.yellow}- You can limit transpilation to artifact or configuration updates by setting alwaysCompile to false\x1B[33m\n`);
    }

    if (artifactsHaveChanged || ethAdapterConfig.alwaysCompile) {
        
        console.log(`${colorBash.yellowB}=====================================`)
        console.log("========= TRANSPILER  START =========")
        console.log(`=====================================${colorBash.reset}`)

        console.log(`\n\x1B[36mPreparing to transpile ABI and Contract Names to ES6 formats to ${path.resolve(__dirname + '/../adapter/')}\x1B[33m\n`);
        await sleeper(1500);

        console.log("Transpiling ABI and Contract names to ES6 Syntax...\n");
        const ABIS = await buildAbiAndContractNameFiles();

        // TODO: Make conditional and include create2() address returns from using bytecode
        // await sleeper(1500);
        // console.log("\x1B[33mTranspiling Bytecodes to ES6 Syntax...\n");
        // await buildBytecodeFiles();

        await sleeper(1500);
        console.log("\x1B[33mExtracting Methods from Transpiled Contract Configuration...\n")
        await buildMethods(ABIS)

        await sleeper(1500);
        console.log("\x1B[33mBuilding Contract Configuration Files...\n");
        let configBuildModule = await import('../scripts/buildContractConfig.js');
        const configSuccess = await configBuildModule.buildContractConfig(ethAdapterConfig);

        if (!configSuccess) { 
            console.log("\n\x1B[31mError creating contract configuration. See logs\n");
            return false
        }

        await sleeper(1500);
        let distRes = await distMaker();

        if (!!distRes.error) {
            console.log("\n\x1B[31mError creating dist:");
            console.log(distRes.error)
            return false
        }

        // If no dist error -- Write the latest hash for comparing
        await writeHashFile(await getArtifactsHash())

        console.log(`\n${colorBash.greenB}Dist Successfully Created At:${colorBash.cyan} ${process.cwd()}/node_modules/eth-adapter/dist/\n`);

        console.log(`${colorBash.yellowB}=====================================`)
        console.log("========== TRANSPILER  END ==========")
        console.log(`=====================================${colorBash.reset}`)
    
    } else {
        console.log(`\x1B[0;32mArtifacts not changed -- No compilation necessary\n\x1B[0m`);
    }

    return true;

}