import { createStage } from './fx-gl-kit.js';
import { pointer } from './fx-env.js';

const FRAG = /* glsl */`
precision highp float;
uniform float uTime, uTone;
uniform vec2 uRes, uMouse;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){ float a = .5, s = 0.; for(int i=0;i<5;i++){ s += a*noise(p); p = p*2.02 + 7.3; a *= .5; } return s; }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (uv - .5) * vec2(uRes.x / uRes.y, 1.) * 2.2;
  float t = uTime * .06;
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.*q + vec2(1.7, 9.2) + t*1.3), fbm(p + 3.*q + vec2(8.3, 2.8) - t));
  float n = fbm(p + 3.*r);
  vec3 deep = vec3(.14, .075, .2), violet = vec3(.37, .23, .51), pink = vec3(.85, .34, .65), mint = vec3(.15, .42, .34);
  vec3 col = mix(deep, violet, smoothstep(.2, .8, n));
  col = mix(col, mix(pink, mint, uTone), smoothstep(.45, 1., r.x * r.y * 2.2) * .55);
  float d = distance(uv, uMouse);
  col += pink * smoothstep(.45, 0., d) * .22;
  col *= smoothstep(1.25, .25, length(uv - .5) * 1.4);
  gl_FragColor = vec4(col, 1.);
}
`;

/** Slow, domain-warped aurora behind a section; the pointer lights a soft pink bloom. `tone` 0 = pink, 1 = mint. */
export function initAuroraGL(THREE, host, { tone = 0 } = {}) {
  const stage = createStage(THREE, host, { className: 'fx-aurora-canvas', maxDpr: 1, antialias: false });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = { uTime: { value: 0 }, uTone: { value: tone }, uRes: { value: new THREE.Vector2(1, 1) }, uMouse: { value: new THREE.Vector2(.7, .6) } };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: FRAG, depthTest: false });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  stage.onResize(() => { const px = stage.renderer.getPixelRatio(); uniforms.uRes.value.set(stage.width * px, stage.height * px); });
  const target = new THREE.Vector2(.7, .6);
  stage.setRender((dt, time) => {
    const r = host.getBoundingClientRect();
    target.set((pointer.x - r.left) / r.width, 1 - (pointer.y - r.top) / r.height);
    uniforms.uMouse.value.lerp(target, 0.06);
    uniforms.uTime.value = time;
    stage.renderer.render(scene, camera);
  });
  stage.renderOnce();
  return { stage, dispose() { material.dispose(); stage.dispose(); } };
}
