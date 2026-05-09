-- Health check for tree-sitter-act. Surfaced via `:checkhealth act`.
-- Reports whether the parser is loadable, whether each query file is
-- registered, and whether the .act -> act filetype mapping is in place.

local M = {}

local QUERY_NAMES = {
  "highlights",
  "injections",
  "folds",
  "indents",
  "locals",
  "textobjects",
  "tags",
}

function M.check()
  vim.health.start("act")

  -- Parser
  local ok, err = pcall(vim.treesitter.language.add, "act")
  if ok then
    vim.health.ok("parser 'act' is loadable")
  else
    vim.health.error(
      "parser 'act' not loadable: " .. tostring(err),
      {
        "Run :Lazy build tree-sitter-act to rebuild the parser.",
        "Check that a C compiler (cc / clang / gcc) is on PATH.",
      }
    )
    return
  end

  -- Queries
  for _, name in ipairs(QUERY_NAMES) do
    local q = vim.treesitter.query.get("act", name)
    if q then
      vim.health.ok(name .. ".scm registered")
    else
      vim.health.warn(
        name .. ".scm not registered",
        { "Re-run the plugin's config function (usually via :Lazy reload tree-sitter-act)." }
      )
    end
  end

  -- Filetype mapping
  local ft = vim.filetype.match({ filename = "probe.act" })
  if ft == "act" then
    vim.health.ok("filetype '.act' maps to 'act'")
  else
    vim.health.warn(
      "filetype for .act is '" .. tostring(ft) .. "' (expected 'act')",
      { "Ensure vim.filetype.add was called - see plugin config." }
    )
  end
end

return M
