/** The cinema attempts muted autoplay on every fresh visit, independently from FX capability.
 * A user pause is honored. Browser autoplay/codec/network restrictions may prevent playback. */
const film = document.getElementById('hero-film');
const control = document.getElementById('hero-film-toggle');
const label = document.getElementById('hero-film-toggle-label');
const icon = document.getElementById('hero-film-toggle-icon');

if (film && control && label && icon) {
  let userPaused = false;
  let inViewport = true;
  let requestId = 0;

  film.muted = true;
  film.defaultMuted = true;
  film.playsInline = true;
  film.preload = 'auto';

  function setControl(playing) {
    label.textContent = playing ? 'PAUSE FILM' : 'PLAY FILM';
    icon.textContent = playing ? 'Ⅱ' : '▶';
    control.setAttribute('aria-label', playing ? 'Pause hero background video' : 'Play hero background video');
    control.setAttribute('aria-pressed', String(playing));
  }

  async function sync() {
    const id = ++requestId;
    if (userPaused || !inViewport || document.hidden) {
      film.pause();
      setControl(false);
      return;
    }
    try {
      await film.play();
      if (id !== requestId || userPaused || !inViewport || document.hidden) {
        if (id === requestId) { film.pause(); setControl(false); }
      } else {
        setControl(true);
      }
    } catch {
      // Keep the manual Play button available: autoplay or remote media may be blocked.
      if (id === requestId) setControl(false);
    }
  }

  control.addEventListener('click', () => {
    userPaused = !film.paused;
    sync();
  });
  film.addEventListener('playing', () => setControl(true));
  film.addEventListener('pause', () => setControl(false));
  film.addEventListener('error', () => setControl(false));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      inViewport = entries[0]?.isIntersecting ?? true;
      sync();
    }, { threshold: 0.08 });
    observer.observe(document.getElementById('hero'));
  }
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pageshow', sync);
  window.addEventListener('pagehide', () => film.pause());
  setControl(false);
  sync();
}
