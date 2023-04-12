import { car, cdr, cons, isBox, isClosure, isContinuation, isPair, isPrimitive, isRecord, isSubroutine, lengthOfList, Pair, Primitive, QuoteCtrl, Sexp, toString, ValueCtrl } from '../sexp/sexp';
import { XBeginCtrl, XCallCtrl, XCtrl, XIfCtrl, XLetCtrl, XProcCtrl } from './normalize';

export const transform = (sexp: Sexp): XCtrl => {
    if (isPrimitive(sexp)) {
        return transformPrimitive(sexp);
    }

    if (isPair(sexp)) {
        const tag = car(sexp);
        switch (tag) {
            case Symbol.for('quote'):
                return transformQuote(sexp);
            case Symbol.for('f'):
                return transformProc(sexp);
            case Symbol.for('let'):
                return transformLet(sexp);
            case Symbol.for('if'):
                return transformIf(sexp);
            case Symbol.for('begin'):
                return transformBegin(sexp);
            default:
                return transformCall(sexp);
        }
    }

    if (isBox(sexp)) {
        return transformCall(cons(sexp, cons(null, null)));
    }

    if (isRecord(sexp)) {
        return transformQuote(cons(Symbol.for('quote'), cons(sexp, null)));
    }

    if (isClosure(sexp) || isContinuation(sexp) || isSubroutine(sexp)) {
        return transformQuote(cons(Symbol.for('quote'), cons(sexp, null)));
    }

    const neverReach: never = sexp;
    throw Error('never reach');
};

const transformPrimitive = (sexp: Primitive): ValueCtrl => {
    if (typeof sexp === 'symbol') {
        return {
            type: 'REF',
            variable: sexp
        };
    }
    return {
        type: 'QUOTE',
        value: sexp
    };
};

const transformQuote = (sexp: Pair): QuoteCtrl => {
    if (lengthOfList(sexp) !== 2) {
        throw Error(`illegal quote form: ${toString(sexp)}`);
    }

    const value = car(cdr(sexp));
    return {
        type: 'QUOTE',
        value
    };
};

const transformProc = (sexp: Pair): XProcCtrl => {
    if (lengthOfList(sexp) < 3) {
        throw Error(`illegal procedure form: ${toString(sexp)}`);
    }

    const variableSexps = car(cdr(sexp));
    const variables: symbol[] = [];
    for (let rest = variableSexps; isPair(rest); rest = cdr(rest)) {
        const p = car(rest);
        if (typeof p !== 'symbol') {
            throw Error(`parameter must be symbol but got: ${toString(p)}`);
        }
        variables.push(p);
    }

    const ctrlSexps = cdr(cdr(sexp));
    const ctrls: XCtrl[] = [];
    for (let rest = ctrlSexps; isPair(rest); rest = cdr(rest)) {
        ctrls.push(transform(car(rest)));
    }

    return { type: 'PROC', variables, ctrls };
};

const transformCall = (sexp: Pair): XCallCtrl => {
    if (lengthOfList(sexp) < 2) {
        throw Error(`illegal procedure call form: ${toString(sexp)}`);
    }

    const callee = transform(car(sexp));

    const argSexps = cdr(sexp);
    const args: XCtrl[] = [];
    for (let rest = argSexps; isPair(rest); rest = cdr(rest)) {
        args.push(transform(car(rest)));
    }

    return { type: 'CALL', callee, args };
};

const transformLet = (sexp: Pair): XLetCtrl => {
    if (lengthOfList(sexp) < 3) {
        throw Error(`illegal let form: ${toString(sexp)}`);
    }

    const bindingSexps = car(cdr(sexp));
    if (!isPair(bindingSexps) && bindingSexps != null) {
        throw Error(`illegal let form: ${toString(sexp)}`);
    }

    const bindings: [symbol, XCtrl][] = [];
    for (let rest: Sexp = bindingSexps; isPair(rest); rest = cdr(rest)) {
        const binding = car(rest);
        if (!isPair(binding) || lengthOfList(binding) !== 2) {
            throw Error(`illegal let form: ${toString(sexp)}`);
        }

        const variable = car(binding);
        if (typeof variable !== 'symbol') {
            throw Error(`illegal let form: ${toString(sexp)}`);
        }

        const value = transform(car(cdr(binding)));
        bindings.push([variable, value]);
    }

    const bodySexps = cdr(cdr(sexp));
    const bodies: XCtrl[] = [];
    for (let rest = bodySexps; isPair(rest); rest = cdr(rest)) {
        bodies.push(transform(car(rest)));
    }

    return { type: 'LET', bindings, bodies };
};

const transformIf = (sexp: Pair): XIfCtrl => {
    if (lengthOfList(sexp) < 3 || lengthOfList(sexp) > 4) {
        throw Error(`illegal if form: ${toString(sexp)}`);
    }

    const test = transform(car(cdr(sexp)));
    const ifTrue = transform(car(cdr(cdr(sexp))));
    const ifFalseForm = cdr(cdr(cdr(sexp)));
    const ifFalse = transform(ifFalseForm == null ? null : car(ifFalseForm));
    return { type: 'IF', test, ifTrue, ifFalse };
};

const transformBegin = (sexp: Pair): XBeginCtrl => {
    if (lengthOfList(sexp) < 2) {
        throw Error(`illegal begin form: ${toString(sexp)}`);
    }

    const ctrlSexps = cdr(sexp);
    const ctrls: XCtrl[] = [];
    for (let rest = ctrlSexps; isPair(rest); rest = cdr(rest)) {
        ctrls.push(transform(car(rest)));
    }

    return { type: 'BEGIN', ctrls };
};
