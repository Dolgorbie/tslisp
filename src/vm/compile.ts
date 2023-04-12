import { Ctrl, Sexp } from '../sexp/sexp';
import { normalize } from './normalize';
import { transform } from './transformCtrl';

export const compile = (sexp: Sexp): Ctrl => {
    return normalize(transform(sexp));
};
