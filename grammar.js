/**
 * Tree-sitter grammar for the Act specification language (.act).
 *
 * Ground truth:
 *   act/src/Act/Lex.x        (Alex lexer)
 *   act/src/Act/Parse.y      (Happy parser)
 *   act/src/Act/Syntax/Untyped.hs  (post-parse AST shape)
 *
 * Precedence ladder mirrors the Happy parser (low -> high):
 *   1  nonassoc  ==>           (implication)
 *   2  left      and  or
 *   3  nonassoc  not
 *   4  left      ==  !=
 *   5  nonassoc  <=  <  >=  >
 *   6  left      +  -
 *   7  left      *  /
 *   8  nonassoc  %
 *   9  left      ^
 *   10 left      ++            (bytestring concat)
 *   11 postfix   [ ]  .        (Ref index / field)
 *
 * Happy declares many of these `nonassoc`; we use prec.left in tree-sitter
 * because nonassoc operators still need a deterministic tree on chained
 * uses for editor parsing. Mismatches with the upstream parser only show
 * up on inputs upstream itself rejects.
 */

const PREC = {
  IMPL: 1,
  AND_OR: 2,
  NOT: 3,
  EQ: 4,
  CMP: 5,
  ADD: 6,
  MUL: 7,
  MOD: 8,
  EXP: 9,
  CAT: 10,
  REF: 11,
};

