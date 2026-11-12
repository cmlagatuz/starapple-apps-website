import { splitWords } from './fx-text.js';
import { fxState, env } from './fx-env.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/**
 * Scroll-driven choreography. Everything is created inside gsap.matchMedia so it is torn down automatically when the
 * viewport or the reduced-motion preference changes. Native scroll (and the CSS snap points) stay in charge.
 */
export function initScroll({ gsap, ScrollTrigger }) {
  const mm = gsap.matchMedia();
  const stmtWords = splitWords($('.statement p'));
  const closing = splitWords($('.footer-closing h2'));
  const founderTitle = splitWords($('#founders-title'));
  const contactTitle = splitWords($('#contact-title'));
  const labTitle = splitWords($('#lab-title'));

  const root = document.documentElement;
  root.classList.add('fx-on');

  /* ---------- opening sequence (not scroll-bound, runs for everyone who allows motion) ---------- */
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.15 });
    tl.from('.hero-topline > *', { y: -16, autoAlpha: 0, duration: 0.9, stagger: 0.12 }, 0)
      .from('.hero-eyebrow', { y: 20, autoAlpha: 0, duration: 0.9 }, 0.15)
      .from('.hero h1', { y: 24, duration: 1.0, clearProps: 'transform' }, 0.25)
      .from('.hero-description', { y: 24, autoAlpha: 0, duration: 1 }, 0.75)
      .from('.hero-actions > *', { y: 22, autoAlpha: 0, duration: 0.9, stagger: 0.1 }, 0.9)
      .from('.hero-bottom > *', { y: 14, autoAlpha: 0, duration: 0.8, stagger: 0.1 }, 1.1)
      .from('.site-header .nav-container > *', { y: -22, autoAlpha: 0, duration: 0.9, stagger: 0.07 }, 0.1);
    return () => tl.kill();
  });

  /* ---------- desktop / tablet ---------- */
  mm.add('(min-width: 801px) and (prefers-reduced-motion: no-preference)', () => {
    // Hero: the film drifts slower than the page, copy lifts away, WebGL star disperses.
    const heroTL = gsap.timeline({
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: 0.6, onUpdate: s => { fxState.heroProgress = s.progress; } }
    });
    heroTL.to('.hero-cinema video', { yPercent: 10, scale: 1.08, ease: 'none' }, 0)
      .to('.hero-copy', { yPercent: -14, autoAlpha: 0.1, ease: 'none' }, 0)
      .to('.hero-grid-bg', { yPercent: 18, ease: 'none' }, 0);

    // Lab: the console tilts up into place and its tabs fan in.
    gsap.from(labTitle, { yPercent: 110, duration: 1, stagger: 0.05, ease: 'expo.out', scrollTrigger: { trigger: '#lab', start: 'top 70%', once: true } });
    gsap.from('.lab-intro p, .lab-intro .eyebrow', { y: 24, autoAlpha: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '#lab', start: 'top 70%', once: true } });
    gsap.fromTo('.lab-shell', { rotateX: 9, scale: 0.94, y: 60, transformPerspective: 1400, transformOrigin: '50% 100%' },
      { rotateX: 0, scale: 1, y: 0, ease: 'none', scrollTrigger: { trigger: '#lab', start: 'top 85%', end: 'top 20%', scrub: 0.5 } });
    gsap.from('.lab-tab', { y: 18, autoAlpha: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: '.lab-tabs', start: 'top 90%', once: true } });

    // Services: cards swing up in 3D; their visuals drift at a different speed.
    gsap.set('.services-grid', { perspective: 1400 });
    gsap.from('.services .section-heading > *', { y: 36, autoAlpha: 0, duration: 1, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '#services', start: 'top 75%', once: true } });
    gsap.from('.service-card', { y: 110, rotateX: -14, autoAlpha: 0, duration: 1.1, stagger: 0.12, ease: 'expo.out', transformOrigin: '50% 100%', clearProps: 'transform,opacity,visibility', onComplete: () => $$('.service-card').forEach(c => c.classList.add('fx-settled')), scrollTrigger: { trigger: '.services-grid', start: 'top 82%', once: true } });
    $$('.service-card').forEach((card, i) => gsap.to($('.service-visual', card), { yPercent: i % 2 ? -8 : 8, ease: 'none', scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 0.8 } }));

    // Philosophy statement: words light up as the section crosses the viewport.
    gsap.set(stmtWords, { opacity: 0.14 });
    gsap.to(stmtWords, { opacity: 1, stagger: 0.12, ease: 'none', scrollTrigger: { trigger: '.statement', start: 'top 70%', end: 'center 35%', scrub: 0.4 } });
    gsap.from('.statement-spark', { rotate: -180, scale: 0.2, autoAlpha: 0, duration: 1.2, ease: 'back.out(1.6)', scrollTrigger: { trigger: '.statement', start: 'top 70%', once: true } });

    // Story: progress turns the 3D apple; copy staggers in.
    ScrollTrigger.create({ trigger: '#story', start: 'top bottom', end: 'bottom top', onUpdate: s => { fxState.storyProgress = s.progress; } });
    gsap.from('.story-content > *', { y: 40, autoAlpha: 0, duration: 1, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '#story', start: 'top 65%', once: true } });
    gsap.from('.story-pillars > div', { y: 24, autoAlpha: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '.story-pillars', start: 'top 92%', once: true } });

    // Founders: portrait masks open, bios follow.
    gsap.from(founderTitle, { yPercent: 110, duration: 1, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: '#founders', start: 'top 70%', once: true } });
    $$('.founder-profile').forEach(card => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'top 82%', once: true }, defaults: { ease: 'expo.out' } });
      tl.from($('.founder-profile-image', card), { clipPath: 'inset(0 0 100% 0 round 18px)', duration: 1.2 }, 0)
        .from($('.founder-profile-image img', card) || $('.founder-profile-image', card), { scale: 1.25, duration: 1.6 }, 0)
        .from(card.querySelectorAll('.founder-profile-details > *, .founder-profile-bio > *'), { y: 26, autoAlpha: 0, duration: 0.9, stagger: 0.07 }, 0.35);
    });

    // Contact + footer.
    gsap.from(contactTitle, { yPercent: 110, duration: 1.1, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: '#contact', start: 'top 70%', once: true } });
    gsap.from('.contact-heading > *:not(h2), .contact-choice', { y: 40, autoAlpha: 0, duration: 1, stagger: 0.12, ease: 'power3.out', scrollTrigger: { trigger: '#contact', start: 'top 60%', once: true } });
    gsap.from(closing, { yPercent: 110, duration: 1.1, stagger: 0.06, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 65%', once: true } });
    gsap.from('.footer-top > *, .footer-bottom', { y: 30, autoAlpha: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.footer-top', start: 'top 95%', once: true } });
  });

  /* ---------- phones: lighter, no 3D tilts ---------- */
  mm.add('(max-width: 800px) and (prefers-reduced-motion: no-preference)', () => {
    ScrollTrigger.create({ trigger: '#hero', start: 'top top', end: 'bottom top', onUpdate: s => { fxState.heroProgress = s.progress; } });
    ScrollTrigger.create({ trigger: '#story', start: 'top bottom', end: 'bottom top', onUpdate: s => { fxState.storyProgress = s.progress; } });
    gsap.set(stmtWords, { opacity: 0.2 });
    gsap.to(stmtWords, { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '.statement', start: 'top 80%', end: 'center 45%', scrub: 0.3 } });
    for (const sel of ['.lab-intro > *', '.services .section-heading > *', '.service-card', '.story-content > *', '.founder-profile', '.contact-heading > *', '.contact-choice', '.footer-closing > *']) {
      $$(sel).forEach(el => gsap.from(el, { y: 36, autoAlpha: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }));
    }
  });

  /* ---------- reduced motion: everything simply visible ---------- */
  mm.add('(prefers-reduced-motion: reduce)', () => {
    gsap.set([...heroWords, ...stmtWords, ...closing, ...founderTitle, ...contactTitle, ...labTitle], { clearProps: 'all' });
  });

  root.classList.remove('fx-pending');
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
  return { mm, env };
}
