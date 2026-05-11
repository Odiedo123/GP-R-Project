import * as THREE from 'three';
import { GLTFLoader }    from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ── 1. Bootstrap ─────────────────────────────────────────── */
const container = document.getElementById('threejs-model');

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);
renderer.domElement.style.display = 'block';

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);
camera.position.set(0, 1.5, 4);
camera.lookAt(0, 0, 0); 

/* ── 2. Lighting ──────────────────────────────────────────── */
scene.add(new THREE.AmbientLight(0xffffff, 1.2));

const key = new THREE.DirectionalLight(0xffffff, 3);
key.position.set(5, 8, 5);
scene.add(key);

const fill = new THREE.DirectionalLight(0x88aaff, 1);
fill.position.set(-5, 2, -3);
scene.add(fill);

/* ── 3. Load free model (Khronos Duck.glb) ────────────────── */
// Swap the URL for any other .glb/.gltf you like
const MODEL_URL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Duck/glTF-Binary/Duck.glb';

let model = null;

new GLTFLoader().load(
  MODEL_URL,
  (gltf) => {
    model = gltf.scene;

    // Centre & scale to fit
    const box    = new THREE.Box3().setFromObject(model);
    const centre = box.getCenter(new THREE.Vector3());
    const size   = box.getSize(new THREE.Vector3()).length();
    model.position.sub(centre);
    model.scale.setScalar(2.5 / size);

    scene.add(model);
  },
  undefined,
  (err) => console.error('Model load error:', err)
);

/* ── 4. Mouse → target rotation ──────────────────────────── */
// Normalised device coords in [-1, 1]
const mouse = { x: 0, y: 0 };

window.addEventListener('mousemove', (e) => {
  mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;  // left→right : -1→1
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;  // top→bottom :  1→-1
});

// How far the model can rotate (radians)
const MAX_ROT_Y = Math.PI / 4;   // ±45° horizontal
const MAX_ROT_X = Math.PI / 8;   // ±22.5° vertical

// Lerp speed (0 = frozen, 1 = instant snap)
const LERP = 0.06;

/* ── 5. Render loop ───────────────────────────────────────── */
function animate() {
  requestAnimationFrame(animate);

  if (model) {
    // Smoothly interpolate toward target angles
    model.rotation.y += (mouse.x * MAX_ROT_Y - model.rotation.y) * LERP;
    model.rotation.x += (-mouse.y * MAX_ROT_X - model.rotation.x) * LERP;
  }

  renderer.render(scene, camera);
}
animate();

/* ── 6. Responsive resize ─────────────────────────────────── */
new ResizeObserver(() => {
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}).observe(container);