module.exports = grammar({
  name: 'act',

  extras: $ => [/\s/, $.line_comment],

  word: $ => $.identifier,

  conflicts: $ => [],

  rules: {
    source_file: $ => repeat($.contract),

    // ----- top level -----

    contract: $ => seq(
      'contract',
      field('name', $.identifier),
      $.constructor,
      repeat($.transition),
    ),

    constructor: $ => seq(
      'constructor',
      $.interface,
      optional($.payable),
      optional($.preconditions),
      $.constr_cases,
      optional($.ensures),
      optional($.invariants),
    ),

    transition: $ => seq(
      'transition',
      field('name', $.identifier),
      $.interface,
      optional($.payable),
      optional($.return_type),
      optional($.preconditions),
      $.cases,
      optional($.ensures),
    ),

    payable: _ => 'payable',

    return_type: $ => seq(':', $.arg_type),

    interface: $ => seq('(', commaSep($.arg), ')'),

    arg: $ => seq(field('type', $.arg_type), field('name', $.identifier)),

    // ----- precondition / postcondition blocks -----
    //
    // Each is `keyword expr expr ...`. There are no separators between
    // expressions; the parser uses the next leading keyword (ensures,
    // invariants, case, creates, updates, returns, contract, transition)
    // as the boundary.

    preconditions: $ => seq('iff', repeat1($._expr)),
    ensures: $ => seq('ensures', repeat1($._expr)),
    invariants: $ => seq('invariants', repeat1($._expr)),

    // ----- cases -----

    constr_cases: $ => choice(
      $.creates,
      repeat1($.constr_case),
    ),
    constr_case: $ => seq('case', $._expr, ':', $.creates),

    cases: $ => choice(
      $.post,
      repeat1($.case),
    ),
    case: $ => seq('case', $._expr, ':', optional($.post)),

    post: $ => choice(
      seq($.updates, optional($.returns)),
      $.returns,
    ),

    creates: $ => seq('creates', repeat($.create)),
    create: $ => seq(
      field('type', $.value_type),
      field('name', $.identifier),
      ':=',
      field('value', $._expr),
    ),

    updates: $ => seq('updates', repeat($.store)),
    store: $ => seq(field('lhs', $.ref), ':=', field('rhs', $._expr)),

    returns: $ => seq('returns', $._expr),

    // ----- references (storage paths) -----

    ref: $ => choice(
      $.identifier,
      $.pre_ref,
      $.post_ref,
      $.index_ref,
      $.field_ref,
    ),

    // Strict upstream Parse.y only allows `pre(id)` / `post(id)`, but real
    // test files (e.g. tests/postconditions/pass/amm.act) write
    // `pre(token0.balanceOf[THIS])`. As an editor parser we accept any ref.
    pre_ref: $ => seq('pre', '(', $.ref, ')'),
    post_ref: $ => seq('post', '(', $.ref, ')'),
    index_ref: $ => prec.left(PREC.REF, seq($.ref, '[', $._expr, ']')),
    field_ref: $ => prec.left(PREC.REF, seq($.ref, '.', $.identifier)),

    // ----- types -----

    arg_type: $ => choice(
      $.abi_type,
      $.contract_arg_type,
    ),

    contract_arg_type: $ => seq('address', '<', $.identifier, '>'),

    abi_type: $ => choice(
      $.uint_type,
      $.int_type,
      $.bytes_type,
      'address',
      'bool',
      'string',
      $.array_type,
    ),

    array_type: $ => prec.left(seq($.abi_type, '[', $.int_literal, ']')),

    // sized variants must beat the bare identifier rule lexically
    uint_type: _ => token(prec(1, choice(/uint\d+/, 'uint'))),
    int_type: _ => token(prec(1, choice(/int\d+/, 'int'))),
    // upstream errors on bare 'bytes'; we do too
    bytes_type: _ => token(prec(1, /bytes\d+/)),

    value_type: $ => choice(
      $.abi_type,
      $.mapping_type,
      $.contract_type,
    ),

    contract_type: $ => $.identifier,

    mapping_type: $ => seq(
      'mapping', '(',
      field('key', $.value_type),
      '=>',
      field('value', $.value_type),
      ')',
    ),

    // ----- expressions -----

    _expr: $ => choice(
      $.paren_expr,
      $.int_literal,
      $.bool_literal,
      $.binary_expr,
      $.unary_expr,
      $.ite_expr,
      $.in_range_expr,
      $.create_expr,
      $.address_cast,
      $.array_expr,
      $.mapping_expr,
      $.mapping_update_expr,
      $.env_var,
      $.ref_expr,
    ),

    paren_expr: $ => seq('(', $._expr, ')'),

    bool_literal: _ => choice('true', 'false'),

    // Negative literals are a single Alex token; we follow suit so the
    // expression `a-5` (no space) tokenises identically to upstream
    // (it lexes as `a` then `-5` and is rejected as a parse error).
    int_literal: _ => token(/-?\d+/),

    binary_expr: $ => choice(
      ...[
        ['==>',  PREC.IMPL],
        ['and',  PREC.AND_OR],
        ['or',   PREC.AND_OR],
        ['==',   PREC.EQ],
        ['!=',   PREC.EQ],
        ['<=',   PREC.CMP],
        ['<',    PREC.CMP],
        ['>=',   PREC.CMP],
        ['>',    PREC.CMP],
        ['+',    PREC.ADD],
        ['-',    PREC.ADD],
        ['*',    PREC.MUL],
        ['/',    PREC.MUL],
        ['%',    PREC.MOD],
        ['^',    PREC.EXP],
        ['++',   PREC.CAT],
      ].map(([op, p]) => prec.left(p, seq(
        field('left', $._expr),
        field('op', op),
        field('right', $._expr),
      ))),
    ),

    unary_expr: $ => prec.right(PREC.NOT, seq(
      field('op', 'not'),
      field('operand', $._expr),
    )),

    ite_expr: $ => prec.right(seq(
      'if', field('cond', $._expr),
      'then', field('then', $._expr),
      'else', field('else', $._expr),
    )),

    in_range_expr: $ => seq(
      'inRange', '(',
      field('type', $.abi_type), ',',
      field('value', $._expr),
      ')',
    ),

    create_expr: $ => choice(
      seq('new', field('contract', $.identifier),
          '(', commaSep($._expr), ')'),
      seq('new', field('contract', $.identifier),
          '{', 'value', ':', field('value', $._expr), '}',
          '(', commaSep($._expr), ')'),
    ),

    // address(expr) cast. The legacy lexer fused address(0) into a single
    // token; we match it as the cast applied to integer literal 0.
    address_cast: $ => seq('address', '(', $._expr, ')'),

    array_expr: $ => seq('[', commaSep1($._expr), ']'),

    mapping_expr: $ => seq('[', commaSep($.maps_to), ']'),

    mapping_update_expr: $ => prec.left(PREC.REF, seq(
      $.ref, '[', commaSep($.maps_to), ']',
    )),

    maps_to: $ => seq(field('key', $._expr), '=>', field('value', $._expr)),

    env_var: _ => choice(
      'CALLER', 'CALLVALUE', 'CALLDEPTH', 'ORIGIN',
      'BLOCKHASH', 'BLOCKNUMBER', 'DIFFICULTY', 'CHAINID',
      'GASLIMIT', 'COINBASE', 'TIMESTAMP', 'THIS', 'NONCE',
    ),

    ref_expr: $ => $.ref,

    // ----- lexical -----

    line_comment: _ => token(seq('//', /[^\n]*/)),

    identifier: _ => /[a-zA-Z_][a-zA-Z0-9_]*/,
  },
});

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}
