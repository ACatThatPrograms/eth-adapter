import fs from 'fs/promises';
import ethers from 'ethers'
import path from 'path';
import { loadConfig, writeConfigFile } from './configHandling.js';
import { colorBash } from './util.js';

/**
 * Gets freshly generated artifact and config hashes and returns them as an object
 */
export async function generateArtifactsAndConfigHash() {
    return {
        artifactsHash: await generateArtifactHashFromArtifacts(),
        configHash: await generateConfigHashFromConfig()
    };
}

/**
 * Generate an artifacts hash based on all files within the artifacts/ folder
 */
export async function generateArtifactHashFromArtifacts() {
    const allFilesHashes = [];
    const artifactDirFiles = await fs.readdir(path.resolve(process.cwd() + '/artifacts'))
    for (const filename of artifactDirFiles) {
        let artifactRead = (await fs.readFile(path.resolve(process.cwd() + '/artifacts/' + filename)));
        allFilesHashes.push(ethers.utils.keccak256(artifactRead))
    }
    const joinedFileHash = ethers.utils.keccak256(Buffer.from(allFilesHashes.join("")));
    return joinedFileHash;
}

/**
 * Generate a configuration hash based on the config data omitting the config hash key:value
 */
export async function generateConfigHashFromConfig() {
    let config = await loadConfig();
    config.hashes.config = "";
    return ethers.utils.keccak256(Buffer.from(JSON.stringify(config)));
}

/**
 * Generate a freshly generated artifact hash against the artifact hash stored in the configuration file
 */
export async function compareArtifactHashes() {
    try {
        let hashAsStored = (await loadConfig()).hashes.artifacts;
        let artifactsHash = await generateArtifactHashFromArtifacts()
        return hashAsStored !== artifactsHash
    } catch (ex) {
        throw(ex);
    }
}

/**
 * Generate a freshly generated configuration hash against the config hash stored in the configuration file
 */
export async function compareConfigHashes() {
    try {
        let hashAsStored = (await loadConfig()).hashes.config;
        let configHash = await generateConfigHashFromConfig();
        return hashAsStored !== configHash
    } catch (ex) {
        throw(ex);
    }
}

/**
 * Update the artifacts hash in the configuration file with a freshly generated artifacts hash
 * This will in turn call updateConfigHash() due to the change in the hash tree
 */
export async function updateArtifactHash() {
    const artifactsHash = await generateArtifactHashFromArtifacts()
    // Anytime the artifactsHash is updated the config hash must also be recalculated based on it
    return await updateConfigHash(artifactsHash);
}

/**
 * Update the config hash in the config file
 * -- Pass precomputedArtifactHash to use the precompute hash in the config hash generation
 */
export async function updateConfigHash(preComputedArtifactHash) {
    let newConfig = {...(await loadConfig())}
    // Set config hash to "" for hashing
    newConfig.hashes.config = "";
    // Only update artifacts hash if passed in, else assume it has not changed
    if (preComputedArtifactHash) {
        newConfig.hashes.artifacts = preComputedArtifactHash;
    }
    let configHash = ethers.utils.keccak256(Buffer.from(JSON.stringify(newConfig)))
    newConfig.hashes.config = configHash; 
    await writeConfigFile(newConfig);
    console.log(`${colorBash.cyan}Successfully updated the ${preComputedArtifactHash ? `${colorBash.cyanB}artifact${colorBash.cyan} and ` : ""}${colorBash.cyanB}configuration${colorBash.cyan} hashes`)
}