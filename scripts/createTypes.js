import path from "path";
import fs from "fs/promises";
import { exec } from "child_process";
import util from "util";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execPromise = util.promisify(exec);

export const typeCreator = async () => {
    return new Promise(async (res) => {
        try {
            await buildTypes();
            res(true);
        } catch (ex) {
            return res({ error: ex.message });
        }
    });
};

async function buildTypes() {
    try {
        console.log("\n\x1B[1;36mBuilding type declarations...\x1B[0;37m");
        // Path to tsconfig.json
        const tsConfigReadPath = path.resolve(__dirname, "../tsconfig.json");
        const tsConfigWritePath = path.resolve(__dirname, "../tsconfig.types.json");
        // Read the tsconfig.json file
        const tsConfigContent = await fs.readFile(tsConfigReadPath, "utf8");
        const tsConfig = JSON.parse(tsConfigContent);
        // Set emitDeclarationOnly to true programmatically in case they do not exist
        tsConfig.compilerOptions.emitDeclarationOnly = true;
        tsConfig.compilerOptions.declaration = true;
        // Write the modified tsconfig back to a new file
        await fs.writeFile(tsConfigWritePath, JSON.stringify(tsConfig, null, 2));
        // Run the TypeScript compiler programmatically using tsc
        const { stdout, stderr } = await execPromise(`npx tsc --project ${tsConfigWritePath}`);
        if (stderr) {
            console.error(stderr);
        }
        console.log(stdout);
    } catch (ex) {
        throw new Error(`TypeScript compilation failed: ${ex.message}`);
    }
}
