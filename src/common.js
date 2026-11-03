"use strict";
// Helpers shared by the Preview renderer and the Live editing decorator.
const SIZE_KEYWORDS = new Set(["xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "smaller", "larger"]);
function fontSize(value) {
  const text = String(value || "").trim().toLowerCase();
  if (SIZE_KEYWORDS.has(text)) return text;
  if (/^\d+(?:\.\d+)?(?:px|em|rem|%|pt|ex|vw|vh)$/.test(text)) return text;
  if (/^\d+(?:\.\d+)?$/.test(text)) return text + "%";
  return "";
}
// Wikidot page names: lower case ASCII, every other run of characters becomes
// a single hyphen, and hyphens next to a category colon are dropped.
function unixName(value) {
  return String(value || "").toLowerCase()
    .replace(/[^a-z0-9:_#-]+/g, "-").replace(/-+/g, "-")
    .replace(/-*:-*/g, ":").replace(/^[-:]+|-+$/g, "");
}
// Finds the closer that balances an already consumed opener of `name`.
function findClose(text, from, name) {
  const re = new RegExp(`\\[\\[(\\/?)${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=[\\s\\]])[^\\]]*\\]\\]`, "gi");
  re.lastIndex = from;
  let depth = 1, m;
  while ((m = re.exec(text))) {
    depth += m[1] ? -1 : 1;
    if (!depth) return { start: m.index, end: m.index + m[0].length };
  }
  return null;
}
function attr(text, name) {
  const m = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"']+))`, "i").exec(String(text || ""));
  return m ? (m[1] ?? m[2] ?? m[3]) : undefined;
}
module.exports = { fontSize, unixName, findClose, attr, SIZE_KEYWORDS };
