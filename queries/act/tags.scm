; Tags for code-outline tools (aerial.nvim, telescope-symbols, GitHub code
; navigation). Each @definition.* captures a range; the nested @name capture
; gives the tool the label text.

(contract
  name: (identifier) @name) @definition.class

(transition
  name: (identifier) @name) @definition.method

(constructor
  "constructor" @name) @definition.method

; Storage variables introduced in `creates`
(create
  name: (identifier) @name) @definition.field

; ===== reference captures (for call-graph views) =====

; `new ContractName(...)` is a contract-creation reference
(create_expr
  contract: (identifier) @name) @reference.call
