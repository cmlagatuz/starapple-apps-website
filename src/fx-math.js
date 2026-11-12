/** Pure helpers shared by the FX modules (kept DOM-free so they can be unit-tested in Node). */
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

/** 0xRRGGBB -> [r, g, b] in 0..1 (sRGB values, for raw shader colours). */
export function rgb(hex) { return [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255]; }

/** Vertices of an n-point star, alternating outer / inner radius, first tip pointing up. */
export function starVertices(outer, inner, points = 5, rotation = Math.PI / 2) {
  const out = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = rotation + (i * Math.PI) / points;
    out.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return out;
}

/** Random point along the closed polyline described by `verts`. */
export function sampleOutline(verts, rand = Math.random) {
  const k = Math.floor(rand() * verts.length);
  const a = verts[k], b = verts[(k + 1) % verts.length];
  const t = rand();
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Polygon string for a five-point star of outer radius `R` centred on (cx, cy), rotated by `rot` radians. */
export function starClip(cx, cy, R, rot = 0) {
  return 'polygon(' + starVertices(R, R * 0.42, 5, Math.PI / 2 + rot).map(([x, y]) => `${(cx + x).toFixed(1)}px ${(cy - y).toFixed(1)}px`).join(',') + ')';
}

