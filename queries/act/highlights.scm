; Tree-sitter highlight queries for Act.
;
; ORDERING: Neovim's treesitter highlighter applies the LAST matching pattern
; when priorities tie. So generic fallbacks go first, specific captures go
; below, and the specific ones win.

; ===== generic fallbacks (must come first) =====

(identifier) @variable

; ===== literals =====

(int_literal)  @number
(bool_literal) @boolean

; ===== comments =====

(line_comment) @comment @spell

; ===== punctuation =====

[ "(" ")" "{" "}" "[" "]" ] @punctuation.bracket
[ "," "." ":" ]             @punctuation.delimiter
[ ":=" ]                    @operator

; ===== operators =====

[ "==>" "=>" ]                  @operator
[ "==" "!=" "<" ">" "<=" ">=" ] @operator
[ "+" "-" "*" "/" "%" "^" ]     @operator
[ "++" ]                        @operator

; word operators
[ "and" "or" "not" ] @keyword.operator

; ===== keywords =====

[
  "contract"
  "constructor"
  "transition"
] @keyword

(payable) @keyword

[
  "creates"
  "updates"
  "iff"
  "ensures"
  "invariants"
  "case"
] @keyword

[ "returns" ] @keyword.return

[ "if" "then" "else" "case" ] @keyword.conditional

[ "new" "value" "mapping" ] @keyword

[ "pre" "post" "inRange" ] @function.builtin

; ===== built-in types =====

(uint_type)  @type.builtin
(int_type)   @type.builtin
(bytes_type) @type.builtin

; bare type keywords inside abi_type
((abi_type) @type.builtin
  (#match? @type.builtin "^(address|bool|string)$"))

; ===== environment variables =====

(env_var) @constant.builtin

; ===== declarations: binding positions =====

(contract        name: (identifier) @type)
(transition      name: (identifier) @function)
(create          name: (identifier) @variable.member)
(arg             name: (identifier) @variable.parameter)

; The `constructor` keyword highlighted as a function builtin
(constructor "constructor" @function.builtin)

; Contract type references in argument position: `address<Token>`
(contract_arg_type (identifier) @type)

; Bare contract type reference in value_type (e.g. `Token tok := ...`)
(contract_type) @type

; new ContractName(...)
(create_expr contract: (identifier) @type)

; ===== references / call sites =====

; `inRange(uint256, ...)` - already captured by @function.builtin via keyword
; `pre(...)` / `post(...)` - already captured

; Field access on refs: `token.balanceOf` - the field identifier
(field_ref (identifier) @variable.member)
