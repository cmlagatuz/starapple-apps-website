/** Client-first interactive solution explorer, designed without fake metrics. */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scenarios = {
  app: {
    number:'01', icon:'◈', title:'Make your app idea real.', summary:'A thoughtful digital product that puts your users first.',
    benefits:['Clear purpose','Great usability','Room to grow'], name:'From first sketch to real product.',
    description:'We can map the experience, shape a prototype, and build a dependable application with your audience in mind.',
    deliverables:['Discovery and user journeys','Prototypes and interface design','Development and launch planning'],
    scope:'Custom App Development', cta:'Discuss an app project'
  },
  web: {
    number:'02', icon:'▣', title:'Make every visit matter.', summary:'A web experience that makes a strong first impression—and helps people take action.',
    benefits:['Easy to navigate','Made to perform','Designed to convert'], name:'A web presence with a purpose.',
    description:'From a distinctive brand website to a business platform, we focus on clarity, speed, accessibility, and useful experiences.',
    deliverables:['Site structure and user experience','Responsive design and development','Performance and launch support'],
    scope:'Web Platforms', cta:'Discuss a web project'
  },
  cloud: {
    number:'03', icon:'⌘', title:'Build on a stronger foundation.', summary:'Infrastructure and workflows chosen for resilience and sensible growth.',
    benefits:['Better reliability','Smarter workflows','Easier scaling'], name:'Technology that works behind the scenes.',
    description:'We help plan practical cloud architecture, deployment workflows, and integrations that make day-to-day operations smoother.',
    deliverables:['Cloud architecture review','Automation and integrations','Deployment and maintenance planning'],
    scope:'Cloud Infrastructure', cta:'Discuss cloud solutions'
  },
  strategy: {
    number:'04', icon:'◎', title:'Turn complexity into direction.', summary:'A sensible plan built around what matters to your business.',
    benefits:['Define priorities','Find opportunities','Move with confidence'], name:'Clarity before the first line of code.',
    description:'We can help evaluate your idea, explore viable options, and prioritize the steps that bring the most value.',
    deliverables:['Discovery and needs assessment','Technology options and recommendations','Project scope and practical roadmap'],
    scope:'IT Consulting', cta:'Discuss your next step'
  }
};
function initWalkthrough() {
  const tabs = [...document.querySelectorAll('.lab-tab')];
  const panel = document.getElementById('lab-panel');
  if (!panel || !tabs.length) return;
  const byId = id => document.getElementById(id);
  const outcomeHost = byId('lab-outcomes');
  const deliverableHost = byId('lab-deliverables');
  const consult = byId('lab-consult');
  function select(name, focus = false) {
    const next = scenarios[name];
    if (!next) return;
    tabs.forEach(tab => {
      const selected = tab.dataset.scenario === name;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
      if (selected) panel.setAttribute('aria-labelledby', tab.id);
    });
    panel.dataset.scenario = name;
    for (const [id,value] of Object.entries({
      'lab-cap-number': next.number,
      'lab-cap-title': next.name,
      'lab-cap-description': next.description,
      'lab-outcome-icon': next.icon,
      'lab-outcome-title': next.title,
      'lab-outcome-summary': next.summary
    })) byId(id).textContent = value;
    outcomeHost.replaceChildren(...next.benefits.map(value => {
      const span = document.createElement('span');span.textContent=value;return span;
    }));
    deliverableHost.replaceChildren(...next.deliverables.map(value => {
      const item = document.createElement('li');item.textContent=value;return item;
    }));
    consult.dataset.service = next.scope;
    consult.firstChild.textContent = next.cta + ' ';
    if (!reducedMotion.matches) {
      panel.classList.remove('lab-switch');
      void panel.offsetWidth;
      panel.classList.add('lab-switch');
    }
  }
  tabs.forEach((tab,index) => {
    tab.addEventListener('click', () => select(tab.dataset.scenario));
    tab.addEventListener('keydown', event => {
      if (!['ArrowRight','ArrowLeft','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length-1 : (index+(event.key === 'ArrowRight'?1:-1)+tabs.length)%tabs.length;
      select(tabs[nextIndex].dataset.scenario, true);
    });
  });
  select('app');
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
