import { BeginCtrl, BeginKont, CallCtrl, Closure, Ctrl, Env, IfCtrl, isClosure, isContinuation, isPrimitive, isSubroutine, isTruthy, Kont, Let1Ctrl, ProcCtrl, QuoteCtrl, RefCtrl, refer, Sexp, ValueCtrl } from '../sexp/sexp';


export type State = MiddleState | FinalState;

export type MiddleState = {
    type: 'MIDDLE';
    ctrl: Ctrl;
    env: Env;
    kont: Kont;
};

export type FinalState = {
    type: 'DONE';
    value: Sexp;
};

export const run = (state: State): FinalState => {
    let s = state;
    while (s.type !== 'DONE') {
        s = transfer(s);
    }
    return s;
};

const transfer = (state: MiddleState): State => {
    const { ctrl, env, kont } = state;
    switch (ctrl.type) {
        case 'QUOTE':
            return transferQuote(ctrl, env, kont);
        case 'REF':
            return transferRef(ctrl, env, kont);
        case 'PROC':
            return transferProc(ctrl, env, kont);
        case 'CALL':
            return transferCall(ctrl, env, kont);
        case 'LET1':
            return transferLet1(ctrl, env, kont);
        case 'IF':
            return transferIf(ctrl, env, kont);
        case 'BEGIN':
            return transferBegin(ctrl, env, kont);
        default:
            const neverReach: never = ctrl;
            throw neverReach;
    }
};

const transferQuote = ({ value }: QuoteCtrl, _: Env, kont: Kont): State => {
    return applyKont(kont, value);
};

const transferRef = ({ variable }: RefCtrl, env: Env, kont: Kont): State => {
    return applyKont(kont, refer(variable, env));
};

const transferProc = ({ variable, ctrl }: ProcCtrl, env: Env, kont: Kont) => {
    return applyKont(kont, { type: 'CLOSURE', variable, env, ctrl });
};

const transferCall = ({ callee, arg }: CallCtrl, env: Env, kont: Kont): State => {
    const callable = solve(callee, env);
    const value = solve(arg, env);
    if (isPrimitive(callable)) {
        throw Error(`${callee} is not callable`);
    }
    if (!isClosure(callable) && !isContinuation(callable) && !isSubroutine(callable)) {
        throw Error(`${callable} is not callable`);
    }
    if (isContinuation(callable)) {
        return applyKont(callable.kont, value);
    }
    if (isSubroutine(callable)) {
        return applySubroutine(callable.procedure, value, env, kont);
    }
    return applyClosure(callable, value, kont);
};

const transferLet1 = ({ variable, expr, body }: Let1Ctrl, env: Env, kont: Kont): State => {
    return { type: 'MIDDLE', ctrl: expr, env, kont: { type: 'LET1', variable, env, ctrl: body, kont } };
};

const transferIf = ({ test, ifTrue, ifFalse }: IfCtrl, env: Env, kont: Kont): State => {
    const testValue = solve(test, env);
    return { type: 'MIDDLE', ctrl: isTruthy(testValue) ? ifTrue : ifFalse, env, kont };
};

const transferBegin = ({ ctrls: [ctrl, ...ctrls] }: BeginCtrl, env: Env, kont: Kont): State => {
    return { type: 'MIDDLE', ctrl, env, kont: ctrls.length ? buildBeginKont(ctrls, env, kont) : kont };
};

const applyKont = (kont: Kont, value: Sexp): State => {
    if (kont == null) {
        return { type: 'DONE', value };
    }
    switch (kont.type) {
        case 'BEGIN': {
            const { env, ctrl, kont: next } = kont;
            return { type: 'MIDDLE', ctrl, env, kont: next };
        }
        case 'LET1': {
            const { variable, env: parent, ctrl, kont: next } = kont;
            return { type: 'MIDDLE', ctrl, env: { parent, variable, value }, kont: next };
        }
        default:
            const neverReach: never = kont;
            throw neverReach;
    }
};

const applySubroutine = (subroutine: (sexp: Sexp, env: Env) => Sexp, value: Sexp, env: Env, kont: Kont): State => {
    const result = subroutine(value, env);
    return applyKont(kont, result);
};

const applyClosure = (closure: Closure, arg: Sexp, kont: Kont): State => {
    const { variable, env: parent, ctrl } = closure;
    return { type: 'MIDDLE', ctrl, env: { parent, variable, value: arg }, kont };
};

const buildBeginKont = ([ctrl0, ...ctrls]: Ctrl[], env: Env, kont: Kont): Kont => {
    const result: BeginKont = { type: 'BEGIN', env, ctrl: ctrl0, kont };
    let acc = result;
    for (const ctrl of ctrls) {
        const kontI = { type: 'BEGIN', env, ctrl, kont: acc.kont } as const;
        acc.kont = kontI;
        acc = kontI;
    }
    return result;
};

const solve = (ctrl: ValueCtrl, env: Env): Sexp => {
    switch (ctrl.type) {
        case 'QUOTE':
            return ctrl.value;
        case 'REF':
            return refer(ctrl.variable, env);
        default:
            const neverReach: never = ctrl;
            throw neverReach;
    }
};
