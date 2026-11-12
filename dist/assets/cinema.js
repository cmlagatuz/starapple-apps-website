/** Autoplay is decorative; motion control is always available and accessible. */
import { env } from './fx-env.js';
const film = document.getElementById('hero-film');
const control = document.getElementById('hero-film-toggle');
const label = document.getElementById('hero-film-toggle-label');
const icon = document.getElementById('hero-film-toggle-icon');
if (film && control && label && icon) {
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = Boolean(navigator.connection?.saveData);
  let motionEnabled = !media.matches && !saveData && !env.lowEnd;
  let inViewport = true;
  let requestId = 0;
  function setControl(playing) {
    label.textContent = playing ? 'PAUSE FILM' : 'PLAY FILM';
    icon.textContent = playing ? 'Ⅱ' : '▶';
    control.setAttribute('aria-label', playing ? 'Pause hero background video' : 'Play hero background video');
    control.setAttribute('aria-pressed', String(playing));
  }
  async function sync() {
    const id = ++requestId;
    const shouldPlay = motionEnabled && inViewport && !document.hidden;
    if (!shouldPlay) {
      film.pause();
      setControl(false);
      return;
    }
    try {
      film.preload = 'metadata';
      await film.play();
      if (id !== requestId || !motionEnabled || !inViewport || document.hidden) {
        film.pause();
        setControl(false);
      } else setControl(true);
    } catch {
      setControl(false); // mobile power/data-saving policy may block autoplay
    }
  }
  control.addEventListener('click', () => { motionEnabled = !motionEnabled; sync(); });
  media.addEventListener?.('change', event => { if (event.matches) motionEnabled = false; sync(); });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      inViewport = entries[0]?.isIntersecting ?? true;
      sync();
    }, { threshold: 0.08 });
    observer.observe(document.getElementById('hero'));
  }
  film.addEventListener('error', () => { motionEnabled = false; control.hidden = true; });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => film.pause());
  setControl(false);
  sync();
}