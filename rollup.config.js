// Contents of the file /rollup.config.js
import typescript from "@rollup/plugin-typescript";

// Es6 Path resolve
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = [
    {
        input: path.resolve(__dirname + "/src/index.ts"),
        output: [
            // IMPORTANT: DO NOT MODIFY THIS ARRAY -- SEE scripts/distBuilder
            // Decisive dist building is based on the presence of the digesting package.json's "type" key -- see createDist in ./scripts
            {
                file: path.resolve(__dirname + "/dist/es6/index.mjs"),
                format: "es",
                sourcemap: true,
            },
            // For debugging --
            // {
            //     file: path.resolve(__dirname + "/dist/cjs/index.cjs"),
            //     format: "cjs",
            //     sourcemap: true,
            //     exports: "named"
            // },
        ],
        external: ["ethers"],
        plugins: [
            typescript({ tsconfig: path.resolve(__dirname) + "/tsconfig.json", include: ["**/*.ts", "**/*.tsx"] }),
        ],
    },
];
export default config;
