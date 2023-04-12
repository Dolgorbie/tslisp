export type Sexp =
    null
    | number
    | bigint
    | boolean
    | string
    | symbol
    | Pair
    | Box
    | Record
    | Closure
    | Continuation
    | Subroutine;

export type Primitive =
    null
    | number
    | bigint
    | boolean
    | string
    | symbol;

export type Callable = Closure | Continuation | Subroutine;

export type Pair = {
    type: 'PAIR';
    car: Sexp;
    cdr: Sexp;
};

export type Box = {
    type: 'BOX';
    value: Sexp;
};


export type Record = {
    type: 'RECORD';
    value: Map<symbol, Sexp>;
};

export type Closure = {
    type: 'CLOSURE';
    variable: symbol;
    env: Env;
    ctrl: Ctrl;
};

export type Continuation = {
    type: 'CONTINUATION';
    kont: Kont;
};

export type Subroutine = {
    type: 'SUBROUTINE';
    procedure: (sexp: Sexp, env: Env) => Sexp;
};

export type Env = {
    parent: Env | null;
    variable: symbol;
    value: Sexp;
};

export type Kont =
    BeginKont
    | Let1Kont
    | null;

export type BeginKont = {
    type: 'BEGIN';
    env: Env;
    ctrl: Ctrl;
    kont: Kont;
};

export type Let1Kont = {
    type: 'LET1';
    variable: symbol;
    env: Env;
    ctrl: Ctrl;
    kont: Kont;
};

export type Ctrl =
    QuoteCtrl
    | RefCtrl
    | ProcCtrl
    | CallCtrl
    | Let1Ctrl
    | IfCtrl
    | BeginCtrl;

export type ValueCtrl = QuoteCtrl | RefCtrl;

export type ExprCtrl = ValueCtrl | ProcCtrl | CallCtrl;

export type BodyCtrl = Exclude<Ctrl, ExprCtrl>;

export type QuoteCtrl = {
    type: 'QUOTE';
    value: Sexp;
};

export type RefCtrl = {
    type: 'REF';
    variable: symbol;
};

export type ProcCtrl = {
    type: 'PROC';
    variable: symbol;
    ctrl: Ctrl;
};

export type CallCtrl = {
    type: 'CALL';
    callee: ValueCtrl;
    arg: ValueCtrl;
};

export type Let1Ctrl = {
    type: 'LET1';
    variable: symbol;
    expr: ExprCtrl;
    body: Ctrl;
};

export type IfCtrl = {
    type: 'IF';
    test: ValueCtrl;
    ifTrue: Ctrl;
    ifFalse: Ctrl;
};

export type BeginCtrl = {
    type: 'BEGIN';
    ctrls: Ctrl[];
};

export const isTruthy = (sexp: Sexp): boolean => {
    return typeof sexp !== 'boolean' || sexp;
};

export const isPrimitive = (sexp: Sexp): sexp is Primitive => {
    return sexp == null
        || typeof sexp === 'number'
        || typeof sexp === 'bigint'
        || typeof sexp === 'boolean'
        || typeof sexp === 'string'
        || typeof sexp === 'symbol';
};

export const isPair = (sexp: Sexp): sexp is Pair => {
    return !isPrimitive(sexp) && sexp.type === 'PAIR';
};

export const cons = (car: Sexp, cdr: Sexp): Pair => {
    return {
        type: 'PAIR',
        car,
        cdr
    };
};

export const car = (sexp: Sexp): Sexp => {
    if (!isPair(sexp)) {
        throw Error(`sexp must be a pair but got: ${toString(sexp)}`);
    }
    return sexp.car;
};

export const setCar = (sexp: Sexp, car: Sexp): Sexp => {
    if (!isPair(sexp)) {
        throw Error(`sexp must be a pair but got: ${toString(sexp)}`);
    }
    sexp.car = car;
    return car;
};

export const cdr = (sexp: Sexp): Sexp => {
    if (!isPair(sexp)) {
        throw Error(`sexp must be a pair but got: ${toString(sexp)}`);
    }
    return sexp.cdr;
};

export const setCdr = (sexp: Sexp, cdr: Sexp): Sexp => {
    if (!isPair(sexp)) {
        throw Error(`sexp must be a pair but got: ${toString(sexp)}`);
    }
    sexp.cdr = cdr;
    return cdr;
};

export const carAndCdr = (sexp: Sexp): [Sexp, Sexp] => {
    return [car(sexp), cdr(sexp)];
};

export const lengthOfList = (sexp: Sexp): number => {
    let i = 0;
    for (let acc: Sexp = sexp; isPair(acc); i++) {
        acc = cdr(acc);
    }
    return i;
};

