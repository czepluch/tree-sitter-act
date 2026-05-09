# tree-sitter-act

A [tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for
[Act](https://github.com/argotorg/act) (`.act`) - a formal specification
language for EVM smart contracts.

**Status:** v0.1, work in progress. Targets the current `contract` /
`constructor` / `transition` syntax (not the legacy `behaviour` / `storage`
syntax still present in `act/examples/`).

## VS Code / VSCodium / Cursor

This grammar is for tree-sitter-native editors (Neovim, Helix, Zed, ...).
For VS Code-family editors, install the
[vscode-act](https://github.com/czepluch/vscode-act) extension instead -
download the `.vsix` from its
[releases](https://github.com/czepluch/vscode-act/releases) and run
`code --install-extension vscode-act-*.vsix`.

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

### Troubleshooting

If `:checkhealth act` reports `parser 'act' not loadable - language.add
returned false`, the `build` step didn't produce
`~/.local/share/nvim/site/parser/act.so`. Run it by hand:

```bash
cd $(nvim -e -c 'lua print(require("lazy.core.config").options.root)' -c 'q' 2>/dev/null)/tree-sitter-act \
  || cd ~/.local/share/nvim/lazy/tree-sitter-act
mkdir -p ~/.local/share/nvim/site/parser
cc -O2 -shared -fPIC -I src src/parser.c -o ~/.local/share/nvim/site/parser/act.so
```

Then `:edit` the `.act` buffer to reload.

## What you get

- Syntax highlighting for `.act` files: keywords (`contract`,
  `constructor`, `transition`, `creates`, `updates`, `iff`, `ensures`,
  `invariants`, `case`), built-in types (`uint256`, `address`, `bool`,
  `mapping`, `bytes`, ...), env vars (`CALLER`, `CALLVALUE`, `THIS`, ...),
  operators, and literals
- Scope-aware identifier highlighting via `locals.scm`
- Textobject motions (with `nvim-treesitter-textobjects` or `mini.ai`)
- Code folding and symbol outlines via `folds.scm` / `tags.scm`

---

## Alternative install paths

### Plain Neovim (manual, no package manager)

Clone the repo somewhere on Neovim's runtime path so the bundled
`ftdetect/` and `queries/act/` directories get picked up, then compile
the parser:

```bash
git clone https://github.com/czepluch/tree-sitter-act \
  ~/.local/share/nvim/site/pack/plugins/start/tree-sitter-act
cd "$_"
mkdir -p ~/.local/share/nvim/site/parser
cc -O2 -shared -fPIC -I src src/parser.c \
   -o ~/.local/share/nvim/site/parser/act.so
```

That's it - restart Neovim and `:checkhealth act` should pass. The
`src/parser.c` is committed, so this path needs **only a C compiler**;
no Node, no `tree-sitter` CLI.

### Development (working on the grammar itself)

```bash
cd /path/to/tree-sitter-act
npm install                                   # one-time
npx tree-sitter generate                      # regenerate src/parser.c
npx tree-sitter test                          # corpus tests
npx tree-sitter build -o ~/.local/share/nvim/site/parser/act.so
```

Iteration loop after edits:

```bash
npx tree-sitter generate && npx tree-sitter test
npx tree-sitter build -o ~/.local/share/nvim/site/parser/act.so
# :edit the buffer in Neovim to reload
```

Query file edits are picked up on `:edit` alone - no parser rebuild.

For a development install where Neovim picks up your local checkout
(rather than re-cloning), use lazy.nvim's `dir =` pointing at your
working directory:

```lua
{
  "czepluch/tree-sitter-act",
  dir = "/path/to/your/tree-sitter-act",
  build = "...",  -- as above
  ft = "act",
}
```

---

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

## License

MIT.
