import { starClip } from './fx-math.js';
import { fruitSVG } from './brand.js';
import { env } from './fx-env.js';

const LABELS = { hero: 'Home', lab: 'Explore', services: 'Solutions', philosophy: 'Philosophy', story: 'Our core', founders: 'Founders', contact: "Let's talk", footer: 'Say hello' };
const ORDER = ['hero', 'lab', 'services', 'philosophy', 'story', 'founders', 'contact', 'footer'];
let busy = false, overlay, fill, label, logo, gsapRef;

/** Give id-less panels stable anchors so every panel is addressable (and shows up in the section rail). */
export function ensureSectionIds() {
  const s = document.querySelector('.statement'); if (s && !s.id) s.id = 'philosophy';
  const f = document.querySelector('footer.footer'); if (f && !f.id) f.id = 'footer';
}

function build() {
  overlay = document.createElement('div');
  overlay.className = 'fx-iris'; overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = '<div class="fx-iris-fill"><div class="fx-iris-brand"><span class="fx-iris-logo"></span><span class="fx-iris-label"></span></div></div>';
  document.body.appendChild(overlay);
  fill = overlay.firstElementChild;
  label = overlay.querySelector('.fx-iris-label');
  logo = overlay.querySelector('.fx-iris-logo');
  logo.innerHTML = fruitSVG('fx-iris-fruit', true);
}

function scrollToPanel(target) {
  const root = document.documentElement, prev = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  const nav = parseFloat(getComputedStyle(root).getPropertyValue('--view-nav')) || 0;
  const top = target.getBoundingClientRect().top + scrollY - (target.id === 'hero' ? 0 : nav);
  scrollTo(0, Math.max(0, Math.round(top)));
  root.style.scrollBehavior = prev;
}

function settle(target, hash) {
  if (hash && location.hash !== hash) history.pushState(null, '', hash);
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  target.dispatchEvent(new CustomEvent('fx:section-enter', { bubbles: true }));
}

/** Star-shaped iris wipe to another panel; falls back to a plain jump if motion is unavailable. */
export function goTo(target, origin = { x: innerWidth / 2, y: innerHeight / 2 }) {
  if (!target || busy) return;
  const hash = target.id ? `#${target.id}` : '';
  if (!gsapRef || env.reduced || env.userOff) { scrollToPanel(target); settle(target, hash); return; }
  const gsap = gsapRef;
  busy = true;
  const far = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y));
  const R = far * 3.1, st = { p: 0 };
  label.textContent = `${String(ORDER.indexOf(target.id) + 1).padStart(2, '0')} — ${LABELS[target.id] || ''}`.toUpperCase();
  gsap.set(fill, { clipPath: starClip(origin.x, origin.y, 0.1), yPercent: 0, display: 'block' });
  gsap.set([logo, label], { autoAlpha: 0, y: 12, scale: 0.8 });
  overlay.classList.add('is-active');
  const done = () => { gsap.set(fill, { display: 'none', clearProps: 'clipPath,transform' }); overlay.classList.remove('is-active'); busy = false; };
  gsap.timeline({ onComplete: done, onInterrupt: done })
    .to(st, { p: 1, duration: 0.7, ease: 'power3.in', onUpdate: () => { fill.style.clipPath = starClip(origin.x, origin.y, R * st.p, st.p * 1.2); } })
    .set(fill, { clipPath: 'none' })
    .to([logo, label], { autoAlpha: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.8)', stagger: 0.06 }, '-=0.05')
    .add(() => { scrollToPanel(target); }, '+=0.05')
    .to(fill, { yPercent: -100, duration: 0.85, ease: 'expo.inOut' }, '+=0.22')
    .add(() => settle(target, hash), '-=0.45');
}

export function initTransitions(gsap) {
  gsapRef = gsap;
  ensureSectionIds();
  build();
  document.addEventListener('click', e => {
    const a = e.target.closest?.('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const id = a.getAttribute('href').slice(1);
    const target = id && document.getElementById(id);
    if (!target || !target.classList.contains('page-panel')) return;
    e.preventDefault();
    const rect = a.getBoundingClientRect();
    const origin = e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const here = [...document.querySelectorAll('.page-panel')].find(p => { const r = p.getBoundingClientRect(); return r.top <= innerHeight * 0.5 && r.bottom > innerHeight * 0.5; });
    if (here === target) return;
    goTo(target, origin);
  });
}
