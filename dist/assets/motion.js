export function initMotion() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) {
    const reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
      }, { threshold: .09, rootMargin: '0px 0px -35px 0px' });
      reveals.forEach(el => observer.observe(el));
    } else reveals.forEach(el => el.classList.add('in-view'));
    initCursorDust();
  } else document.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
  const header = document.getElementById('site-header');
  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 12);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
}
function initCursorDust() {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const canvas = document.getElementById('stardust');
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;
  let particles = [], running = false, previous = 0;
  const resize = () => { const ratio = Math.min(devicePixelRatio || 1, 2); canvas.width = innerWidth * ratio; canvas.height = innerHeight * ratio; ctx.setTransform(ratio, 0, 0, ratio, 0, 0); };
  resize(); window.addEventListener('resize', resize, { passive: true });
  const draw = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) {
      ctx.globalAlpha = p.life / 36 * .65;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      p.x += p.vx; p.y += p.vy; p.life--;
    }
    ctx.globalAlpha = 1;
    if (particles.length) requestAnimationFrame(draw); else running = false;
  };
  window.addEventListener('pointermove', e => {
    if (performance.now() - previous < 28) return;
    previous = performance.now();
    particles.push({ x: e.clientX, y: e.clientY, vx: (Math.random()-.5)*1.4, vy: -.5-Math.random(), size: .8+Math.random()*2.1, life: 25+Math.floor(Math.random()*10), color: Math.random() > .3 ? '#b65aa4' : '#73ae8f' });
    if (particles.length > 65) particles.shift();
    if (!running) { running = true; requestAnimationFrame(draw); }
  }, { passive: true });
}
export function burstConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const host = document.getElementById('confetti-layer');
  if (!host) return;
  const colors = ['#e67bbd', '#5e3b82', '#75b597', '#f7d185', '#d8b5eb'];
  const viewportCenter = innerWidth / 2;
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('i'); p.className = 'confetti-piece';
    p.style.left = `${viewportCenter + (Math.random()-.5)*350}px`;
    p.style.top = `${innerHeight * .35}px`;
    p.style.setProperty('--confetti', colors[i % colors.length]);
    p.style.setProperty('--dx', `${(Math.random()-.5)*900}px`);
    p.style.setProperty('--dy', `${100 + Math.random()*650}px`);
    p.style.setProperty('--spin', `${(Math.random()-.5)*1100}deg`);
    p.style.animationDelay = `${Math.random()*.25}s`;
    host.appendChild(p); p.addEventListener('animationend', () => p.remove(), { once: true });
  }
}