export const nreverse = (lst: Sexp, lastCdr: Sexp = null): Sexp => {
    let next = lst;
    for (let tmp = next; isPair(tmp); tmp = next) {
        next = cdr(tmp);
        setCdr(tmp, lastCdr);
        lastCdr = tmp;
    }
    return lastCdr;
};

export const isBox = (sexp: Sexp): sexp is Box => {
    return !isPrimitive(sexp) && sexp.type === 'BOX';
};

export const box = (value: Sexp): Box => {
    return {
        type: 'BOX',
        value
    };
};

export const unbox = (sexp: Sexp): Sexp => {
    if (!isBox(sexp)) {
        throw Error(`sexp must be a box but got: ${toString(sexp)}`);
    }
    return sexp.value;
};

export const setBox = (sexp: Sexp, value: Sexp): Sexp => {
    if (!isBox(sexp)) {
        throw Error(`sexp must be a box but got: ${toString(sexp)}`);
    }
    sexp.value = value;
    return value;
};

export const isRecord = (sexp: Sexp): sexp is Record => {
    return !isPrimitive(sexp) && sexp.type === 'RECORD';
};

export const record = (...values: Sexp[]): Record => {
    const acc = new Map<symbol, Sexp>();
    for (let i = 0, n = values.length; i < n;) {
        const key = values[i++];
        const val = values[i++];
        if (typeof key !== 'symbol') {
            throw Error(`(2n + 1)th sexp must be a symbol but got: ${toString(key)}`);
        }
        acc.set(key, val);
    }
    return {
        type: 'RECORD',
        value: acc
    };
};

export const assq = (rec: Sexp, key: Sexp): Sexp => {
    if (!isRecord(rec)) {
        throw Error(`sexp must be a record but got: ${toString(rec)}`);
    }
    if (typeof key !== 'symbol') {
        throw Error(`sexp must be a symbol but got: ${toString(key)}`);
    }
    const value = rec.value.get(key);
    if (value === undefined) {
        throw Error(`record has no key: ${toString(key)}`);
    }
    return value;
};

export const put = (rec: Sexp, key: Sexp, value: Sexp): Sexp => {
    if (!isRecord(rec)) {
        throw Error(`sexp must be a record but got: ${toString(rec)}`);
    }
    if (typeof key !== 'symbol') {
        throw Error(`sexp must be a symbol but got: ${toString(key)}`);
    }
    rec.value.set(key, value);
    return value;
};

export const isClosure = (sexp: Sexp): sexp is Closure => {
    return !isPrimitive(sexp) && sexp.type === 'CLOSURE';
};

export const isContinuation = (sexp: Sexp): sexp is Continuation => {
    return !isPrimitive(sexp) && sexp.type === 'CONTINUATION';
};

export const isSubroutine = (sexp: Sexp): sexp is Subroutine => {
    return !isPrimitive(sexp) && sexp.type === 'SUBROUTINE';
};

export const toString = (sexp: Sexp): string => {
    if (sexp == null) {
        return '()';
    } else if (isPrimitive(sexp)) {
        switch (typeof sexp) {
            case 'bigint':
            case 'boolean':
            case 'number':
                return sexp.toString();
            case 'string':
                return `"${escapeString(sexp)}"`;
            case 'symbol':
                return escapeSymbol(Symbol.keyFor(sexp) ?? '');
            default: {
                const neverReach: never = sexp;
                throw neverReach;
            }
        }
    }
    switch (sexp.type) {
        case 'PAIR': {
            const results: string[] = [];
            let acc: Sexp;
            for (acc = sexp; isPair(acc); acc = cdr(acc)) {
                results.push(toString(car(acc)));
            }
            if (acc != null) {
                results.push('.', toString(acc));
            }
            return `(${results.join(' ')})`;
        }
        case 'BOX': {
            return `&${toString(unbox(sexp))}`;
        }
        case 'RECORD': {
            const results: string[] = [];
            for (const entry of sexp.value.entries()) {
                const [key, value] = entry;
                results.push(`${toString(key)} . ${toString(value)}`);
            }
            return `{${results.join(' ')}}`;
        }
        case 'CLOSURE':
            return `#<closure ${toString(sexp.variable)} ${JSON.stringify(sexp.ctrl)}>`;
        case 'CONTINUATION':
            return `#<continuation ${JSON.stringify(sexp.kont)}>`;
        case 'SUBROUTINE':
            return `#<subroutine ${sexp.procedure.toString()}>`;
        default: {
            const neverReach: never = sexp;
            throw neverReach;
        }
    }
};

