// Bundles src/plugin.cjs and its local requires into a single main.js.
// No npm dependencies: the plugin ships as plain CommonJS files.
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const src = path.join(root, "src");
const entry = path.join(src, "plugin.cjs");
const target = path.join(root, "main.js");

function bundle(text) {
  return text.replace(/require\("\.\/([\w-]+)"\)/g, (_, name) => {
    const code = bundle(fs.readFileSync(path.join(src, name + ".js"), "utf8"));
    return `(() => { const module = { exports: {} };\n${code}\nreturn module.exports; })()`;
  });
}

const input = bundle(fs.readFileSync(entry, "utf8"));
if (!input.includes("class WikidotPlugin")) throw new Error("Bundle looks empty: " + entry);
fs.writeFileSync(target, input);
console.log(`Built ${path.relative(process.cwd(), target)} (${input.length} bytes)`);
