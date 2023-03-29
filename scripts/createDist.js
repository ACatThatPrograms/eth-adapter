import { rollup } from "rollup";
import { loadConfigFile } from "rollup/loadConfigFile";
import fs from "fs/promises";

// Es6 Path resolve
import path from "path";
import { fileURLToPath } from "url";
import { colorBash } from "./util/util.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getDistOutputOptions = (isCommonJsModule) => {
    return !isCommonJsModule
        ? {
              file: path.resolve(__dirname + "/../dist/es6/index.mjs"),
              format: "es",
              sourcemap: true,
          }
        : {
              file: path.resolve(__dirname + "/../dist/cjs/index.cjs"),
              format: "cjs",
              sourcemap: true,
              exports: "named",
          };
};

const removeDistFiles = async () => {
    console.log(`${colorBash.yellow}Removing old dist files, if any...`);
    try {
        await fs.rm(__dirname + "/../dist/es6/", { recursive: true });
    } catch (ex) {
        if (ex.message.indexOf("no such file") === -1) {
            throw new Error(ex)
        }
    }
    try {
        await fs.rm(__dirname + "/../dist/cjs/", { recursive: true });
    } catch (ex) {
        if (ex.message.indexOf("no such file") === -1) {
            throw new Error(ex)
        }
    }
};

const updateTypeLocationInPackage = async (isCommonJsModule) => {
    let ethAdapterPackageJson = JSON.parse(await fs.readFile(__dirname + "/../package.json"));
    ethAdapterPackageJson.types = isCommonJsModule ? "dist/cjs/src/index.d.ts" : "dist/es6/src/index.d.ts"
    await fs.writeFile(__dirname + "/../package.json", JSON.stringify(ethAdapterPackageJson, false, 2));
}

export const distMaker = async () => {
    return new Promise((res) => {
        try {
            build();
        } catch (ex) {
            return res({ error: ex.message });
        }
        async function build() {
            loadConfigFile(path.resolve(__dirname + "/../rollup.config.js") /*,{ format: "es" }*/).then(
                async ({ options, warnings }) => {
                    // Remove old dists
                    await removeDistFiles();
                    // Determine env based on package.json's type:"commonjs" presense, defaults to ES6 Dist
                    let packageJson = JSON.parse(await fs.readFile(process.cwd() + "/package.json"));
                    let isCommonJsModule = packageJson.type && packageJson.type === "commonjs";
                    console.log(`\n\x1B[1;36mBuilding eth-adapter dist as ${isCommonJsModule ? "commonjs module" : "es6 module"}\x1B[0;37m`);
                    if (!isCommonJsModule) {
                        console.log(
                            `\n${colorBash.yellow}If you need require() and prefer commonjs modules: Include "type":"commonjs" in your package.json${colorBash.reset}`
                        );
                    }
                    // Set output options based on env
                    const newDistOpts = { ...options[0].output["0"], ...getDistOutputOptions(isCommonJsModule) };
                    options[0].output = [newDistOpts];
                    // Update eth-adapter package.json to reflect correct typing location
                    updateTypeLocationInPackage(isCommonJsModule)
                    console.log(`${warnings.count > 0 ? `\x1B[1;33m` : ""}\nCurrently have ${warnings.count} warnings\x1B[0;37m`);
                    warnings.flush();
                    try {
                        for (const optionsObj of options) {
                            const bundle = await rollup(optionsObj);
                            await Promise.all(optionsObj.output.map(bundle.write));
                        }
                    } catch (ex) {
                        throw new Error(ex)
                    }
                    res(true);
                }
            );
        }
    });
};
