"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { toMarkdown } = require("./markdown.js");

const BASE = "https://scp-wiki-cn.wikidot.com/";

test("headings and centered lines", () => {
  const source = "+ One\n++ Two\n++* Three\n++++++ Six\n= center";
  assert.equal(
    toMarkdown(source),
    "# One\n\n## Two\n\n## Three\n\n###### Six\n\ncenter\n"
  );
});

test("bold, italic, underline, strike, monospace, superscript and subscript", () => {
  const source =
    "**bold** //italic// __under__ --strike-- {{code}} ^^sup^^ ,,sub,, " +
    "##red|红## ##blue|bg|文字##";
  assert.equal(
    toMarkdown(source),
    "**bold** *italic* <u>under</u> ~~strike~~ `code` <sup>sup</sup> " +
      "<sub>sub</sub> 红 文字\n"
  );
});

test("typography: em dash, ellipsis and curly quotes", () => {
  assert.equal(
    toMarkdown("a -- b ... ``quoted''"),
    "a \u2014 b \u2026 \u201cquoted\u201d\n"
  );
});

test("literal blocks escape Markdown special characters", () => {
  assert.equal(
    toMarkdown("@@**literal**@@ @<a_b>@"),
    "\\*\\*literal\\*\\* a\\_b\n"
  );
});

test("page links use the base URL and unix names", () => {
  const source =
    "[[[example-page]]] [[[example-page|标签]]] [[[*example-page|新窗]]]";
  assert.equal(
    toMarkdown(source),
    "[example-page](" + BASE + "example-page) " +
      "[标签](" + BASE + "example-page) " +
      "[新窗](" + BASE + "example-page)\n"
  );
});

test("external, anchor and root-relative links; bare URLs are untouched", () => {
  const source =
    "[https://example.com page] [*https://example.org x] " +
    "[#sec jump] [/foo bar]\nsee https://example.com/a//b";
  assert.equal(
    toMarkdown(source),
    "[page](https://example.com) [x](https://example.org) [jump](#sec) " +
      "[bar](" + BASE + "foo)\\\nsee https://example.com/a//b\n"
  );
});

test("images keep their alt text and absolute URLs", () => {
  const source =
    '[[image https://x/y.png alt="pic"]] [[=image https://x/z.png]] ' +
    '[[f<image https://x/a.png alt=a]] [[<image https://x/b.png]]';
  assert.equal(
    toMarkdown(source),
    "![pic](https://x/y.png) ![](https://x/z.png) " +
      "![a](https://x/a.png) ![](https://x/b.png)\n"
  );
});

test("relative image names use local--files when a page is supplied", () => {
  assert.equal(
    toMarkdown('[[image local.png alt=q]]', {
      base: "https://b.example/",
      page: "pg",
    }),
    "![q](https://b.example/local--files/pg/local.png)\n"
  );
  assert.equal(
    toMarkdown("[[image local.png alt=q]]", { base: "https://b.example/" }),
    "![q](local.png)\n"
  );
});

test("span and size wrappers keep only their content", () => {
  const source =
    '[[div class="x"]]\n' +
    'before [[span class="y"]]inside [[size 1em]]nested[[/size]][[/span]] after\n' +
    "[[/div]]";
  assert.equal(toMarkdown(source), "before inside nested after\n");

  assert.equal(
    toMarkdown("[[span class=x]]a\nb[[/span]]"),
    "a\\\nb\n"
  );
});

test("block tags are dropped but their content remains", () => {
  const source = [
    "[[=]]",
    "center",
    "[[/=]]",
    "[[<]]",
    "left",
    "[[/<]]",
    "[[==]]",
    "[[/>]]",
    "[[note]]",
    "note",
    "[[/note]]",
    "[[bibliography]]",
    "[[/bibliography]]",
  ].join("\n");
  assert.equal(toMarkdown(source), "center\n\nleft\n\nnote\n");
});

test("collapsible becomes details/summary", () => {
  const source = [
    '[[collapsible show="+ more"]]',
    "inside",
    "[[/collapsible]]",
  ].join("\n");
  assert.equal(
    toMarkdown(source),
    "<details><summary>+ more</summary>\n\ninside\n\n</details>\n"
  );
});

test("tab becomes a bold label", () => {
  const source = [
    "[[tabview]]",
    "[[tab One]]",
    "content",
    "[[/tab]]",
    "[[/tabview]]",
  ].join("\n");
  assert.equal(toMarkdown(source), "**One**\n\ncontent\n");
});

test("bullets, ordered lists and nesting", () => {
  assert.equal(
    toMarkdown("* a\n * b\n# one\n  # two"),
    "- a\n  - b\n1. one\n      1. two\n"
  );
});

test("trailing underscore in a list item joins the next line with <br>", () => {
  assert.equal(toMarkdown("* one _\ncontinuation"), "- one<br>continuation\n");
});

test("nested quotes", () => {
  assert.equal(toMarkdown("> a\n>> b"), "> a\n> > b\n");
});

test("definition lists", () => {
  assert.equal(
    toMarkdown(": term : definition"),
    "**term**: definition\n"
  );
});

test("simple tables with a ~ header row", () => {
  const source = "||~ Name || Value ||\n|| A || 1 ||\n|| B || 2 ||";
  assert.equal(
    toMarkdown(source),
    "| Name | Value |\n| --- | --- |\n| A | 1 |\n| B | 2 |\n"
  );
});

test("simple tables without ~ still use the first row as header", () => {
  const source = "|| A || B ||\n|| 1 || 2 ||";
  assert.equal(
    toMarkdown(source),
    "| A | B |\n| --- | --- |\n| 1 | 2 |\n"
  );
});

