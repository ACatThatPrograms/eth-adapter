// Contents of the file /rollup.config.js
import typescript from 'rollup-plugin-typescript2';
// import typescript from '@rollup/plugin-typescript'
import dts from "rollup-plugin-dts";
import nodeResolve from '@rollup/plugin-node-resolve';

// Es6 Path resolve
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = [
    {
        input: path.resolve(__dirname + '/src/index.ts'),
        output: {
            file: path.resolve(__dirname + '/dist/index.js'),
            format: 'es',
            sourcemap: true,
        },
        external: ['ethers'],
        plugins: [nodeResolve(), typescript({ tsconfig: path.resolve(__dirname) + '/tsconfig.json' })],
    }
];
export default config;