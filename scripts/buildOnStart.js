// import { buildBytecodeFiles } from './buildBytecodeFiles.js';
import { buildAbiAndContractNameFiles } from './buildAbiAndContractNameFiles.js';
import { buildMethods } from './buildMethods.js';
import { distMaker } from './createDist.js';
import fs from 'fs/promises';
const sleeper = (amt) => ((new Promise(res => setTimeout(res, amt))));

// Es6 Path resolve
import path, { join } from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @param {*} startRun - Is this a run cycle for pre-npm start?
 * @param {*} suppressCfgMsg - Should we suppress the config runner message?
 */
export async function buildOnStart(startRun = false, suppressCfgMsg = false) {

    let artifactsHaveChanged = await checkArtifactsForHash();

    if (artifactsHaveChanged) {
        
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
        await configBuildModule.buildContractConfig();

        await sleeper(1500);
        console.log("\x1B[33mBuilding eth-adapter /dist...\n");
        let distRes = await distMaker();

        if (!!distRes.error) {
        console.log("\x1B[31mError creating dist");
        console.log(distRes.error)
        return
        }

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

}

async function checkArtifactsForHash() {

    const getArtifactsHash = async () => {
        const allFilesHashes = [];
        const artifactDirFiles = await fs.readdir(path.resolve(process.cwd() + '/artifacts'))
        for (const filename of artifactDirFiles) {
            if (filename === "artifactHash") {
                continue;
            }
            let artifactRead = (await fs.readFile(path.resolve(process.cwd() + '/artifacts/' + filename)));
            allFilesHashes.push(ethers.utils.keccak256(artifactRead))
        }
        const joinedHashes = allFilesHashes.join("")
        const finalHash = ethers.utils.keccak256(Buffer.from(joinedHashes))
        return finalHash;
    }

    try {
        let readHash = (await fs.readFile(path.resolve(process.cwd() + '/' + ".artifactsHash"))).toString()
        return readHash !== await getArtifactsHash()
    } catch (ex) {
        if (ex.message.indexOf("no such file or directory") !== -1) {
            // Write the hash if it doesn't exist
            console.log(`\x1B[1;33mWrote first artifact hash to .artifactsHash in root for tracking artifact changes\n\x1B[0m`);
            fs.writeFile(path.resolve(process.cwd() + '/' + ".artifactsHash"), await getArtifactsHash())
        } else {
            throw(ex);
        }
    }


}