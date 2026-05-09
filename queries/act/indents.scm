; Indent hints for nvim-treesitter. A node matched by @indent.begin contributes
; one level of indent to lines inside it.
;
; Act uses keyword-delimited blocks (creates, updates, iff, ensures, ...) and
; a final newline ends the block; there's no closing punctuation. The block
; nodes themselves are the @indent.begin anchors. Brackets/parens/braces
; provide the standard expression-level indent hints.

[
  (creates)
  (updates)
  (preconditions)
  (ensures)
  (invariants)
  (constr_case)
  (case)
  (interface)
  (mapping_type)
  (mapping_expr)
  (array_expr)
  (paren_expr)
  (in_range_expr)
] @indent.begin

[
  "}"
  ")"
  "]"
] @indent.end

[
  "}"
  ")"
  "]"
] @indent.branch
