; Scope / definition / reference annotations for locals-based consumers
; (vim-illuminate's treesitter provider, nvim-treesitter-refactor's
; highlight_definitions, etc.).

; ===== scopes =====

(source_file) @local.scope
(contract)    @local.scope
(constructor) @local.scope
(transition)  @local.scope
(case)        @local.scope
(constr_case) @local.scope

; ===== definitions =====

; Contract-level
(contract     name: (identifier) @local.definition.type)
(transition   name: (identifier) @local.definition.function)

; Storage variables introduced in `creates`
(create       name: (identifier) @local.definition.field)

; Interface arguments
(arg          name: (identifier) @local.definition.parameter)

; ===== references =====

(identifier) @local.reference
