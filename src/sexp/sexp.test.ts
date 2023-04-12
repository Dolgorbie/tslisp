import { expect, test } from '@jest/globals';
import { box, cons, fromString, record, toString } from './sexp';

test('sexp to string', () => {
    expect(toString(0)).toBe('0');
    expect(toString(1)).toBe('1');
    expect(toString(1.1)).toBe('1.1');
    expect(toString(100n)).toBe('100');
    expect(toString(true)).toBe('true');
    expect(toString(false)).toBe('false');

    expect(toString('')).toBe('\"\"');
    expect(toString('abc')).toBe('\"abc\"');
    expect(toString('ab\tc')).toBe('\"ab\\tc\"');
    expect(toString('ab\nc')).toBe('\"ab\\nc\"');
    expect(toString('ab\r\nc')).toBe('\"ab\\r\\nc\"');
    expect(toString('ab\\c')).toBe('\"ab\\\\c\"');
    expect(toString('ab\"c')).toBe('\"ab\\\"c\"');

    expect(toString(Symbol.for('abc'))).toBe('abc');
    expect(toString(Symbol.for('a\tb'))).toBe('a\\tb');
    expect(toString(Symbol.for('a\nb'))).toBe('a\\nb');
    expect(toString(Symbol.for('a\r\nb'))).toBe('a\\r\\nb');
    expect(toString(Symbol.for('a b'))).toBe('a\\ b');
    expect(toString(Symbol.for('a\"b'))).toBe('a\\\"b');
    expect(toString(Symbol.for('a\\\\b'))).toBe('a\\\\b');
    expect(toString(Symbol.for('a\\&b'))).toBe('a\\&b');
    expect(toString(Symbol.for('a\\(\\)b'))).toBe('a\\(\\)b');
    expect(toString(Symbol.for('a\\{\\}b'))).toBe('a\\{\\}b');
    expect(toString(Symbol.for('a.b'))).toBe('a.b');
    expect(toString(Symbol.for('\\.'))).toBe('\\.');

    expect(toString(null)).toBe('()');

    expect(toString(box(123))).toBe('&123');
    expect(toString(box(box(123)))).toBe('&&123');

    expect(toString(cons(true, false))).toBe('(true . false)');
    expect(toString(cons(1, cons(2, 3)))).toBe('(1 2 . 3)');
    expect(toString(cons(true, null))).toBe('(true)');
    expect(toString(cons(true, cons(false, null)))).toBe('(true false)');
    expect(toString(cons(cons(1, null), cons(2, box(null))))).toBe('((1) 2 . &())');

    expect(toString(record())).toBe('{}');
    expect(toString(record(Symbol.for('a'), 1))).toBe('{a . 1}');
    expect(toString(record(Symbol.for('a'), 1, Symbol.for('b'), 2))).toBe('{a . 1 b . 2}');
    expect(toString(record(Symbol.for('a'), cons("a", cons(1, null)), Symbol.for('b'), box(2)))).toBe('{a . (\"a\" 1) b . &2}');

});

test('string to sexp', () => {
    expect(fromString('0')[0]).toBe(0);
    expect(fromString('1')[0]).toBe(1);
    expect(fromString('1.1')[0]).toBe(1.1);
    expect(fromString('100')[0]).toBe(100);
    expect(fromString('true')[0]).toBe(true);
    expect(fromString('false')[0]).toBe(false);

    expect(fromString('\"\"')[0]).toBe('');
    expect(fromString('\"abc\"')[0]).toBe('abc');
    expect(fromString('\"ab\\tc\"')[0]).toBe('ab\tc');
    expect(fromString('\"ab\\nc\"')[0]).toBe('ab\nc');
    expect(fromString('\"ab\\r\\nc\"')[0]).toBe('ab\r\nc');
    expect(fromString('\"ab\\\\c\"')[0]).toBe('ab\\c');
    expect(fromString('\"ab\\\"c\"')[0]).toBe('ab\"c');

    expect(fromString('abc')[0]).toBe(Symbol.for('abc'));
    expect(fromString('a\\tb')[0]).toBe(Symbol.for('a\tb'));
    expect(fromString('a\\nb')[0]).toBe(Symbol.for('a\nb'));
    expect(fromString('a\\r\\nb')[0]).toBe(Symbol.for('a\r\nb'));
    expect(fromString('a\\ b')[0]).toBe(Symbol.for('a b'));
    expect(fromString('a\\\"b')[0]).toBe(Symbol.for('a\"b'));
    expect(fromString('a\\\\b')[0]).toBe(Symbol.for('a\\\\b'));
    expect(fromString('a\\&b')[0]).toBe(Symbol.for('a\\&b'));
    expect(fromString('a\\(\\)b')[0]).toBe(Symbol.for('a\\(\\)b'));
    expect(fromString('a\\{\\}b')[0]).toBe(Symbol.for('a\\{\\}b'));
    expect(fromString('a.b')[0]).toBe(Symbol.for('a.b'));
    expect(fromString('\\.')[0]).toBe(Symbol.for('\\.'));

    expect(fromString('()')[0]).toBe(null);

    expect(fromString('&123')[0]).toEqual(box(123));
    expect(fromString('&&123')[0]).toEqual(box(box(123)));

    expect(fromString('(true . false)')[0]).toEqual(cons(true, false));
    expect(fromString('(1 2 . 3)')[0]).toEqual(cons(1, cons(2, 3)));
    expect(fromString('(true)')[0]).toEqual(cons(true, null));
    expect(fromString('(true false)')[0]).toEqual(cons(true, cons(false, null)));
    expect(fromString('((1) 2 . &())')[0]).toEqual(cons(cons(1, null), cons(2, box(null))));

    expect(fromString('{}')[0]).toEqual(record());
    expect(fromString('{a . 1}')[0]).toEqual(record(Symbol.for('a'), 1));
    expect(fromString('{a . 1 b . 2}')[0]).toEqual(record(Symbol.for('a'), 1, Symbol.for('b'), 2));
    expect(fromString('{a . (\"a\" 1) b . &2}')[0]).toEqual(record(Symbol.for('a'), cons("a", cons(1, null)), Symbol.for('b'), box(2)));
});
