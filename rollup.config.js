// Contents of the file /rollup.config.js
import typescript from 'rollup-plugin-typescript2';
import dts from "rollup-plugin-dts";

const config = [
  {
    input: './src/index.ts',
    output: {
      file: './dist/index.js',
      format: 'cjs',
      sourcemap: true,
    },
    external: ['ethers'],
    plugins: [typescript()]
  }, {
    input: './dist/src/index.d.ts',
    output: {
      file: './dist/index.d.ts',
      format: 'es'
    },
    plugins: [dts()]
  }
];
export default config;