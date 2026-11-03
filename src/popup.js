"use strict";
// A self-contained completion popup. CodeMirror's own autocomplete extension is
// not reliably visible inside a TextFileView here, so the editor drives this
// small list directly from the document context.
const {completions} = require("./complete");
function createCompletionPopup(view, doc) {
  let el = null, state = null, index = 0;
  const win = doc.defaultView || null;
  function close() { if (el) { el.remove(); el = null; state = null; } }
  function paint() {
    if (!el || !state) return;
    [...el.children].forEach((child, i) => {
      child.style.background = i === index ? "var(--background-modifier-hover)" : "transparent";
      child.style.color = i === index ? "var(--text-normal)" : "var(--text-muted)";
    });
    const active = el.children[index];
    if (active && active.scrollIntoView) active.scrollIntoView({ block: "nearest" });
  }
  function choose(i) {
    if (!state || !state.options[i]) return;
    const option = state.options[i];
    const { from, to } = state;
    close();
    view.dispatch({ changes: { from, to, insert: option.text }, selection: { anchor: from + (option.cursor ?? option.text.length) } });
    view.focus();
  }
  function open(result, pos) {
    close();
    el = doc.createElement("div");
    el.className = "wikidot-completion";
    Object.assign(el.style, {
      position: "fixed", zIndex: "9999", minWidth: "200px", maxWidth: "360px", maxHeight: "260px", overflow: "auto",
      padding: "4px", background: "var(--background-primary)", border: "1px solid var(--background-modifier-border)",
      borderRadius: "6px", boxShadow: "0 6px 20px rgba(0,0,0,.22)", fontFamily: '"Maple Mono NL", var(--font-monospace), monospace', fontSize: "12px"
    });
    result.options.forEach((option, i) => {
      const item = doc.createElement("div");
      item.textContent = option.label;
      if (option.detail) {
        const detail = doc.createElement("span");
        detail.textContent = "  " + option.detail;
        detail.style.color = "var(--text-faint)";
        item.appendChild(detail);
      }
      Object.assign(item.style, { padding: "4px 8px", borderRadius: "4px", cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" });
      item.addEventListener("mousedown", event => { event.preventDefault(); event.stopPropagation(); choose(i); });
      el.appendChild(item);
    });
    doc.body.appendChild(el);
    state = result; index = 0;
    const coords = view.coordsAtPos(pos);
    if (coords && win) {
      const width = el.offsetWidth || 220, height = el.offsetHeight || 0;
      const left = Math.max(4, Math.min(coords.left, win.innerWidth - width - 8));
      const top = coords.bottom + height + 12 > win.innerHeight ? Math.max(4, coords.top - height - 4) : coords.bottom + 4;
      el.style.left = left + "px";
      el.style.top = top + "px";
    }
    paint();
  }
  function sync() {
    const pos = view.state.selection.main.head;
    const result = completions(view.state.doc.toString(), pos);
    if (!result || !result.options.length) { close(); return; }
    if(state&&state.from===result.from&&state.to===result.to&&JSON.stringify(state.options)===JSON.stringify(result.options))return;
    open(result, pos);
  }
  function handleKey(event) {
    if (event.isComposing) return false;
    if (!el) return false;
    if (event.key === "ArrowDown") { index = (index + 1) % state.options.length; paint(); return true; }
    if (event.key === "ArrowUp") { index = (index - 1 + state.options.length) % state.options.length; paint(); return true; }
    if (event.key === "Enter" || event.key === "Tab") { choose(index); return true; }
    if (event.key === "Escape") { close(); return true; }
    return false;
  }
  return { sync, close, handleKey, get open() { return !!el; } };
}
module.exports = { createCompletionPopup };
