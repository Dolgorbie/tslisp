import { BodyCtrl, CallCtrl, Ctrl, ExprCtrl, ProcCtrl, ValueCtrl } from '../sexp/sexp';

export type XCtrl =
    ValueCtrl
    | XProcCtrl
    | XCallCtrl
    | XLetCtrl
    | XIfCtrl
    | XBeginCtrl;


export type XProcCtrl = {
    type: 'PROC';
    variables: symbol[];
    ctrls: XCtrl[];
};

export type XCallCtrl = {
    type: 'CALL';
    callee: XCtrl;
    args: XCtrl[];
};

export type XLetCtrl = {
    type: 'LET';
    bindings: [symbol, XCtrl][];
    bodies: XCtrl[];
};

export type XIfCtrl = {
    type: 'IF';
    test: XCtrl;
    ifTrue: XCtrl;
    ifFalse: XCtrl;
};

export type XBeginCtrl = {
    type: 'BEGIN';
    ctrls: XCtrl[];
};

type Cont<T, U> = (x: T) => U;

export const normalize = (xctrl: XCtrl): Ctrl => {
    return normalizeExpr(xctrl, id);
};

const normalizeExpr = <T extends Ctrl>(xctrl: XCtrl, cont: Cont<ExprCtrl, T>): T | BodyCtrl => {
    switch (xctrl.type) {
        case 'QUOTE':
        case 'REF':
            return cont(xctrl);
        case 'PROC':
            return normalizeProc(xctrl, cont);
        case 'CALL':
            return normalizeCall(xctrl, cont);
        case 'LET':
            return normalizeLet(xctrl, cont);
        case 'IF':
            return normalizeIf(xctrl, cont);
        case 'BEGIN':
            return normalizeBegin(xctrl, cont);
        default: {
            const neverReach: never = xctrl;
            throw neverReach;
        }
    }
};

const normalizePrimitive = <T extends Ctrl>(xctrl: XCtrl, cont: Cont<ValueCtrl, T>): T | BodyCtrl => {
    switch (xctrl.type) {
        case 'QUOTE':
        case 'REF':
            return cont(xctrl);
        default: {
            const variable = gensym('__SYS__tmp-');
            return normalizeExpr(xctrl, expr => ({
                type: 'LET1',
                variable,
                expr,
                body: cont({ type: 'REF', variable })
            }));
        }
    }
};

const normalizeProc = <T>({ variables: [variable, ...variables], ctrls }: XProcCtrl, cont: Cont<ProcCtrl, T>): T => {
    const last = normalizeExpr({ type: 'BEGIN', ctrls }, id);
    const ctrl = variables.reduceRight<Ctrl>((ctrl, variable) => ({
        type: 'PROC',
        variable,
        ctrl
    }), last);

    return cont({ type: 'PROC', variable, ctrl });
};

const normalizeCall = <T extends Ctrl>({ callee, args: [arg, ...args] }: XCallCtrl, cont: Cont<CallCtrl, T>): T | BodyCtrl => {
    return args.length
        ? normalizePrimitive({ type: 'CALL', callee, args: [arg] },
            callee => normalizeCall({ type: 'CALL', callee, args }, cont))
        : normalizePrimitive(callee,
            callee => normalizePrimitive(arg,
                arg => cont({
                    type: 'CALL',
                    callee,
                    arg
                })));
};

const normalizeLet = <T extends Ctrl>({ bindings: [[variable, expr], ...bindings], bodies }: XLetCtrl, cont: Cont<ExprCtrl, T>): BodyCtrl => {
    const renamed = gensym(`__SYS__${variable.toString()}-`);
    const renamedBegin = rename(variable, renamed, { type: 'BEGIN', ctrls: bodies });
    const nextLet: XLetCtrl = { type: 'LET', bindings, bodies: [renamedBegin] };

    return normalizeExpr(expr, expr => ({
        type: 'LET1',
        variable: renamed,
        expr,
        body: normalizeExpr(bindings.length ? nextLet : renamedBegin, cont)
    }));
};


const normalizeIf = <T extends Ctrl>({ test, ifTrue, ifFalse }: XIfCtrl, cont: Cont<ExprCtrl, T>): BodyCtrl => {
    return normalizePrimitive(test, test => ({
        type: 'IF',
        test,
        ifTrue: normalizeExpr(ifTrue, cont),
        ifFalse: normalizeExpr(ifFalse, cont)
    }));
};

const normalizeBegin = <T extends Ctrl>({ ctrls }: XBeginCtrl, cont: Cont<ExprCtrl, T>): T | BodyCtrl => {
    const [first, ...rest] = ctrls;
    const last = rest.at(-1);
    return last != null
        ? {
            type: 'BEGIN',
            ctrls: [
                ...ctrls.slice(0, -1).map(c => normalizeExpr(c, id)),
                normalizeExpr(last, cont)
            ]
        }
        : normalizeExpr(first, cont);
};


let counter = 0;
const gensym = (prefix: string = '', suffix: string = ''): symbol => {
    return Symbol.for(`${prefix}${counter++}${suffix}`);
};

const rename = (target: symbol, after: symbol, xctrl: XCtrl): XCtrl => {
    switch (xctrl.type) {
        case 'QUOTE':
            return xctrl;
        case 'REF':
            if (xctrl.variable === target) {
                return { type: 'REF', variable: after };
            } else {
                return xctrl;
            }
        case 'PROC':
            return {
                type: 'PROC',
                variables: xctrl.variables.map(v => v === target ? after : v),
                ctrls: xctrl.ctrls.map(ctrl => rename(target, after, ctrl))
            };
        case 'CALL':
            return {
                type: 'CALL',
                callee: rename(target, after, xctrl.callee),
                args: xctrl.args.map(arg => rename(target, after, arg))
            };
        case 'LET':
            return {
                type: 'LET',
                bindings: xctrl.bindings.map(([v, e]) => [v === target ? after : v, e]),
                bodies: xctrl.bodies.map(body => rename(target, after, body))
            };
        case 'IF':
            return {
                type: 'IF',
                test: rename(target, after, xctrl.test),
                ifTrue: rename(target, after, xctrl.ifTrue),
                ifFalse: rename(target, after, xctrl.ifFalse)
            };
        case 'BEGIN':
            return {
                type: 'BEGIN',
                ctrls: xctrl.ctrls.map(ctrl => rename(target, after, ctrl))
            };
        default: {
            const neverReach: never = xctrl;
            throw neverReach;
        }
    }
};

const id = <T>(x: T): T => x;
