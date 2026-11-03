const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createCompletionPopup } = require('./popup');

function fakeDoc() {
  const created = [];
  const doc = {
    body: { appendChild(el) { created.push(el); } },
    defaultView: { innerWidth: 1200, innerHeight: 800 },
    createElement() {
      const el = {
        style: {}, children: [], textContent: "", className: "", offsetWidth: 220, offsetHeight: 200,
        appendChild(child) { this.children.push(child); },
        addEventListener() {}, remove() { this.removed = true; }, scrollIntoView() {}
      };
      return el;
    }
  };
  return { doc, created };
}
function fakeView(text) {
  return {
    state: { doc: { toString: () => text }, selection: { main: { head: text.length } } },
    coordsAtPos: () => ({ left: 100, top: 100, bottom: 120 }),
    dispatch(value) { this.last = value; },
    focus() { this.focused = true; }
  };
}

test('slash opens the local popup with snippet options and applies on Enter', () => {
  const { doc, created } = fakeDoc();
  const view = fakeView('/');
  const popup = createCompletionPopup(view, doc);
  popup.sync();
  assert.equal(popup.open, true);
  assert.equal(created[0].children.length > 10, true);
  assert.equal(view.last, undefined);
  const handled = popup.handleKey({ key: 'Enter' });
  assert.equal(handled, true);
  assert.equal(view.last.changes.insert,'****');
  assert.equal(view.last.selection.anchor, view.last.changes.from + 2);
  assert.equal(popup.open, false);
  assert.ok(view.focused);
});
test('arrow keys move the highlight and Escape closes without inserting', () => {
  const { doc } = fakeDoc();
  const view = fakeView('/');
  const popup = createCompletionPopup(view, doc);
  popup.sync();
  assert.equal(popup.handleKey({ key: 'ArrowDown' }), true);
  assert.equal(popup.handleKey({ key: 'Escape' }), true);
  assert.equal(popup.open, false);
  assert.equal(view.last, undefined);
});
test('class context lists the classes already present in the draft', () => {
  const text = '[[div class="verse"]]\n\n[[div class="';
  const { doc, created } = fakeDoc();
  const view = fakeView(text);
  const popup = createCompletionPopup(view, doc);
  popup.sync();
  assert.equal(popup.open, true);
  const labels = created[0].children.map(child => child.textContent);
  assert.ok(labels.some(label => label.startsWith('verse')));
});
test('plain prose produces no popup', () => {
  const { doc } = fakeDoc();
  const view = fakeView('普通正文，没有语法。');
  const popup = createCompletionPopup(view, doc);
  popup.sync();
  assert.equal(popup.open, false);
});
