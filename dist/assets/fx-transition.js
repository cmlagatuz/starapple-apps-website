import { env } from './fx-env.js';

/** Provide stable fragment targets for every section, including Philosophy and footer. */
export function ensureSectionIds() {
  const statement = document.querySelector('.statement');
  if (statement && !statement.id) statement.id = 'philosophy';
  const footer = document.querySelector('footer.footer');
  if (footer && !footer.id) footer.id = 'footer';
}

/** The keyboard section rail uses ordinary scrolling; links use native fragment navigation. */
export function goTo(target) {
  if (!target) return;
  const hash = target.id ? `#${target.id}` : '';
  if (hash && location.hash !== hash) history.pushState(null, '', hash);
  target.scrollIntoView({ behavior: env.reduced ? 'auto' : 'smooth', block: 'start' });
  target.dispatchEvent(new CustomEvent('fx:section-enter', { bubbles: true }));
}
