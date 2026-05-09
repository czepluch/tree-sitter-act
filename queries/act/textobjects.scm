; Captures consumed by nvim-treesitter-textobjects. Capture names follow
; its documented convention so users get the usual `vaf` / `vif` / `]m`
; / `]a` motions without extra configuration.

; ===== "function": transitions and the constructor =====

(transition) @function.outer
(transition (cases) @function.inner)

(constructor) @function.outer
(constructor (constr_cases) @function.inner)

; ===== "class": contracts =====

(contract) @class.outer
; A contract's "inner" runs from its constructor through its last transition.
; Tree-sitter-textobjects accepts the body siblings as the inner range.
(contract (constructor) @class.inner)

; ===== parameters =====

(arg) @parameter.inner
(arg) @parameter.outer

; Call-site arguments (new Contract(arg1, arg2)) - the maps_to and
; expression children of the various comma-separated lists.
(maps_to) @parameter.inner
(maps_to) @parameter.outer

; ===== calls =====

(create_expr) @call.outer

; ===== conditionals =====

(ite_expr) @conditional.outer
(ite_expr cond: (_) @conditional.inner)

(case)        @conditional.outer
(constr_case) @conditional.outer

; ===== blocks =====

[
  (creates)
  (updates)
  (preconditions)
  (ensures)
  (invariants)
] @block.outer

[
  (creates)
  (updates)
  (preconditions)
  (ensures)
  (invariants)
] @block.inner

; ===== assignments =====

(store
  lhs: (_) @assignment.lhs
  rhs: (_) @assignment.rhs)

(create
  name: (identifier) @assignment.lhs
  value: (_) @assignment.rhs)

; ===== returns =====

(returns) @return.outer

; ===== comments =====

(line_comment) @comment.outer
