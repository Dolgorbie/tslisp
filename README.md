# tslisp
Scheme like Lisp language.

## Concept

```scheme
;; Automatic Curring
(f (a b c)  ; `f' means `lambda' for other Lisp.
  (calculation with a b c)
  ...)
== (f (a)
     (f (b)
       (f (c)
         (calculation with a b c)
         ...)))

;; Appling curried procedures
(foo a b c)  ; calling procedure
== (((foo a) b) c)

;; Boxes (container for one object)
(box 1) => &1  ; box literal
&read == (read)  ; Evaluating a box means applying a thunk.

;; Record (like object for JavaScript)
{foo . 1
 bar . "x"}  ; key (must be symbol) . value (any types)

;; Contexts
;; Thread-safe, Continuation-local variable (like Scheme's Parameter objects or Common Lisp's Dynamic Scoping)
;; You can use Context APIs for all global variables
(define foo "foo")
(defun (print-foo _) (display foo))
(print-foo ()) => foo

;; changing binding for the specific continuation
(with ((foo "bar"))
  (print-foo ()))  => "bar"

;; Hygienic macros
(define-syntax (let1 form)
  (match form
    ((_ var val . body)
     #stx`(let ((var val)) #@body))))  ;; #stx` protects variables from accidential captures.

;; Restricted reader macros
;; Restricted syntax makes it easier to develop the processing systems or other tools.
;; Reader macros satisfies the following syntax:
;; Reader-macro := "#" <latins or digits>* <Punctions except (){}."> Argument-for-macro
#foo'123 => (#foo' 123)
```
