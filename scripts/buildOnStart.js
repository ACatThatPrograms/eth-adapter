// import { buildBytecodeFiles } from './buildBytecodeFiles.js';
import { buildAbiAndContractNameFiles } from './buildAbiAndContractNameFiles.js';
import { buildMethods } from './buildMethods.js';
import { distMaker } from './createDist.js';
import { compareArtifactHashes, compareConfigHashes, updateArtifactHash } from './util/hashHandling.js';
const sleeper = (amt) => ((new Promise(res => setTimeout(res, amt))));

// Es6 Path resolve
import path from 'path';
import { fileURLToPath } from 'url';
import { loadConfig, requestAddressConfigUpdate } from './util/configHandling.js';
import { colorBash } from './util/util.js';
import { determineForcePackageLockUpdate } from './forcePackageLockUpdate.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function buildOnStart() {

    // Load eth-adapter config && check artifacts hash for differences
    let ethAdapterConfig = await loadConfig()
    const artifactsHaveChanged = await compareArtifactHashes();
    const configHasUpdated = await compareConfigHashes();

    if (artifactsHaveChanged) {
        console.log(`\x1B[1;33mArtifacts change detected -- Beginning transpile.\n\x1B[0m`);
    }

    if (ethAdapterConfig.alwaysCompile) {
        console.log(`${colorBash.yellowB}"alwaysCompile" detected\n${colorBash.yellow}- You can limit transpilation to artifact or configuration updates by setting alwaysCompile to false\x1B[33m\n`);
    }

    if (artifactsHaveChanged || configHasUpdated || ethAdapterConfig.alwaysCompile) {

        if (!!ethAdapterConfig && artifactsHaveChanged) {
            let newConf = await requestAddressConfigUpdate()
            ethAdapterConfig = newConf ? newConf : ethAdapterConfig;
        }

        console.log(`\n${colorBash.yellowB}=====================================`)
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
        const configSuccess = await configBuildModule.buildContractConfig();

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
        await updateArtifactHash();

        console.log(`\n${colorBash.greenB}Dist Successfully Created At:${colorBash.cyan} ${process.cwd()}/node_modules/eth-adapter/dist/\n`);

        console.log(`${colorBash.yellowB}=====================================`)
        console.log("========== TRANSPILER  END ==========")
        console.log(`=====================================${colorBash.reset}`)
    
        // await determineForcePackageLockUpdate(ethAdapterConfig);

    } else {
        console.log(`${colorBash.cyan}No update detected for artifacts or configuration - No compilation necessary\x1B[0m`);
    }

    return true;

}