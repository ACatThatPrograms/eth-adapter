import { spawn } from 'child_process';

export const distMaker = async () => {
    return new Promise(res => {

        let distChild = spawn('bash');

        distChild.stdout.on("data", (data) => {
            if (data.indexOf("Done in") !== -1) {
                res({error: false});
                console.log(`\x1B[0;32mDist Successfully Created at *eth-adapter/dist/index.js\n\x1B[0m`);
                distChild.kill();
            } else {
                console.log(data.toString());
            }
        })

        const errResp = (err) => {
            console.log(err.toString());
            err = err.toString();
            res({ error: err, child: distChild })
        }

        distChild.stdout.on("error", errResp)

        distChild.stderr.on("data", (data) => {
            console.log(data.toString());
        })

        distChild.stderr.on("error", errResp)

        distChild.stdin.write('cd node_modules\n');
        distChild.stdin.write('cd eth-adapter\n');
        distChild.stdin.write('yarn build\n');
    })
}

