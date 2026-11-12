import { env, whenVisible } from './fx-env.js';

/**
 * Minimal render-loop wrapper around a three.js WebGLRenderer that lives inside `host`.
 * Renders only while the host is on screen and the tab is visible; renders a single static frame when motion is off.
 */
export function createStage(THREE, host, { className = '', maxDpr = 1.75, animate = true, antialias = true } = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = `fx-canvas ${className}`.trim();
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  const dprCap = env.lowEnd ? Math.min(maxDpr, 1.25) : maxDpr;

  const stage = { renderer, canvas, width: 1, height: 1, time: 0, dead: false };
  const resizers = new Set();
  let draw = () => {}, raf = 0, last = 0, visible = false;

  stage.onResize = fn => { resizers.add(fn); fn(stage.width, stage.height); };
  stage.setRender = fn => { draw = fn; };

  function resize() {
    const r = host.getBoundingClientRect();
    stage.width = Math.max(1, Math.round(r.width));
    stage.height = Math.max(1, Math.round(r.height));
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dprCap));
    renderer.setSize(stage.width, stage.height, false);
    resizers.forEach(fn => fn(stage.width, stage.height));
    if (!animate || !running()) stage.renderOnce();
  }
  const running = () => animate && visible && !document.hidden && !stage.dead;

  function tick(now) {
    raf = 0;
    if (!running()) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now; stage.time += dt;
    draw(dt, stage.time);
    raf = requestAnimationFrame(tick);
  }
  function sync() {
    if (running() && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
    else if (!running() && raf) { cancelAnimationFrame(raf); raf = 0; }
  }
  stage.renderOnce = () => { if (!stage.dead) draw(0, stage.time); };

  const ro = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
  ro ? ro.observe(host) : addEventListener('resize', resize, { passive: true });
  const stopVis = whenVisible(host, v => { visible = v; sync(); });
  const onDoc = () => sync();
  document.addEventListener('visibilitychange', onDoc);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); stage.dead = true; sync(); });
  resize();

  stage.dispose = () => {
    stage.dead = true; sync(); ro?.disconnect(); stopVis();
    document.removeEventListener('visibilitychange', onDoc);
    renderer.dispose(); canvas.remove();
  };
  return stage;
}
