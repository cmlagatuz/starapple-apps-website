import { motionOK, glOK } from './fx-env.js';
import { loadGsap, loadThree } from './fx-loader.js';
import { ensureSectionIds } from './fx-transition.js';
import { initScroll } from './fx-scroll.js';
import { initNav } from './fx-nav.js';
import { initTactile } from './fx-cursor.js';

/**
 * Interaction layer entry point. Progressive by design: the site is complete without it, and every stage
 * (GSAP, three.js, each scene) fails independently if a library or WebGL is unavailable.
 */
async function boot() {
  ensureSectionIds();
  const root = document.documentElement;
  if (!motionOK()) { root.classList.remove('fx-pending'); initNav({}); return; }

  const gsapP = loadGsap(), threeP = glOK() ? loadThree() : null;
  threeP?.catch(() => {}); // handled where awaited below; avoids a transient unhandled-rejection warning
  let libs = null;
  try {
    libs = await gsapP;
    initScroll(libs);
  } catch (err) {
    console.warn('[fx] GSAP layer unavailable, using the base experience.', err);
    root.classList.remove('fx-pending');
  }
  initNav({ gsap: libs?.gsap });
  initTactile();

  if (!threeP) return;
  try {
    const THREE = await threeP;
    const scenes = [
      ['#story .story-art', host => import('./fx-gl-story.js').then(m => m.initStoryGL(THREE, host))]
    ];
    scenes.push(['#contact', host => import('./fx-gl-aurora.js').then(m => m.initAuroraGL(THREE, host, { tone: 0 }))]);
    scenes.push(['footer.footer', host => import('./fx-gl-aurora.js').then(m => m.initAuroraGL(THREE, host, { tone: 1 }))]);
    for (const [selector, make] of scenes) {
      const host = document.querySelector(selector);
      if (!host) continue;
      try { await make(host); host.classList.add('fx-gl-on'); }
      catch (err) { console.warn(`[fx] ${selector} scene skipped`, err); }
    }
  } catch (err) {
    console.warn('[fx] WebGL scenes unavailable.', err);
  }
}
boot();
