"use strict";
// Minimal preview has no site shell, so pages written for a dark theme (light
// text on a dark #container) become unreadable on the plain background.
// The preview iframe has no scripts, so the decision is made statically from
// the page CSS: find the text colour and background the page assigns to its
// main containers and pick a matching backdrop.
const NAMED = { black: "#000", white: "#fff", gray: "#808080", grey: "#808080", silver: "#c0c0c0", red: "#f00", maroon: "#800000", navy: "#000080", darkgray: "#a9a9a9", darkgrey: "#a9a9a9", lightgray: "#d3d3d3", lightgrey: "#d3d3d3", dimgray: "#696969", whitesmoke: "#f5f5f5", gainsboro: "#dcdcdc", snow: "#fffafa", ivory: "#fffff0", beige: "#f5f5dc", wheat: "#f5deb3", linen: "#faf0e6" };
const TARGET = /^(?::root|html|body|#html-body|#skrollr-body|#container|#container-wrap|#content-wrap|#main-content|#page-content|#page-content\s+p|p|\.content-panel|\.page-content)$/i;
function parseColor(value) {
  let text = String(value || "").trim().toLowerCase().replace(/\s*!important$/, "");
  if (NAMED[text]) text = NAMED[text];
  let m;
  if ((m = /^#([0-9a-f]{3,4})$/.exec(text))) return [...m[1].slice(0, 3)].map(c => parseInt(c + c, 16)).concat(m[1].length === 4 ? parseInt(m[1][3] + m[1][3], 16) / 255 : 1);
  if ((m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/.exec(text))) return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)).concat(m[2] ? parseInt(m[2], 16) / 255 : 1);
  if ((m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(text))) {
    const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [+m[1], +m[2], +m[3], a];
  }
  if ((m = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(text))) {
    const h = +m[1] / 360, s = +m[2] / 100, l = +m[3] / 100;
    const f = n => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); };
    const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    return [f(0), f(8), f(4), a];
  }
  return null;
}
function luminance([r, g, b]) {
  const c = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}
// Collects simple top-level rules (inside @media too) and custom properties.
function rules(css) {
  const out = [], vars = Object.create(null);
  const text = String(css || "").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of text.matchAll(/([^{}@;]+)\{([^{}]*)\}/g)) {
    const selectors = m[1].split(",").map(s => s.trim()).filter(Boolean);
    const decls = Object.create(null);
    for (const part of m[2].split(";")) {
      const i = part.indexOf(":"); if (i < 0) continue;
      const name = part.slice(0, i).trim().toLowerCase(), value = part.slice(i + 1).trim();
      if (name.startsWith("--")) vars[name] = value; else decls[name] = value;
    }
    out.push({ selectors, decls });
  }
  return { list: out, vars };
}
function resolve(value, vars, depth = 0) {
  if (!value || depth > 8) return value;
  return String(value).replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/g, (_, name, fallback) => resolve(vars[name] ?? fallback ?? "", vars, depth + 1));
}
function backgroundColor(value, vars) {
  const text = resolve(value, vars);
  if (!text) return null;
  const direct = parseColor(text);
  if (direct) return direct;
  // A shorthand or gradient: take its first recognisable colour.
  for (const m of text.matchAll(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b[a-z]+\b/gi)) { const c = parseColor(m[0]); if (c) return c; }
  return null;
}
function analyze(css) {
  const { list, vars } = rules(css);
  let text = null, background = null;
  for (const rule of list) {
    if (!rule.selectors.some(s => TARGET.test(s))) continue;
    const color = rule.decls.color && parseColor(resolve(rule.decls.color, vars));
    if (color && color[3] > 0.5) text = color;
    const bg = backgroundColor(rule.decls["background-color"] || rule.decls.background, vars);
    if (bg && bg[3] > 0.5) background = bg;
  }
  return { text, background };
}
// Returns the html{} declarations used by Minimal.
function minimalPalette(css, dark = false, enabled = true) {
  const light = "color-scheme:light;background:#faf9f6;color:#35343a", darkPalette = "color-scheme:dark;background:#202024;color:#e2e2e5";
  const fallback = dark ? darkPalette : light;
  if (!enabled) return { palette: fallback, reason: "" };
  const { text, background } = analyze(css);
  // The page paints its own backdrop; only make the outer frame match it.
  if (background) {
    const isDark = luminance(background) < 0.2;
    return { palette: `color-scheme:${isDark ? "dark" : "light"};background:rgb(${background.slice(0, 3).map(Math.round).join(",")});color:${isDark ? "#e2e2e5" : "#35343a"}`, reason: "page-background" };
  }
  if (text) {
    const lum = luminance(text);
    if (lum > 0.45) return { palette: darkPalette, reason: "light-text" };
    if (lum < 0.12) return { palette: light, reason: "dark-text" };
  }
  return { palette: fallback, reason: "" };
}
module.exports = { parseColor, luminance, analyze, minimalPalette };
