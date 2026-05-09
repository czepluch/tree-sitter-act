# tree-sitter-act

A [tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for
[Act](https://github.com/argotorg/act) (`.act`) - a formal specification
language for EVM smart contracts.

**Status:** v0.1, work in progress. Targets the current `contract` /
`constructor` / `transition` syntax (not the legacy `behaviour` / `storage`
syntax still present in `act/examples/`).

## Quick install (lazy.nvim / LazyVim)

Drop this into `~/.config/nvim/lua/plugins/act.lua` and restart Neovim.
Lazy clones, compiles, and Neovim picks up the parser and queries
automatically. No `tree-sitter` CLI required, just a C compiler.

```lua
return {
  {
    "czepluch/tree-sitter-act",
    build = "mkdir -p ~/.local/share/nvim/site/parser && cc -O2 -shared -fPIC -I src src/parser.c -o ~/.local/share/nvim/site/parser/act.so",
    ft = "act",
  },
}
```

Verify with `:checkhealth act` - should report the parser loadable, all
seven queries registered, and filetype mapped.

Open any `.act` file, try `:InspectTree` to see the parse tree and
`:Inspect` on a token to see which highlight captures applied.

## What you get

- Syntax highlighting for `.act` files: keywords (`contract`,
  `constructor`, `transition`, `creates`, `updates`, `iff`, `ensures`,
  `invariants`, `case`), built-in types (`uint256`, `address`, `bool`,
  `mapping`, `bytes`, ...), env vars (`CALLER`, `CALLVALUE`, `THIS`, ...),
  operators, and literals
- Scope-aware identifier highlighting via `locals.scm`
- Textobject motions (with `nvim-treesitter-textobjects` or `mini.ai`)
- Code folding and symbol outlines via `folds.scm` / `tags.scm`

## Repository layout

```
grammar.js                  main grammar
src/
  parser.c                  generated
  grammar.json              generated
  node-types.json           generated
  tree_sitter/              generated bindings
queries/act/
  highlights.scm            syntax highlighting
  injections.scm            (placeholder, no embedded language yet)
  folds.scm                 fold regions
  indents.scm               indent hints
  locals.scm                scopes / definitions / references
  textobjects.scm           nvim-treesitter-textobjects motions
  tags.scm                  code-outline / ctags symbols
ftdetect/act.lua            maps .act -> filetype act
lua/act/
  health.lua                :checkhealth act
test/corpus/                tree-sitter corpus tests
examples/                   curated .act files
CLAUDE.md                   working notes for maintainers
```

## Ground truth

The grammar is written directly against:

- `act/src/Act/Lex.x` (Alex lexer)
- `act/src/Act/Parse.y` (Happy parser)

When in doubt, those files are the source of truth. See `CLAUDE.md` for
maintainer-facing notes.

## Development

```bash
npm install
npx tree-sitter generate
npx tree-sitter test
npx tree-sitter parse path/to/file.act
```

Iteration loop after edits:

```bash
npx tree-sitter generate && npx tree-sitter test
npx tree-sitter build -o ~/.local/share/nvim/site/parser/act.so
# :edit the buffer in Neovim to reload
```

Query file edits are picked up on `:edit` alone - no parser rebuild.

## License

MIT.
