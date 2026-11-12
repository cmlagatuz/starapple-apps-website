import { createStage } from './fx-gl-kit.js';
import { env, pointer, fxState } from './fx-env.js';
import { starVertices, sampleOutline, lerp, clamp } from './fx-math.js';

const VERT = /* glsl */`
uniform float uTime, uForm, uDisperse, uPulse, uPx, uScale;
uniform vec2 uMouse;
uniform vec3 uOffset;
attribute vec3 aScatter;
attribute vec3 aTarget;
attribute vec4 aSeed; // x stagger, y size, z phase, w colour pick
varying vec3 vCol;
varying float vA;
float clamp01(float v){ return clamp(v, 0., 1.); }
void main(){
  float t = uTime;
  float f = smoothstep(aSeed.x * .5, aSeed.x * .5 + .5, uForm);
  vec3 target = aTarget * uScale + uOffset;
  vec3 p = mix(aScatter, target, f);
  float calm = mix(.09, .022, f);
  p += vec3(sin(t*.55 + aSeed.z*6.283), cos(t*.47 + aSeed.z*9.1), sin(t*.39 + aSeed.z*3.7)) * calm;
  // formed star slowly breathes
  p.xy += (p.xy - uOffset.xy) * (sin(t*.9 + aSeed.z*2.0) * .012 + uPulse * .06) * f;
  p += normalize(aScatter + vec3(.0001)) * uDisperse * 3.2;
  // pointer repulsion in the z=0 plane
  vec2 d = p.xy - uMouse;
  float r = length(d);
  float push = smoothstep(1.25, 0., r);
  p.xy += normalize(d + vec2(1e-4)) * push * .55;
  p.z  += push * .45;
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aSeed.y * uPx * (7.0 / -mv.z) * (1. + uPulse * .7 + push * .6);
  vec3 pink = vec3(.851,.341,.655), lilac = vec3(.898,.824,.988), mint = vec3(.545,.769,.631), gold = vec3(.973,.886,.722);
  vCol = aSeed.w < .5 ? mix(lilac, pink, aSeed.w * 2.) : (aSeed.w < .86 ? mix(pink, lilac, (aSeed.w-.5)*2.7) : mix(mint, gold, (aSeed.w-.86)*7.));
  vA = (.3 + .7 * clamp01(aSeed.y / 6.)) * (1. - uDisperse * .95) * (.55 + .45 * f);
}
`;

const FRAG = /* glsl */`
precision mediump float;
varying vec3 vCol;
varying float vA;
void main(){
  vec2 c = gl_PointCoord - .5;
  float d = length(c);
  float a = pow(smoothstep(.5, 0., d), 1.7) * vA;
  if (a < .012) discard;
  gl_FragColor = vec4(vCol * (1. + a * .5), a);
}
`;

/** Particles drift as a nebula, then assemble into the StarApple five-point star; the pointer parts them. */
export function initHeroGL(THREE, hero) {
  const stage = createStage(THREE, hero, { className: 'fx-hero-canvas', maxDpr: 1.6 });
  const { renderer } = stage;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
  camera.position.z = 6;

  const COUNT = env.coarse ? 2400 : 6200;
  const outer = starVertices(1, 0.4);
  const inner = starVertices(0.5, 0.2, 5, Math.PI / 2 + Math.PI / 5);
  const scatter = new Float32Array(COUNT * 3), target = new Float32Array(COUNT * 3), seed = new Float32Array(COUNT * 4);
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
  for (let i = 0; i < COUNT; i++) {
    const roll = i / COUNT;
    let tx, ty;
    if (roll < 0.52) [tx, ty] = sampleOutline(outer);
    else if (roll < 0.74) [tx, ty] = sampleOutline(inner);
    else { tx = gauss() * 0.22; ty = gauss() * 0.22; }
    const jitter = roll < 0.74 ? 0.018 : 0;
    target.set([tx + gauss() * jitter, ty + gauss() * jitter, gauss() * 0.07], i * 3);
    const ang = Math.random() * Math.PI * 2, rad = 1.2 + Math.pow(Math.random(), 0.6) * 4.6;
    scatter.set([Math.cos(ang) * rad * 1.35, Math.sin(ang) * rad * 0.75, (Math.random() - 0.5) * 4.5], i * 3);
    seed.set([Math.random(), 1.6 + Math.pow(Math.random(), 2.2) * 5.2, Math.random(), Math.random()], i * 4);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
  geo.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3));
  geo.setAttribute('aTarget', new THREE.BufferAttribute(target, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const uniforms = {
    uTime: { value: 0 }, uForm: { value: 0 }, uDisperse: { value: 0 }, uPulse: { value: 0 },
    uPx: { value: renderer.getPixelRatio() }, uScale: { value: 1.6 },
    uMouse: { value: new THREE.Vector2(9, 9) }, uOffset: { value: new THREE.Vector3(1.9, 0, 0) }
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  let halfW = 3, halfH = 2.5;
  stage.onResize((w, h) => {
    camera.aspect = w / h; camera.updateProjectionMatrix();
    halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z; halfW = halfH * camera.aspect;
    uniforms.uPx.value = renderer.getPixelRatio();
    const wide = camera.aspect > 1.15;
    uniforms.uScale.value = wide ? Math.min(halfH * 0.74, halfW * 0.34) : Math.min(halfW * 0.78, halfH * 0.36);
    uniforms.uOffset.value.set(wide ? halfW * 0.5 : 0, wide ? 0.05 : halfH * 0.38, 0);
  });

  const mouse = new THREE.Vector2(9, 9);
  let form = env.reduced ? 1 : 0, sx = 0, sy = 0;
  stage.setRender((dt, time) => {
    form = Math.min(1, form + dt / 3.2);
    const eased = 1 - Math.pow(1 - form, 3);
    uniforms.uTime.value = time;
    uniforms.uForm.value = eased;
    uniforms.uDisperse.value = lerp(uniforms.uDisperse.value, clamp(fxState.heroProgress * 1.15), 0.12);
    fxState.pulse = Math.max(0, fxState.pulse - dt * 1.6);
    uniforms.uPulse.value = fxState.pulse;
    const r = hero.getBoundingClientRect();
    const inside = pointer.moved && pointer.y >= r.top && pointer.y <= r.bottom;
    const tx = inside ? ((pointer.x - r.left) / r.width * 2 - 1) * halfW : 9;
    const ty = inside ? -((pointer.y - r.top) / r.height * 2 - 1) * halfH : 9;
    mouse.x = inside && mouse.x < 8 ? lerp(mouse.x, tx, 0.18) : tx;
    mouse.y = inside && mouse.y < 8 ? lerp(mouse.y, ty, 0.18) : ty;
    uniforms.uMouse.value.copy(mouse);
    sx = lerp(sx, pointer.nx * 0.28, 0.05); sy = lerp(sy, pointer.ny * 0.18, 0.05);
    camera.position.x = sx; camera.position.y = sy; camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  });
  stage.renderOnce();
  const pulse = () => { fxState.pulse = 1; };
  hero.addEventListener('fx:pulse', pulse);
  return { stage, dispose() { hero.removeEventListener('fx:pulse', pulse); geo.dispose(); mat.dispose(); stage.dispose(); } };
}