test("simple tables add a cell for |||| and escape pipes inside cells", () => {
  assert.equal(
    toMarkdown("|| a |||| b ||"),
    "| a |  | b |\n| --- | --- | --- |\n"
  );
  assert.equal(
    toMarkdown("|| a | b || c ||\n|| 1 || 2 ||"),
    "| a \\| b | c |\n| --- | --- |\n| 1 | 2 |\n"
  );
});

test("advanced tables become GFM tables when cells are single lines", () => {
  const source = [
    "[[table]]",
    "[[row]]",
    "[[hcell]]A[[/hcell]]",
    "[[cell]]B[[/cell]]",
    "[[/row]]",
    "[[row]]",
    "[[cell]]1[[/cell]]",
    "[[cell]]2[[/cell]]",
    "[[/row]]",
    "[[/table]]",
  ].join("\n");
  assert.equal(
    toMarkdown(source),
    "| A | B |\n| --- | --- |\n| 1 | 2 |\n"
  );
});

test("advanced tables with multiline cells flatten into paragraphs", () => {
  const source = [
    "[[table]]",
    "[[row]]",
    "[[cell]]",
    "line1",
    "line2",
    "[[/cell]]",
    "[[cell]]",
    "other",
    "[[/cell]]",
    "[[/row]]",
    "[[/table]]",
  ].join("\n");
  assert.equal(toMarkdown(source), "line1\\\nline2\n\nother\n");
});

test("footnotes are numbered and defined at the end", () => {
  const source =
    "text[[footnote]]note **bold**[[/footnote]] more\n[[footnoteblock]]";
  assert.equal(
    toMarkdown(source),
    "text[^1] more\n\n[^1]: note **bold**\n"
  );
});

test("a footnote inside other inline formatting still works", () => {
  assert.equal(
    toMarkdown("**a[[footnote]]x[[/footnote]]**"),
    "**a[^1]**\n\n[^1]: x\n"
  );
});

test("code blocks are fenced verbatim with an optional language", () => {
  const source = [
    '[[code type="php"]]',
    "<?php",
    "**not** [[div]]",
    "[[/code]]",
  ].join("\n");
  assert.equal(
    toMarkdown(source),
    "```php\n<?php\n**not** [[div]]\n```\n"
  );
});

test("comments, CSS modules, html blocks and toc are removed", () => {
  const source = [
    "[!-- c",
    "c --]",
    "[[module CSS]]",
    ".x{}",
    "[[/module]]",
    "[[module css]]",
    ".y{}",
    "[[/module]]",
    "[[module rate]]",
    "[[html]]",
    "<b>x</b>",
    "[[/html]]",
    "[[embed]]",
    "<i>y</i>",
    "[[/embed]]",
    "[[toc]]",
    "text",
  ].join("\n");
  assert.equal(
    toMarkdown(source),
    "<!-- html block omitted -->\n\n<!-- html block omitted -->\n\ntext\n"
  );
});

test("closed non-CSS module bodies are removed too", () => {
  const source = [
    "before",
    "[[module ListPages]]",
    "category=x",
    "[[/module]]",
    "after",
  ].join("\n");
  assert.equal(toMarkdown(source), "before\n\nafter\n");
});

test("multiline include leftovers are removed", () => {
  const source = [
    "[[include :scp-wiki:component:foo",
    "|a=1",
    "|b=2",
    "]]",
    "after",
  ].join("\n");
  assert.equal(toMarkdown(source), "after\n");
});

test("user, anchor and a-tag conversions", () => {
  const source = [
    "[[user Alice]] [[*user Bob]] [[# spot]]",
    '[[a href="https://x.com"]]click[[/a]]',
  ].join("\n");
  assert.equal(
    toMarkdown(source),
    'Alice Bob <a id="spot"></a>\\\n[click](https://x.com)\n'
  );
});

test("horizontal rules, @@@@ lines and paragraph hard breaks", () => {
  const source = [
    "[[toc]]",
    "line one",
    "line two",
    "",
    "@@@@",
    "@@ @@",
    "----",
    "a -- b ... ``hi''",
  ].join("\n");
  assert.equal(
    toMarkdown(source),
    "line one\\\nline two\n\n---\n\na \u2014 b \u2026 \u201chi\u201d\n"
  );
});

test("normalizes CRLF and ends with exactly one newline", () => {
  const markdown = toMarkdown("first\r\nsecond\r\n");
  assert.equal(markdown, "first\\\nsecond\n");
  assert.ok(markdown.endsWith("\n"));
  assert.ok(!markdown.endsWith("\n\n"));
});

test("real FTML files convert quickly and leave no raw container tags", () => {
  const block = '+ 小节标题\n\n[[div class="box"]]\n**粗体** 与 //斜体// 与 [[span class="s"]]行内块[[/span]]\n\n* 列表一\n* 列表二\n\n> 引用\n[[/div]]\n\n';
  const source = block.repeat(200);
  const started = process.hrtime.bigint();
  let markdown;
  assert.doesNotThrow(() => {
    markdown = toMarkdown(source);
  });
  const elapsed = Number(process.hrtime.bigint() - started) / 1e6;
  assert.equal(typeof markdown, "string");
  assert.ok(markdown.length > 0, "produced no output");
  assert.ok(!markdown.includes("[[div"), "still contains [[div");
  assert.ok(!markdown.includes("[[span"), "still contains [[span");
  assert.ok(!markdown.includes("[[/"), "still contains [[/");
  assert.ok(elapsed < 2000, "took " + elapsed + "ms");
});
