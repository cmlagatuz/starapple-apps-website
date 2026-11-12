/** Capability detection and tiny shared state for the FX layer (no dependencies, safe to import anywhere). */
const mq = q => (typeof matchMedia === 'function' ? matchMedia(q) : { matches: false, addEventListener() {} });
export const FX_KEY = 'starapple-fx-v2';

export const env = {
  reduced: mq('(prefers-reduced-motion: reduce)').matches,
  coarse: mq('(pointer: coarse)').matches,
  fine: mq('(hover: hover) and (pointer: fine)').matches,
  preference: (() => { try { const pref = localStorage.getItem(FX_KEY); return pref === 'on' || pref === 'off' ? pref : 'on'; } catch { return 'auto'; } })(),
  get userOff() { return this.preference === 'off'; },
  get userOn() { return this.preference === 'on'; },
  narrow: () => innerWidth <= 800
};

/** Motion defaults on for every visitor. A visitor opt-out and OS reduced-motion
 * preference are respected; WebGL capability is checked without device-tier limits. */
export const motionOK = () => !env.reduced && !env.userOff;
/** Full WebGL is available whenever visual FX is on and the browser supports it. */
export const glOK = () => motionOK() && canWebGL();

let glSupport;
export function canWebGL() {
  if (glSupport !== undefined) return glSupport;
  try {
    const c = document.createElement('canvas');
    glSupport = Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { glSupport = false; }
  return glSupport;
}

/** Normalised pointer (nx, ny in -1..1, y up) and pixel position, updated by a single passive listener. */
export const pointer = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0, moved: false };
addEventListener('pointermove', e => {
  pointer.x = e.clientX; pointer.y = e.clientY;
  pointer.nx = (e.clientX / innerWidth) * 2 - 1;
  pointer.ny = -((e.clientY / innerHeight) * 2 - 1);
  pointer.moved = true;
}, { passive: true });

/** Cross-module scene state written by ScrollTrigger and read by WebGL loops. */
export const fxState = { heroProgress: 0, storyProgress: 0, pulse: 0 };

/** Call `fn(isVisible)` whenever `el` enters or leaves the viewport. */
export function whenVisible(el, fn, margin = '120px') {
  if (!('IntersectionObserver' in window)) { fn(true); return () => {}; }
  const io = new IntersectionObserver(([entry]) => fn(entry.isIntersecting), { rootMargin: margin });
  io.observe(el);
  return () => io.disconnect();
}

export function setUserFx(on) {
  try { localStorage.setItem(FX_KEY, on ? 'on' : 'off'); } catch { /* storage blocked */ }
  location.reload();
}
