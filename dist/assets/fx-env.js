/** Capability detection and tiny shared state for the FX layer (no dependencies, safe to import anywhere). */
const mq = q => (typeof matchMedia === 'function' ? matchMedia(q) : { matches: false, addEventListener() {} });
export const FX_KEY = 'starapple-fx';

export const env = {
  reduced: mq('(prefers-reduced-motion: reduce)').matches,
  coarse: mq('(pointer: coarse)').matches,
  fine: mq('(hover: hover) and (pointer: fine)').matches,
  saveData: Boolean(navigator.connection?.saveData),
  // Prefer smoothness when memory information is available; fall back to CPU and mobile hints.
  lowEnd: (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4) ||
    (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4) ||
    (typeof navigator.deviceMemory !== 'number' && typeof navigator.hardwareConcurrency !== 'number' && mq('(pointer: coarse)').matches),
  preference: (() => { try { const pref = localStorage.getItem(FX_KEY); return pref === 'on' || pref === 'off' ? pref : 'auto'; } catch { return 'auto'; } })(),
  get userOff() { return this.preference === 'off'; },
  get userOn() { return this.preference === 'on'; },
  narrow: () => innerWidth <= 800
};

/** Respect OS accessibility preferences. Auto-disable FX on limited devices,
 * but explicit user opt-in enables lightweight effects without enabling WebGL. */
export const motionOK = () => !env.reduced && !env.userOff && (env.userOn || (!env.saveData && !env.lowEnd));
/** Heavier WebGL scenes remain off on low-end and data-saver devices even when FX is enabled manually. */
export const glOK = () => motionOK() && !env.saveData && !env.lowEnd && canWebGL();

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
