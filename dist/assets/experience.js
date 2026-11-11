/** StarApple interactive design layer: original canvas artwork and product-style walkthrough. */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scenarios = {
  app: {
    number: '01', architecture: 'MOBILE PRODUCT', name: 'Apps that feel effortless.',
    description: 'From the first interaction to the hardest edge case, build a product people want to come back to.',
    steps: ['DISCOVERY', 'EXPERIENCE', 'ENGINEERING', 'DELIVERY'],
    code: { platform: 'mobile', priority: 'experience', architecture: 'scalable', status: 'ready to build' }
  },
  web: {
    number: '02', architecture: 'WEB EXPERIENCE', name: 'Web that moves people.',
    description: 'Fast, accessible web platforms with considered motion, fluid layouts, and a clear path from attention to action.',
    steps: ['RESEARCH', 'INTERFACE', 'PLATFORM', 'ITERATION'],
    code: { platform: 'web', priority: 'performance', experience: 'accessible', delivery: 'continuous' }
  },
  cloud: {
    number: '03', architecture: 'CLOUD PLATFORM', name: 'Infrastructure without friction.',
    description: 'Practical cloud foundations, automated releases, and observability that help your product grow with confidence.',
    steps: ['AUDIT', 'ARCHITECTURE', 'AUTOMATION', 'MONITORING'],
    code: { platform: 'cloud', deployment: 'automated', security: 'by design', scale: 'on demand' }
  },
  strategy: {
    number: '04', architecture: 'PRODUCT ROADMAP', name: 'Clarity before complexity.',
    description: 'Make the right decisions early. Align people, priorities, and technology around a useful long-term direction.',
    steps: ['UNDERSTAND', 'EVALUATE', 'ROADMAP', 'ENABLE'],
    code: { focus: 'business goals', approach: 'human first', decisions: 'evidence led', outcome: 'clear direction' }
  }
};
function initWalkthrough() {
  const tabs = [...document.querySelectorAll('.lab-tab')];
  const panel = document.getElementById('lab-panel');
  if (!panel || !tabs.length) return;
  let active = 'app';
  function select(name, focus = false) {
    const next = scenarios[name];
    if (!next) return;
    active = name;
    tabs.forEach(tab => {
      const selected = tab.dataset.scenario === name;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    });
    panel.dataset.scenario = name;
    panel.setAttribute('aria-label', `${name === 'app' ? 'App development' : name === 'web' ? 'Web platforms' : name === 'cloud' ? 'Cloud and DevOps' : 'IT strategy'} example`);
    const values = {
      'lab-architecture': next.architecture,
      'lab-cap-number': next.number,
      'lab-cap-title': next.name,
      'lab-cap-description': next.description,
      'lab-code-output': JSON.stringify(next.code, null, 2)
    };
    next.steps.forEach((step, i) => { values[`lab-node-${['one','two','three','four'][i]}`] = step; });
    for (const [id, value] of Object.entries(values)) {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    }
    if (!reducedMotion.matches) {
      panel.classList.remove('lab-switch');
      // Restart the tiny visual transition without hiding the form or moving focus.
      void panel.offsetWidth;
      panel.classList.add('lab-switch');
    }
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab.dataset.scenario));
    tab.addEventListener('keydown', event => {
      const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      select(tabs[nextIndex].dataset.scenario, true);
    });
  });
  select(active);
}
function initParticleCore() {
  const canvas = document.getElementById('core-canvas');
  if (!canvas) return;
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;
  const parent = canvas.parentElement;
  let width = 500, height = 500, visible = true, frame = 0, animation = 0;
  let targetX = 0, targetY = 0, tiltX = 0, tiltY = 0;
  const rand = (n) => { const x = Math.sin(n * 127.1 + 48.47) * 43758.5453; return x - Math.floor(x); };
  const points = Array.from({ length: 640 }, (_, i) => {
    const angle = rand(i + 1) * Math.PI * 2;
    const spread = Math.sqrt(rand(i + 781));
    const isRind = i > 490;
    const spikes = (1 + Math.cos(angle * 5 - Math.PI / 2)) / 2;
    const edge = isRind ? .9 + rand(i + 900) * .11 : .30 + Math.pow(spikes, 2.2) * .64;
    const radius = isRind ? edge : .12 + spread * edge;
    return { angle, radius, z: rand(i + 112) * 2 - 1, size: .55 + rand(i + 28) * 1.9, seed: rand(i + 93), rind: isRind };
  });
  const setSize = () => {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(240, rect.width); height = Math.max(260, rect.height);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
  };
  const render = () => {
    context.clearRect(0, 0, width, height);
    const t = frame * .004;
    tiltX += (targetX - tiltX) * .055;
    tiltY += (targetY - tiltY) * .055;
    const cx = width * .52, cy = height * .47, scale = Math.min(width * .41, height * .43);
    // Concentric scope rings give the particle fruit the feel of a technical scan.
    context.save();
    context.translate(cx, cy);
    context.strokeStyle = 'rgba(196, 169, 245, .115)';
    context.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      context.beginPath();context.arc(0, 0, scale * (i / 3), 0, Math.PI * 2);context.stroke();
    }
    context.beginPath();context.moveTo(-scale * 1.2, 0);context.lineTo(scale * 1.2, 0);context.moveTo(0, -scale * 1.2);context.lineTo(0, scale * 1.2);context.stroke();
    for (const p of points) {
      const a = p.angle + (reducedMotion.matches ? 0 : Math.sin(t * .29) * .06);
      const depth = Math.sin(a * 2 + t * .75) * .075 + p.z * .047;
      const x = Math.cos(a) * scale * p.radius * (1 + depth) + tiltX * (1 + p.z * .55) * 16;
      const y = Math.sin(a) * scale * p.radius * (1 + depth) * .96 + tiltY * (1 + p.z * .55) * 16;
      const twinkle = reducedMotion.matches ? 1 : .74 + Math.sin(t * 2 + p.seed * 13) * .25;
      context.globalAlpha = (p.rind ? .4 : .55 + p.seed * .4) * twinkle;
      context.fillStyle = p.rind ? '#8d7ec6' : p.seed > .82 ? '#8de3bf' : p.seed > .38 ? '#d6b7ff' : '#ef88bc';
      context.beginPath();context.arc(x,y,p.size,0,Math.PI*2);context.fill();
    }
    context.globalAlpha = 1;
    const glow = context.createRadialGradient(0, 0, 0, 0, 0, scale * .6);
    glow.addColorStop(0, 'rgba(203, 160, 255, .2)');glow.addColorStop(1,'rgba(132, 63, 182, 0)');
    context.fillStyle = glow;context.beginPath();context.arc(0, 0, scale * .63, 0, Math.PI*2);context.fill();
    context.restore();
  };
  const tick = () => {
    if (document.hidden || !visible || reducedMotion.matches) { animation = 0; return; }
    frame++; render(); animation = requestAnimationFrame(tick);
  };
  const resume = () => { if (!animation && visible && !document.hidden && !reducedMotion.matches) animation = requestAnimationFrame(tick); else if (reducedMotion.matches) render(); };
  parent.addEventListener('pointermove', e => {
    if (reducedMotion.matches || e.pointerType === 'touch') return;
    const box = parent.getBoundingClientRect();
    targetX = Math.max(-1, Math.min(1, (e.clientX - box.left) / box.width * 2 - 1));
    targetY = Math.max(-1, Math.min(1, (e.clientY - box.top) / box.height * 2 - 1));
  }, { passive: true });
  parent.addEventListener('pointerleave', () => { targetX = 0;targetY = 0; });
  if ('ResizeObserver' in window) new ResizeObserver(setSize).observe(parent);
  else window.addEventListener('resize', setSize, { passive: true });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) resume(); }, { rootMargin: '100px' }).observe(parent);
  document.addEventListener('visibilitychange', resume);
  reducedMotion.addEventListener?.('change', resume);
  setSize();resume();
}
function initPolish() {
  const progress = document.getElementById('reading-progress');
  const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  let pending = false;
  const refresh = () => {
    pending = false;
    if (!progress) return;
    const range = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${range > 0 ? Math.min(1,Math.max(0,scrollY/range)) : 0})`;
  };
  addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(refresh); } }, { passive: true });
  addEventListener('resize', refresh, { passive: true });refresh();
  if ('IntersectionObserver' in window) {
    const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    // Observe every section to maintain a predictable active state.
    const spy = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) navLinks.forEach(a => a.classList.toggle('current', a.getAttribute('href') === `#${entry.target.id}`));
    }, { rootMargin: '-24% 0px -62% 0px' });
    sections.forEach(section => spy.observe(section));
  }
  if (reducedMotion.matches) return;
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch') return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${(event.clientX - rect.left) / rect.width * 100}%`);
      card.style.setProperty('--my', `${(event.clientY - rect.top) / rect.height * 100}%`);
    }, { passive: true });
  });
}
initWalkthrough();
initParticleCore();
initPolish();
