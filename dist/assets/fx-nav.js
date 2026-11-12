import { goTo } from './fx-transition.js';
import { env, motionOK, setUserFx } from './fx-env.js';

const ITEMS = [
  ['hero', 'Home'], ['lab', 'Explore'], ['services', 'Solutions'], ['philosophy', 'Philosophy'],
  ['story', 'Our core'], ['founders', 'Founders'], ['founders-two', 'Our people'], ['founders-three', 'Our team'], ['contact', "Let's talk"], ['footer', 'Say hello']
];

/** Right-hand section rail + "03 / 08" counter + staggered mobile menu + a persistent effects switch. */
export function initNav({ gsap } = {}) {
  const panels = ITEMS.map(([id, name]) => ({ id, name, el: document.getElementById(id) })).filter(p => p.el);
  if (!panels.length) return;

  const rail = document.createElement('nav');
  rail.className = 'fx-rail'; rail.setAttribute('aria-label', 'Page sections');
  const list = document.createElement('ol');
  panels.forEach((p, i) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${p.id}`; a.dataset.id = p.id;
    a.innerHTML = `<span class="fx-rail-label">${p.name}</span><span class="fx-rail-dot" aria-hidden="true"></span>`;
    a.setAttribute('aria-label', `${String(i + 1).padStart(2, '0')} ${p.name}`);
    li.appendChild(a); list.appendChild(li);
  });
  rail.appendChild(list);
  document.body.appendChild(rail);

  const counter = document.createElement('div');
  counter.className = 'fx-counter'; counter.setAttribute('aria-hidden', 'true');
  counter.innerHTML = `<span class="fx-counter-now">01</span><i></i><span>${String(panels.length).padStart(2, '0')}</span><b class="fx-counter-name">${panels[0].name}</b>`;
  document.body.appendChild(counter);
  const now = counter.querySelector('.fx-counter-now'), name = counter.querySelector('.fx-counter-name');

  let active = -1;
  function setActive(i) {
    if (i === active) return;
    active = i;
    rail.querySelectorAll('a').forEach((a, k) => { k === i ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'); });
    const text = String(i + 1).padStart(2, '0');
    if (gsap && !env.reduced) {
      gsap.timeline().to([now, name], { yPercent: -60, autoAlpha: 0, duration: 0.18, ease: 'power2.in' })
        .add(() => { now.textContent = text; name.textContent = panels[i].name; })
        .fromTo([now, name], { yPercent: 60 }, { yPercent: 0, autoAlpha: 1, duration: 0.3, ease: 'power3.out' });
    } else { now.textContent = text; name.textContent = panels[i].name; }
    document.documentElement.dataset.section = panels[i].id;
    rail.classList.toggle('on-light', false);
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      for (const en of entries) if (en.isIntersecting) setActive(panels.findIndex(p => p.el === en.target));
    }, { rootMargin: '-45% 0px -45% 0px' });
    panels.forEach(p => io.observe(p.el));
  }
  setActive(0);

  // Keyboard: [ and ] hop between panels (ignored while typing or when a dialog is open).
  addEventListener('keydown', e => {
    if (e.key !== '[' && e.key !== ']') return;
    if (e.target.closest?.('input,textarea,select,[contenteditable]') || document.querySelector('dialog[open]')) return;
    const next = Math.min(panels.length - 1, Math.max(0, active + (e.key === ']' ? 1 : -1)));
    if (next !== active) goTo(panels[next].el, { x: innerWidth - 40, y: innerHeight / 2 });
  });

  // Staggered mobile menu
  document.querySelectorAll('#nav-links a').forEach((a, i) => a.style.setProperty('--i', i));

  // Persisted FX switch: low-resource auto-off can be overridden for lightweight effects.
  const sw = document.createElement('button');
  sw.type = 'button'; sw.className = 'fx-switch';
  const on = motionOK();
  const automaticOff = env.reduced;
  sw.setAttribute('aria-pressed', String(on));
  sw.setAttribute('aria-label', env.reduced ? 'Effects unavailable while system reduced motion is enabled' : on ? 'Turn off visual effects' : 'Turn on visual effects');
  sw.title = env.reduced ? 'Your system has requested reduced motion' :
    on && (env.lowEnd || env.saveData) ? 'Visual FX on; demanding 3D scenes are automatically skipped on this device' :
    on ? 'Turn effects off' : 'Turn effects on';
  sw.innerHTML = `<span aria-hidden="true">✦</span><b>FX</b><em>${on ? 'ON' : 'OFF'}</em>`;
  sw.disabled = env.reduced;
  sw.addEventListener('click', () => setUserFx(!on));
  document.body.appendChild(sw);
}