export const fromString = (source: string): [Sexp, string] => {
    const [token, rest] = splitToToken(source);

    switch (token) {
        case '&': {
            const [value, rest_] = fromString(rest);
            return [box(value), rest_];
        }
        case '(': {
            let value: Sexp;
            let rest_ = rest;
            let acc: Sexp = null;
            let lastCdr = null;
            while (([value, rest_] = fromString(rest_)), value !== Symbol.for(')')) {
                if (value === Symbol.for('.')) {
                    [lastCdr, rest_] = fromString(rest_);
                    [value, rest_] = fromString(rest_);
                    if (value !== Symbol.for(')')) {
                        throw Error('parsing non-proper list was failed');
                    }
                    break;
                }
                acc = cons(value, acc);
            }
            return [nreverse(acc, lastCdr), rest_];
        }
        case '{': {
            let key: Sexp;
            let dot: Sexp;
            let value: Sexp;
            let rest_ = rest;
            let acc = record();
            while (([key, rest_] = fromString(rest_)), key !== Symbol.for('}')) {
                if (typeof key !== 'symbol') {
                    throw Error('parsing record was failed because key is not symbol');
                }
                [dot, rest_] = fromString(rest_);
                if (dot !== Symbol.for('.')) {
                    throw Error('parsing record was failed because dot (.) was not between key and value');
                }
                [value, rest_] = fromString(rest_);
                put(acc, key, value);
            }
            return [acc, rest_];
        }
        default:
            if (token === 'true') {
                return [true, rest];
            }
            if (token === 'false') {
                return [false, rest];
            }
            if (!isNaN(+token)) {
                return [+token, rest];
            }
            if (token.startsWith('\"') && token.endsWith('\"')) {
                return [unescapeString(token.slice(1, -1)), rest];
            }
            return [Symbol.for(unescapeSymbol(token)), rest];
    }
};

export const refer = (variable: symbol, env: Env | null): Sexp => {
    let e = env;
    while (e != null) {
        if (e.variable === variable) {
            return e.value;
        }
        e = e.parent;
    }
    throw Error(`variable is not found: ${variable.toString()}`);
};

const tokenRegex = /^[&(){}]|^"(?:[^\n\r"\\]|\\[tnr"\\])*"|^(?:[^\t\n\r "\\&(){}]|\\[tnr "&().\\{}])+/s;

const splitToToken = (raw: string): [string, string] => {
    const src = raw.trimStart();
    if (!src.length) {
        throw new Error("input string is blank");
    }
    const matched = src.match(tokenRegex);
    if (matched == null) {
        throw new Error("failed to parse");
    }
    return [matched[0], src.slice(matched[0].length)];
};

const escapeString = (raw: string): string => {
    return raw.replace(/[\t\n\r"\\]/gs, (p0) => {
        switch (p0) {
            case '\t':
                return '\\t';
            case '\n':
                return '\\n';
            case '\r':
                return '\\r';
            case '\"':
                return '\\\"';
            case '\\':
                return '\\\\';
            default:
                throw Error(`unexpected charactor: ${p0}`);
        }
    });
};

const unescapeString = (escaped: string): string => {
    return escaped.replace(/\\([tnr"\\])/gs, (_, p1) => {
        switch (p1) {
            case 't':
                return '\t';
            case 'n':
                return '\n';
            case 'r':
                return '\r';
            case '"':
                return '"';
            case '\\':
                return '\\';
            default:
                throw Error(`unexpected charactor: ${p1}`);
        }
    });
};

const escapeSymbol = (raw: string): string => {
    return raw.replace(/[\t\n\r "]|\\[&().\\{}]/gs, (p0) => {
        switch (p0) {
            case '\t':
                return '\\t';
            case '\n':
                return '\\n';
            case '\r':
                return '\\r';
            case ' ':
                return '\\ ';
            case '\"':
                return '\\\"';
            default:
                if ('&().\\{}'.includes(p0.slice(1))) {
                    return p0;
                }
                throw Error(`unexpected charactor: ${p0}`);
        }
    });
};

const unescapeSymbol = (escaped: string): string => {
    return escaped.replace(/\\([tnr "&().\\{}])/gs, (_, p1) => {
        switch (p1) {
            case 't':
                return '\t';
            case 'n':
                return '\n';
            case 'r':
                return '\r';
            case ' ':
                return ' ';
            case '"':
                return '"';
            default:
                if ('&().\\{}'.includes(p1)) {
                    return `\\${p1}`;
                }
                throw Error(`unexpected charactor: ${p1}`);
        }
    });
};
