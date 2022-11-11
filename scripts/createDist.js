import { rollup } from 'rollup';
import { loadConfigFile } from 'rollup/loadConfigFile'

// Es6 Path resolve
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const distMaker = async () => {
    return new Promise(res => {
        try {
            build();
        } catch (ex) {
            return res({ error: ex.message })
        }
        async function build() {
            loadConfigFile(path.resolve(__dirname + '/../rollup.config.js'), { format: 'es' }).then(
                async ({ options, warnings }) => {
                    // console.log(options, warnings)
                    // Set output based on env
                    if (process.env.ETH_ADAPTER_USE_CJS === "TRUE") {
                        options[0].output = "cjs";
                    }
                    console.log(`We currently have ${warnings.count} warnings`);
                    warnings.flush();
                    for (const optionsObj of options) {
                        const bundle = await rollup(optionsObj);
                        await Promise.all(optionsObj.output.map(bundle.write));
                    }
                    res(true);
                }
            );

        }
    })
}