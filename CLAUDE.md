# Working notes for Claude Code

Context that future-you needs when editing this grammar.

## Ground truth

The grammar is derived directly from, and must stay consistent with:

- `~/dev/argot/act/src/Act/Lex.x` (Alex lexer)
- `~/dev/argot/act/src/Act/Parse.y` (Happy parser)
- `~/dev/argot/act/src/Act/Syntax/Untyped.hs` (post-parse AST shape)

When the Happy parser and prose disagree, trust Happy.

## Iteration loop

```
npx tree-sitter generate     # regenerate src/parser.c from grammar.js
npx tree-sitter test         # run test/corpus/*.txt
npx tree-sitter parse FILE   # smoke-test a single file
```

`src/parser.c`, `src/grammar.json`, `src/node-types.json`, and
`src/tree_sitter/` are generated. Never hand-edit them - edit `grammar.js`
and regenerate.

## Coverage expectations

The current Act grammar (post-2024 rewrite) uses `contract` /
`constructor` / `transition` / `creates` / `updates`. Files under
`~/dev/argot/act/tests/**/*.act` are the canonical corpus.

The `~/dev/argot/act/examples/` directory still contains files in the
**legacy** `behaviour` / `storage` / `=/=` syntax that the current `act`
parser itself rejects. We should not try to accept them - filter them out
of coverage runs.

To check coverage against the modern test suite:

```bash
total=0; pass=0
for f in ~/dev/argot/act/tests/**/*.act; do
  [ -f "$f" ] || continue
  total=$((total+1))
  if npx tree-sitter parse "$f" --quiet >/dev/null 2>&1; then
    pass=$((pass+1))
  fi
done
echo "passed $pass / $total"
```

Target: 100% on `act/tests/` modulo any files that the upstream `act`
parser itself fails on.

## Known design decisions

- **`iff in range` is multi-token.** Alex fuses these into one
  `IFFINRANGE` token (see `Lex.x:42`); we just match the keyword
  sequence in the parser. Strictly simpler.
- **`address(0)` is multi-token.** Alex fuses to `ADDR0` (`Lex.x:74`);
  we recognize `address` `(` `0` `)` as a phrase in the expression rule.
- **Sized numeric types use regex.** `uint256`/`int128`/`bytes32` etc.
  are matched as `/uint\d+/` / `/int\d+/` / `/bytes\d+/`, with bare
  `uint`/`int`/`bytes` as separate keywords (defaulting to width 256 / 256 / unsized).
- **`SCORE` (`_`) is unused.** Declared in `Lex.x` but referenced by no
  parser rule; the legacy wildcard-case syntax was removed.
- **No string literals, no block comments.** Only `// ...` line comments,
  in `extras`. No external scanner needed.
- **Comparison operators are left-associative.** Happy declares them
  `nonassoc`; tree-sitter needs some associativity to produce a tree.

## Query ordering matters

Neovim's treesitter highlighter applies *the last matching pattern* when
priorities tie. In `queries/act/highlights.scm`, keep generic fallbacks
(`(identifier) @variable`) at the top and specific node-based captures
below.

## Backlog

Feature backlog lives on GitHub issues. When the user asks for the next
thing to work on, check the issue list rather than inventing tasks.
