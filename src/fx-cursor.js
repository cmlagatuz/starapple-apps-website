import { env, pointer } from './fx-env.js';
import { starVertices, lerp } from './fx-math.js';

const INTERACTIVE = 'a[href],button:not(:disabled),[role="tab"],summary,input,select,textarea,label,.service-card';
const BRAND = ['#f9badd', '#e5d2fc', '#d88fc6', '#8bc4a1', '#f8e2b8'];

/** Ring cursor that follows the pointer (the native cursor stays), plus a star-dust trail and click bursts. */
export function initCursor() {
  if (!env.fine) return;
  const ring = document.createElement('div');
  ring.className = 'fx-cursor'; ring.setAttribute('aria-hidden', 'true');
  ring.innerHTML = '<span class="fx-cursor-label"></span>';
  document.body.appendChild(ring);
  const text = ring.firstElementChild;
  let x = pointer.x, y = pointer.y, shown = false;

  const canvas = document.createElement('canvas');
  canvas.className = 'fx-dust'; canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const g = canvas.getContext('2d');
  const size = () => { const r = Math.min(devicePixelRatio || 1, 2); canvas.width = innerWidth * r; canvas.height = innerHeight * r; g.setTransform(r, 0, 0, r, 0, 0); };
  size(); addEventListener('resize', size, { passive: true });
  const shape = starVertices(1, 0.45);
  let parts = [], loop = 0, lastSpawn = 0;

  function frame() {
    loop = 0;
    g.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => p.life > 0);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.vy += p.g; p.vx *= 0.985; p.rot += p.spin; p.life--;
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.globalAlpha = Math.min(1, p.life / p.max * 1.4) * 0.9; g.fillStyle = p.c;
      g.beginPath(); shape.forEach(([sx, sy], i) => (i ? g.lineTo(sx * p.s, -sy * p.s) : g.moveTo(sx * p.s, -sy * p.s))); g.closePath(); g.fill(); g.restore();
    }
    if (parts.length) loop = requestAnimationFrame(frame);
  }
  const wake = () => { if (!loop) loop = requestAnimationFrame(frame); };
  const spawn = (px, py, n, power, life) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = power * (0.4 + Math.random());
      parts.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.2, g: 0.035, s: 2 + Math.random() * 4, c: BRAND[(Math.random() * BRAND.length) | 0], rot: Math.random() * 6, spin: (Math.random() - 0.5) * 0.2, life, max: life });
    }
    if (parts.length > 160) parts.splice(0, parts.length - 160);
    wake();
  };

  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    if (!shown) { shown = true; x = e.clientX; y = e.clientY; ring.classList.add('is-on'); }
    const now = performance.now();
    if (now - lastSpawn > 38 && !e.target.closest?.('dialog,input,textarea,select')) { lastSpawn = now; spawn(e.clientX, e.clientY, 1, 0.5, 38); }
    const t = e.target.closest?.('[data-cursor],' + INTERACTIVE);
    ring.classList.toggle('is-link', Boolean(t));
    const label = t?.dataset?.cursor || (t?.classList?.contains('service-card') ? 'Open' : t?.classList?.contains('is-draggable') ? 'Drag' : '');
    text.textContent = label; ring.classList.toggle('has-label', Boolean(label));
  }, { passive: true });
  document.addEventListener('pointerleave', () => ring.classList.remove('is-on'));
  document.addEventListener('pointerenter', () => shown && ring.classList.add('is-on'));
  addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') { ring.classList.add('is-down'); spawn(e.clientX, e.clientY, 16, 3.2, 54); } });
  addEventListener('pointerup', () => ring.classList.remove('is-down'));
  (function follow() {
    x = lerp(x, pointer.x, 0.2); y = lerp(y, pointer.y, 0.2);
    ring.style.transform = `translate3d(${x}px,${y}px,0)`;
    requestAnimationFrame(follow);
  })();
}

/** Magnetic pull on buttons plus a 3D tilt on service cards, both through individual CSS properties (no transform clash). */
export function initTactile() {
  if (!env.fine) return;
  const mags = [...document.querySelectorAll('.hero .button, .contact-section .button, .lab-link, .founder-link, .fx-switch')];
  mags.forEach(el => {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, hot = false;
    const step = () => {
      cx = lerp(cx, tx, 0.18); cy = lerp(cy, ty, 0.18);
      el.style.translate = `${cx.toFixed(2)}px ${cy.toFixed(2)}px`;
      raf = (Math.abs(cx - tx) + Math.abs(cy - ty) > 0.05 || hot) ? requestAnimationFrame(step) : 0;
    };
    el.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect(); hot = true;
      tx = (e.clientX - (r.left + r.width / 2)) * 0.28; ty = (e.clientY - (r.top + r.height / 2)) * 0.34;
      if (!raf) raf = requestAnimationFrame(step);
    });
    el.addEventListener('pointerleave', () => { hot = false; tx = ty = 0; if (!raf) raf = requestAnimationFrame(step); });
  });
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      card.style.rotate = `${(-py).toFixed(3)} ${px.toFixed(3)} 0 ${(Math.hypot(px, py) * 9).toFixed(2)}deg`;
    });
    card.addEventListener('pointerleave', () => { card.style.rotate = ''; });
  });
  // Hovering the hero CTA makes the WebGL star pulse.
  document.querySelectorAll('.hero .button, .hero-secondary').forEach(el => el.addEventListener('pointerenter', () => document.getElementById('hero')?.dispatchEvent(new Event('fx:pulse'))));
}
