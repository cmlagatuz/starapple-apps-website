/** A five-chamber, star-shaped cross-section inspired by the Philippine caimito. */
export function fruitSVG(id = 'fruit', compact = false) {
  const petals = Array.from({ length: 5 }, (_, i) => `
    <g transform="rotate(${i * 72} 110 110)">
      <path d="M110 111 C89 84 90 55 110 37 C130 55 131 84 110 111Z" fill="#fff5e9" opacity=".84" />
      <path d="M110 101 C97 79 102 61 110 52 C119 66 123 83 110 101Z" fill="#f5dfe7" opacity=".83" />
      <ellipse cx="110" cy="67" rx="7" ry="12" fill="#7d3c7c" transform="rotate(-8 110 67)" />
      <ellipse cx="108" cy="64" rx="2" ry="5" fill="#d8abc5" opacity=".85" />
    </g>`).join('');
  return `<svg class="fruit-svg ${compact ? 'fruit-compact' : ''}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220" role="img" aria-label="Star apple fruit with five star-shaped seed chambers">
    <defs>
      <radialGradient id="${id}-outer" cx="33%" cy="27%"><stop stop-color="#9a64ac"/><stop offset=".55" stop-color="#5d3477"/><stop offset="1" stop-color="#2a183d"/></radialGradient>
      <radialGradient id="${id}-flesh" cx="37%" cy="30%"><stop stop-color="#f0d3ef"/><stop offset=".65" stop-color="#cda9d5"/><stop offset="1" stop-color="#a77dbb"/></radialGradient>
      <radialGradient id="${id}-core" cx="40%" cy="30%"><stop stop-color="#fffbea"/><stop offset="1" stop-color="#ffdfb0"/></radialGradient>
      <filter id="${id}-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6" /></filter>
    </defs>
    <circle class="fruit-rind" cx="110" cy="110" r="103" fill="url(#${id}-outer)" stroke="#df91cd" stroke-width="2"/>
    <circle cx="110" cy="110" r="93" fill="none" stroke="#edb2d9" stroke-width="2.8" opacity=".65" />
    <circle class="fruit-cut" cx="110" cy="110" r="86" fill="url(#${id}-flesh)" stroke="#f1c6e4" stroke-width="2"/>
    <circle cx="110" cy="110" r="77" fill="none" stroke="#fbecf5" stroke-width="1.5" opacity=".55" />
    <g class="fruit-chambers">${petals}</g>
    <path class="core-star-glow" d="M110 68 L121 95 L149 96 L127 113 L134 140 L110 125 L86 140 L93 113 L71 96 L99 95 Z" fill="#fff7d5" opacity=".65" filter="url(#${id}-glow)" />
    <path class="core-star" d="M110 72 L120 98 L147 99 L126 115 L133 141 L110 126 L87 141 L94 115 L73 99 L100 98 Z" fill="url(#${id}-core)" stroke="#fff7e9" stroke-width="1.5"/>
    <circle cx="110" cy="111" r="9" fill="#e69ec8" opacity=".76" />
    <circle cx="110" cy="111" r="4.3" fill="#a15399" />
    <path d="M43 81 C52 50 82 30 112 25" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".34" />
    <path d="M179 152 C165 180 133 193 104 195" fill="none" stroke="#f8b9e7" stroke-width="2" stroke-linecap="round" opacity=".3" />
  </svg>`;
}
export function fillBrandMarks() {
  const nodes = [['nav-brand-mark', true], ['footer-brand-mark', true], ['hero-fruit', false], ['story-fruit', false]];
  for (const [id, compact] of nodes) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = fruitSVG(id, compact);
  }
}
