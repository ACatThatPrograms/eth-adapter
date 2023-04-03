import { readFile, writeFile, readdir, rm } from "fs/promises";
import { lockfileBinEthIncrementorName } from "./util/const.js";
import { colorBash } from "./util/util.js";

/**
 * Webpack will not recompile unless package.json, package-lock.json, or yarn.lock changes
 * We can force this by adding a new bin to the lock entry for eth-adapter when any depedency using webpack is detected
 * It will cause a slow rebuild of the package but is the only option for on the fly transpilation to be detected
 */
export async function determineForcePackageLockUpdate(ethAdapterConfig) {

    // First we need to check for yarn.lock or package.lock
    let lockfileObj = await findLockFile();
    if (lockfileObj.type === false) {
        console.log(`${colorBash.yellowB}Could not find package lockfile -- It may not exist.\nWebpack cache may not clear properly after transpile`)
    }
    // Determine if lockfile has webpack dependency
    let webpackIsDep = determineIsWebpackDependency(lockfileObj);    
    if (webpackIsDep) {
        // console.log(`\n${colorBash.BG_red } WEBPACK Found ${colorBash.lblue} ${lockfileObj.type === "yarn" ? "yarn.lock" : "package-lock.json"}${colorBash.blue} will be used for force re-building webpack cache on new transpiles`)
        // updateLockEntry(lockfileObj)
        console.log(`\n${colorBash.BG_red } WEBPACK Found ${colorBash.lblue} ${lockfileObj.type === "yarn" ? "yarn.lock" : "webpack cache will be cleared after new transpiles"}`)
        clearWebpackCache()
    }

}

async function determineIsWebpackDependency(lockfileObj) {
    let packages = Object.keys(lockfileObj.data.packages);
    let webPackIdx = packages.indexOf("node_modules/webpack");
    if (webPackIdx !== -1) {
        return true;
    }
    return false;
}

async function clearWebpackCache() {
    const cwdNodeCacheDir = process.cwd() + "/node_modules/.cache"
    const cacheFolders = await readdir(cwdNodeCacheDir);

    // Id the target cache files of node_modules/.cache to remove
    // Newly transpiled code will not be in the webpack bundle if node_modules updates without cache being rebuilt
    const targetableDirs = ["default-development"];
    const rmDirs = [];
    cacheFolders.forEach(dirName => {
        if (targetableDirs.indexOf(dirName) !== -1) {
            rmDirs.push(cwdNodeCacheDir + `/${dirName}`)
        }
    })
    console.log("");
    for (let i =0;i < rmDirs.length;i++) {
        let rmDirPath = rmDirs[i]
        console.log(`${colorBash.redB}Removing webpack cache dir: ${colorBash.cyan}${rmDirPath}${colorBash.reset}`)
        await rm(rmDirPath, {recursive: true});
    }
}

async function updateLockEntry(lockfileObj) {
    
    let newLockEntry = {...lockfileObj.data}
    let ethAdapterBinEntry = lockfileObj.data.packages["node_modules/eth-adapter"].bin;
    let hasEthForceCompileIncrementor = !!ethAdapterBinEntry[lockfileBinEthIncrementorName];
    
    if (hasEthForceCompileIncrementor) {
        let newIncrementor = parseInt(
            newLockEntry.packages["node_modules/eth-adapter"].bin[lockfileBinEthIncrementorName]
            ) + 1;
            newIncrementor = newIncrementor === 10 ? 1 : newIncrementor;
            newLockEntry.packages["node_modules/eth-adapter"].bin[lockfileBinEthIncrementorName] = String(newIncrementor);
        } else {
            newLockEntry.packages["node_modules/eth-adapter"].bin[lockfileBinEthIncrementorName] = "1";
        }

        await writeFile(process.cwd() + '/' + lockfileObj.type === "yarn" ? "yarn.lock" : "package-lock.json", Buffer.from(JSON.stringify(newLockEntry, false, 2)));
        
    }


async function determineLockFileType() {
    let yarnLock = false;
    let packageLock = false;
    
    try {
        packageLock = await readFile(process.cwd() + "/package-lock.json");
    } catch (ex) {
        if (ex.message.indexOf("no such file") === -1) {
            throw ex
        }
    }
    
    try {
        yarnLock = await readFile(process.cwd() + "/yarn.lock");
    } catch (ex) {
        if (ex.message.indexOf("no such file") === -1) {
            throw ex;
        }
    }

    return {
        yarnLock: yarnLock,
        packageLock: packageLock
    }
}

async function findLockFile() {

    let { yarnLock, packageLock } = await determineLockFileType()

    if (packageLock && yarnLock) {
        console.log(`${colorBash.redB} Both package-lock.json and yarn.lock found!`)
        throw new Error("Dual lock files found, choose only 1")
    }

    return {
        data: JSON.parse(yarnLock ? yarnLock : packageLock),
        type: yarnLock ? "yarn" : packageLock ? "package" : false
    }

}