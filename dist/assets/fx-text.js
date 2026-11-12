/**
 * Wraps each word of `el` in a masked inner span so it can slide up. Child elements (<em>, <span>) keep their styling
 * and <br> is preserved. The original reading text is kept for assistive tech via aria-label.
 * Returns the inner word spans.
 */
export function splitWords(el) {
  if (!el || el.dataset.fxSplit) return el ? [...el.querySelectorAll('.fx-wi')] : [];
  const label = el.textContent.replace(/\s+/g, ' ').trim();
  const words = [];
  (function walk(node) {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        const parts = child.textContent.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        for (const part of parts) {
          if (!part) continue;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); continue; }
          const outer = document.createElement('span'); outer.className = 'fx-w'; outer.setAttribute('aria-hidden', 'true');
          const inner = document.createElement('span'); inner.className = 'fx-wi'; inner.textContent = part;
          outer.appendChild(inner); frag.appendChild(outer); words.push(inner);
        }
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') walk(child);
    }
  })(el);
  el.setAttribute('aria-label', label);
  el.dataset.fxSplit = '1';
  return words;
}
