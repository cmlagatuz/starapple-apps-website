import { createStage } from './fx-gl-kit.js';
import { env, pointer, fxState } from './fx-env.js';
import { starVertices, lerp } from './fx-math.js';

/** Paints the cut face of the caimito: pale flesh, five seed chambers, soft rings. */
function crossSectionTexture(THREE) {
  const S = 768, c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d'), m = S / 2;
  const flesh = g.createRadialGradient(m * 0.8, m * 0.75, 10, m, m, m);
  flesh.addColorStop(0, '#f6dff3'); flesh.addColorStop(0.62, '#d4b0da'); flesh.addColorStop(1, '#a77dbb');
  g.fillStyle = flesh; g.beginPath(); g.arc(m, m, m, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 3;
  for (const r of [0.93, 0.8]) { g.beginPath(); g.arc(m, m, m * r, 0, Math.PI * 2); g.stroke(); }
  for (let i = 0; i < 5; i++) {
    g.save(); g.translate(m, m); g.rotate((i * Math.PI * 2) / 5);
    const chamber = g.createLinearGradient(0, 0, 0, -m * 0.7);
    chamber.addColorStop(0, '#f3dbe6'); chamber.addColorStop(1, '#fff4e8');
    g.fillStyle = chamber; g.beginPath();
    g.moveTo(0, -m * 0.06); g.bezierCurveTo(-m * 0.2, -m * 0.3, -m * 0.2, -m * 0.55, 0, -m * 0.7);
    g.bezierCurveTo(m * 0.2, -m * 0.55, m * 0.2, -m * 0.3, 0, -m * 0.06); g.fill();
    g.fillStyle = '#7d3c7c'; g.beginPath(); g.ellipse(-m * 0.01, -m * 0.5, m * 0.045, m * 0.085, -0.14, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(-m * 0.025, -m * 0.53, m * 0.014, m * 0.035, -0.14, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}

/** An interactive, draggable 3D star apple (cut open) with a glowing extruded star core and drifting sparks. */
export function initStoryGL(THREE, host) {
  const stage = createStage(THREE, host, { className: 'fx-story-canvas', maxDpr: 1.75 });
  const { renderer, canvas } = stage;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
  camera.position.set(0, 0, 6.4);

  const apple = new THREE.Group();
  const R = 1.35;
  const dome = new THREE.SphereGeometry(R, 72, 48, 0, Math.PI * 2, 0, Math.PI / 2);
  dome.rotateX(-Math.PI / 2); // open face points at the camera, dome sits behind it
  const rind = new THREE.Mesh(dome, new THREE.MeshPhysicalMaterial({ color: 0x4a2a62, roughness: 0.38, metalness: 0.05, clearcoat: 0.9, clearcoatRoughness: 0.35, sheen: 1, sheenColor: new THREE.Color(0xd957a7) }));
  const pulp = new THREE.Mesh(dome, new THREE.MeshStandardMaterial({ color: 0xc9a2d6, roughness: 0.7, side: THREE.BackSide }));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R * 0.985, 0.028, 16, 120), new THREE.MeshStandardMaterial({ color: 0xedb2d9, roughness: 0.4, emissive: 0x6d2a63, emissiveIntensity: 0.5 }));
  const section = crossSectionTexture(THREE);
  const cap = new THREE.Mesh(new THREE.CircleGeometry(R * 0.985, 96), new THREE.MeshBasicMaterial({ map: section, toneMapped: false }));
  cap.position.z = 0.002;
  apple.add(rind, pulp, cap, rim);

  const shape = new THREE.Shape(starVertices(0.5, 0.2).map(([x, y]) => new THREE.Vector2(x, y)));
  const starGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.035, bevelSegments: 4 });
  starGeo.translate(0, 0, -0.06);
  const star = new THREE.Mesh(starGeo, new THREE.MeshStandardMaterial({ color: 0xfff4d8, emissive: 0xffd9a6, emissiveIntensity: 1.1, roughness: 0.3 }));
  star.position.z = 0.2;
  apple.add(star);
  const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 128;
  const gg = glowCanvas.getContext('2d'), grad = gg.createRadialGradient(64, 64, 2, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,240,205,.95)'); grad.addColorStop(0.35, 'rgba(255,190,225,.4)'); grad.addColorStop(1, 'rgba(255,190,225,0)');
  gg.fillStyle = grad; gg.fillRect(0, 0, 128, 128);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowCanvas), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  glow.scale.setScalar(2.1); glow.position.z = 0.25;
  apple.add(glow);
  scene.add(apple);

  const rings = [0, 1].map(i => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.05 + i * 0.4, 0.006, 8, 220), new THREE.MeshBasicMaterial({ color: i ? 0x8bc4a1 : 0xe67bbd, transparent: true, opacity: 0.55 - i * 0.2 }));
    ring.rotation.set(1.1 + i * 0.5, 0.3, i * 0.9);
    scene.add(ring); return ring;
  });
  const SPARKS = env.coarse ? 70 : 150, sp = new Float32Array(SPARKS * 3), spSeed = new Float32Array(SPARKS * 3);
  for (let i = 0; i < SPARKS; i++) {
    const a = Math.random() * Math.PI * 2, r = 1.7 + Math.random() * 1.5;
    spSeed.set([a, r, (Math.random() - 0.5) * 2.4], i * 3);
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xf4c5e8, size: 0.035, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending }));
  sparks.frustumCulled = false;
  scene.add(sparks);

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const key = new THREE.DirectionalLight(0xffe0f3, 2.4); key.position.set(3, 3, 5); scene.add(key);
  const fill = new THREE.PointLight(0x8b5bd6, 18, 14); fill.position.set(-3.5, -1.5, 2); scene.add(fill);
  const back = new THREE.PointLight(0xe67bbd, 14, 14); back.position.set(2.5, -2.5, -2); scene.add(back);

  stage.onResize((w, h) => {
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const fit = Math.min(1, camera.aspect * 1.05);
    camera.position.z = 6.4 / fit;
  });

  // Drag-to-spin with inertia (vertical swipes still scroll the page on touch screens).
  let dragging = false, lastX = 0, lastY = 0, velY = 0, velX = 0, spinY = 0, spinX = 0;
  canvas.classList.add('is-draggable');
  canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); canvas.classList.add('is-dragging'); });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    velY = (e.clientX - lastX) * 0.012; velX = (e.clientY - lastY) * 0.008;
    spinY += velY; spinX = Math.max(-0.8, Math.min(0.8, spinX + velX)); lastX = e.clientX; lastY = e.clientY;
  });
  const release = () => { dragging = false; canvas.classList.remove('is-dragging'); };
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('dblclick', () => { velY = 0.28; });
  canvas.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') velY = -0.2; if (e.key === 'ArrowRight') velY = 0.2; });
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Interactive 3D star apple cut open to reveal a star-shaped core. Drag or use the arrow keys to turn it.');
  canvas.removeAttribute('aria-hidden');

  stage.setRender((dt, time) => {
    if (!dragging) { spinY += velY; velY *= 0.94; spinX = lerp(spinX, 0, 0.03); }
    const scroll = fxState.storyProgress;
    const hover = host.matches(':hover') ? 1 : 0;
    const targetY = Math.sin(time * 0.5) * 0.12 + (pointer.nx * 0.42 * hover) + (scroll - 0.5) * 0.9 + spinY;
    const targetX = Math.cos(time * 0.4) * 0.06 - pointer.ny * 0.26 * hover + spinX;
    apple.rotation.y = lerp(apple.rotation.y, targetY, 0.07);
    apple.rotation.x = lerp(apple.rotation.x, targetX, 0.07);
    apple.position.y = Math.sin(time * 0.8) * 0.06;
    star.rotation.z = time * 0.35; glow.material.opacity = 0.75 + Math.sin(time * 1.6) * 0.2;
    glow.scale.setScalar(2.0 + Math.sin(time * 1.6) * 0.12);
    rings[0].rotation.z += dt * 0.12; rings[1].rotation.z -= dt * 0.09;
    for (let i = 0; i < SPARKS; i++) {
      const a = spSeed[i * 3] + time * (0.1 + (i % 5) * 0.03), r = spSeed[i * 3 + 1];
      sp[i * 3] = Math.cos(a) * r; sp[i * 3 + 1] = spSeed[i * 3 + 2] + Math.sin(time * 0.6 + i) * 0.08; sp[i * 3 + 2] = Math.sin(a) * r * 0.55;
    }
    sparkGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  });
  stage.renderOnce();
  return { stage, dispose() { section.dispose(); stage.dispose(); } };
}
