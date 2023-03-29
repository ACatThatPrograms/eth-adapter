import fs from 'fs/promises';
import ethers from 'ethers'
import path from 'path';
import { loadConfig } from './configHandling.js';

// Reads all artifact files and config file and creates a hash to diff any changes
export async function getArtifactsHash() {
    const allFilesHashes = [];
    const artifactDirFiles = await fs.readdir(path.resolve(process.cwd() + '/artifacts'))
    for (const filename of artifactDirFiles) {
        if (filename === "artifactHash") {
            continue;
        }
        let artifactRead = (await fs.readFile(path.resolve(process.cwd() + '/artifacts/' + filename)));
        allFilesHashes.push(ethers.utils.keccak256(artifactRead))
    }
    // Read the config file and hash it as well -- Updates should be made if it mismatches
    // CHECK FOR A FAIL HERE!
    let configAsString = JSON.stringify(await loadConfig());
    // Join everything
    const joinedHashes = allFilesHashes.join("") + configAsString; 
    const finalHash = ethers.utils.keccak256(Buffer.from(joinedHashes))
    return finalHash;
}

export async function writeHashFile(dataToWrite) {
    fs.writeFile(path.resolve(process.cwd() + '/' + ".artifactsHash"), dataToWrite)
}

export async function checkArtifactsForHash() {
    try {
        let readHash = (await fs.readFile(path.resolve(process.cwd() + '/' + ".artifactsHash"))).toString()
        let artifactHash = await getArtifactsHash()
        if (readHash !== artifactHash) {
            console.log(`\x1B[1;33mArtifacts hash or configuration change detected -- Beginning transpile.\n\x1B[0m`);
        }
        return readHash !== artifactHash
    } catch (ex) {
        if (ex.message.indexOf("no such file or directory") !== -1) {
            console.log(`\x1B[1;33mArtifacts hash not available for diff checking -- First transpile must complete.\n\x1B[0m`);
            return true;
        } else {
            throw(ex);
        }
    }
}