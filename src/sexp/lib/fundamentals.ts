import { Env, Sexp, car, cdr, cons, isPair, refer } from '../sexp';

const buildEnv = (mapping: { [variable: string]: Sexp; }): Env => {
    let result: Env | null = null;
    for (const [varStr, value] of Object.entries(mapping)) {
        result = { parent: result, variable: Symbol.for(varStr), value };
    }
    if (result == null) {
        throw Error('no bindings');
    }
    return result;
};

const dummyEnv = { parent: null, variable: Symbol(), value: null };

export const fundamentals: Env = buildEnv({
    car: { type: 'SUBROUTINE', procedure: car },
    cdr: { type: 'SUBROUTINE', procedure: cdr },
    isPair: { type: 'SUBROUTINE', procedure: isPair },
    cons: {
        type: 'CLOSURE',
        variable: Symbol.for('x'),
        env: dummyEnv,
        ctrl: {
            type: 'PROC',
            variable: Symbol.for('y'),
            ctrl: {
                type: 'CALL',
                callee: {
                    type: 'QUOTE',
                    value: {
                        type: 'SUBROUTINE',
                        procedure: (_, env) => cons(refer(Symbol.for('x'), env), refer(Symbol.for('y'), env))
                    }
                },
                arg: {
                    type: 'QUOTE',
                    value: null
                }
            }
        }
    }
});
