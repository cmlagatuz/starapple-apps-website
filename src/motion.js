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
  } else document.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
  const header = document.getElementById('site-header');
  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 12);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
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
