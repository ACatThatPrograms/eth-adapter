// Contents of the file /rollup.config.js
import typescript from "rollup-plugin-typescript2";
import nodeResolve from "@rollup/plugin-node-resolve";

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
            // Decisive dist building is based on the presence of the digesting package.json's "type" key
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
        plugins: [nodeResolve(), typescript({ tsconfig: path.resolve(__dirname) + "/tsconfig.json" })],
    },
];
export default config;
