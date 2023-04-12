import readline from 'readline/promises';
import { compile } from './vm/compile';
import { fromString } from './sexp/sexp';
import { State, run } from './vm/vm';
import { fundamentals } from './sexp/lib/fundamentals';

const main = async () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    let state: State = { type: 'DONE', value: null };

    for (; ;) {
        const inputStr = await rl.question('> ');
        console.debug('input', inputStr);
        const [sexp] = fromString(inputStr);
        console.debug('sexp', sexp);
        const ctrl = compile(sexp);
        console.debug('control', ctrl);
        state = run({ type: 'MIDDLE', ctrl, env: fundamentals, kont: null });
        console.debug('state', state);
    }
};

main();
