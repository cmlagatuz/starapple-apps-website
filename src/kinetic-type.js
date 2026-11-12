/** Word cycling and progressive letter-scramble micro-interactions. No external libraries. */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*';
const WORDS = ['idea.', 'launch.', 'product.', 'platform.', 'vision.'];

function glyph(char) {
  if (char === ' ' || /[.!?,'-]/.test(char)) return char;
  return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
}

/** Reveal the original string one character at a time, from left to right. */
export function scrambleText(node, goal, duration = 650, complete = () => {}) {
  if (!node) { complete(); return () => {}; }
  if (reducedMotion.matches) { node.textContent = goal; complete(); return () => {}; }
  let frame = 0, start;
  const maxLen = goal.length;
  function update(now) {
    start ??= now;
    const progress = Math.min(1, (now - start) / duration);
    const revealed = Math.floor(progress * (maxLen + 1));
    let out = '';
    for (let i = 0; i < maxLen; i++) out += i < revealed ? goal[i] : glyph(goal[i]);
    node.textContent = progress >= 1 ? goal : out;
    if (progress < 1) frame = requestAnimationFrame(update);
    else complete();
  }
  frame = requestAnimationFrame(update);
  return () => { cancelAnimationFrame(frame); node.textContent = goal; };
}

/** Animate clicked navigation links without preventing their normal anchor navigation. */
export function initNavScramble() {
  const anchors = document.querySelectorAll('#nav-links a, .nav-cta');
  anchors.forEach(anchor => {
    const node = [...anchor.childNodes].find(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
    if (!node) return;
    const original = node.textContent;
    const phrase = original.trim();
    let cancel = null;
    anchor.addEventListener('click', () => {
      if (reducedMotion.matches) return;
      cancel?.();
      const width = Math.ceil(anchor.getBoundingClientRect().width);
      if (width) anchor.style.minWidth = `${width}px`;
      anchor.classList.add('nav-scrambling');
      cancel = scrambleText(node, phrase, 670, () => {
        node.textContent = original;
        anchor.style.removeProperty('min-width');
        anchor.classList.remove('nav-scrambling');
        cancel = null;
      });
    });
  });
}

/** Start with 'idea.' and rotate through short, meaningful complements to 'Your next big'. */
export function initHeroKeyword() {
  const el = document.getElementById('hero-keyword');
  const hero = document.getElementById('hero');
  if (!el || !hero || reducedMotion.matches) return;
  let index = 0, visible = true, stopped = false, timer = 0, cancel = null;
  const schedule = () => {
    clearTimeout(timer);
    if (!stopped && visible && !document.hidden)
      timer = window.setTimeout(cycle, 2250);
  };
  const cycle = () => {
    if (stopped || !visible || document.hidden || reducedMotion.matches) return;
    index = (index + 1) % WORDS.length;
    const target = WORDS[index];
    el.classList.add('is-cycling');
    cancel = scrambleText(el, target, 490, () => {
      el.classList.remove('is-cycling');
      cancel = null;
      schedule();
    });
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? true;
      if (!visible) { clearTimeout(timer); cancel?.(); cancel = null; }
      else schedule();
    }, { threshold: 0.08 });
    observer.observe(hero);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimeout(timer);
      cancel?.(); cancel = null;
    } else schedule();
  });
  schedule();
}
