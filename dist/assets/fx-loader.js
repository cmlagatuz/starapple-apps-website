/** Lazy, version-pinned library loading. Every consumer must tolerate a rejected promise (offline / blocked CDN). */
const GSAP_BASE = 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/';
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.min.js';

function addScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = true; s.crossOrigin = 'anonymous';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(s);
  });
}

let gsapPromise, threePromise;
export function loadGsap() {
  gsapPromise ??= (async () => {
    await addScript(`${GSAP_BASE}gsap.min.js`);
    await addScript(`${GSAP_BASE}ScrollTrigger.min.js`);
    const { gsap, ScrollTrigger } = window;
    if (!gsap || !ScrollTrigger) throw new Error('GSAP did not initialise');
    gsap.registerPlugin(ScrollTrigger);
    return { gsap, ScrollTrigger };
  })();
  return gsapPromise;
}
export function loadThree() {
  threePromise ??= import(/* @vite-ignore */ THREE_URL);
  return threePromise;
}
