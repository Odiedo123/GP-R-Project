import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ── 1. Bootstrap ─────────────────────────────────────────── */
const container = document.getElementById('threejs-model');

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);
renderer.domElement.style.display = 'block';

const scene = new THREE.Scene();
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

/* ── 3. Load model ────────────────────────────────────────── */
const MODEL_URL = '/static/models/the_hut.glb';

let model = null;

new GLTFLoader().load(
  MODEL_URL,
  (gltf) => {
    model = gltf.scene;

    // Centre & scale to fit
    const box = new THREE.Box3().setFromObject(model);
    const centre = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    model.position.sub(centre);
    model.scale.setScalar(4 / size);

    scene.add(model);

    const worldBox = new THREE.Box3().setFromObject(model);
    const worldCentre = worldBox.getCenter(new THREE.Vector3());
    camera.lookAt(worldCentre);
  },
  undefined,
  (err) => console.error('Model load error:', err)
);

/* ── 4. Mouse → target rotation ──────────────────────────── */
const mouse = { x: 0, y: 0 };

window.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});

const MAX_ROT_Y = Math.PI / 4;
const MAX_ROT_X = Math.PI / 8;
const LERP = 0.06;

/* ── 5. Render loop ───────────────────────────────────────── */
function animate() {
  requestAnimationFrame(animate);

  if (model) {
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


/* ── 7. Scroll animation (desktop only, ≥600px) ──────────── */

// Returns true when we are on a narrow / mobile viewport.
// Called fresh each time so rotation changes are respected.
function isMobile() {
  return window.innerWidth < 600;
}

document.addEventListener('DOMContentLoaded', () => {
  const panel4L = document.querySelector('[id="4L"]');
  const panel4R = document.querySelector('[id="4R"]');
  if (!panel4L || !panel4R) return;

  const fifthSection = panel4L.parentElement;
  const sixthSection = fifthSection.nextElementSibling;
  if (!sixthSection) return;

  // ── Layout setup (desktop only) ──────────────────────────────────────
  if (!isMobile()) {
    fifthSection.style.flexDirection = 'row';
  }

  const sixthChildren = Array.from(sixthSection.children);
  const leftPanel = document.createElement('div');
  const rightPanel = document.createElement('div');
  leftPanel.className = 'sixth-panel sixth-panel--left';
  rightPanel.className = 'sixth-panel sixth-panel--right';

  sixthChildren.forEach((el, i) =>
    (i % 2 === 0 ? leftPanel : rightPanel).appendChild(el)
  );
  sixthSection.style.alignItems = 'center';
  sixthSection.style.justifyContent = 'center'; // fixed typo: was JustifyContent
  sixthSection.appendChild(leftPanel);
  sixthSection.appendChild(rightPanel);

  // ── Scroll-lock helpers ───────────────────────────────────────────────
  let savedScrollY = 0;

  function lockScroll() {
    savedScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.width = '100%';
  }

  function unlockScroll(targetY) {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.width = '';
    window.scrollTo(0, targetY ?? savedScrollY);
  }

  // ── State ─────────────────────────────────────────────────────────────
  let triggered = false;
  let animating = false;
  const PHASE = 750;

  // ── Forward (5th → 6th) ───────────────────────────────────────────────
  function runForward() {
    if (triggered || animating) return;
    triggered = true;
    animating = true;

    lockScroll();
    panel4L.classList.add('slide-out-left');
    panel4R.classList.add('slide-out-right');

    setTimeout(() => {
      const sixthY = sixthSection.offsetTop;
      document.body.style.top = `-${sixthY}px`;
      leftPanel.classList.add('sixth-panel--entered');
      rightPanel.classList.add('sixth-panel--entered');

      setTimeout(() => {
        unlockScroll(sixthY - 100);
        animating = false;
      }, PHASE + 50);
    }, PHASE);
  }

  // ── Reverse (6th → 5th) ───────────────────────────────────────────────
  function runReverse() {
    if (!triggered || animating) return;
    animating = true;

    lockScroll();
    leftPanel.classList.remove('sixth-panel--entered');
    rightPanel.classList.remove('sixth-panel--entered');

    setTimeout(() => {
      const fifthY = fifthSection.offsetTop;
      document.body.style.top = `-${fifthY}px`;
      panel4L.classList.remove('slide-out-left');
      panel4R.classList.remove('slide-out-right');

      setTimeout(() => {
        unlockScroll(fifthY);
        animating = false;
        triggered = false;
      }, PHASE + 50);
    }, PHASE);
  }

  // ── Wheel listener — skipped entirely on mobile ───────────────────────
  window.addEventListener('wheel', (e) => {
    // Do nothing on mobile — let the browser scroll normally
    if (isMobile()) return;

    if (animating) {
      e.preventDefault();
      return;
    }

    const fifthRect = fifthSection.getBoundingClientRect();
    const sixthRect = sixthSection.getBoundingClientRect();

    const fifthInView = fifthRect.top >= -20 && fifthRect.bottom <= window.innerHeight + 20;
    const atSixthTop = sixthRect.top >= -30 && sixthRect.top <= 80;

    if (!triggered && e.deltaY > 0 && fifthInView) {
      e.preventDefault();
      runForward();
    } else if (triggered && e.deltaY < 0 && atSixthTop) {
      e.preventDefault();
      runReverse();
    }
  }, { passive: false });

  // ── Touch listener — skipped entirely on mobile ───────────────────────
  let touchStartY = 0;

  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    // Do nothing on mobile — let the browser scroll normally
    if (isMobile()) return;

    if (animating) { e.preventDefault(); return; }

    const deltaY = touchStartY - e.touches[0].clientY;
    const fifthRect = fifthSection.getBoundingClientRect();
    const sixthRect = sixthSection.getBoundingClientRect();

    const fifthInView = fifthRect.top >= -20 && fifthRect.bottom <= window.innerHeight + 20;
    const atSixthTop = sixthRect.top >= -30 && sixthRect.top <= 80;

    if (!triggered && deltaY > 30 && fifthInView) {
      e.preventDefault();
      runForward();
    } else if (triggered && deltaY < -30 && atSixthTop) {
      e.preventDefault();
      runReverse();
    }
  }, { passive: false });

  // ── Reset layout flag on resize in case orientation changes ──────────
  window.addEventListener('resize', () => {
    if (!isMobile()) {
      fifthSection.style.flexDirection = 'row';
    } else {
      fifthSection.style.flexDirection = '';
      // If we were mid-animation on mobile (e.g. rotate during lock), clean up
      if (animating || triggered) {
        unlockScroll(savedScrollY);
        animating = false;
        triggered = false;
      }
    }
  });
});


/* ── 8. Custom cursor ─────────────────────────────────────── */
const cursorDot = document.querySelector('.custom-dot-cursor');

window.addEventListener('mousemove', (e) => {
  cursorDot.style.left = e.clientX + 'px';
  cursorDot.style.top = e.clientY + 'px';
});

/* ── 9. FAQ accordion ─────────────────────────────────────── */
document.querySelectorAll('.faq-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const body = item.querySelector('.faq-body');
    const isOpen = item.classList.contains('open');

    // close all
    document.querySelectorAll('.faq-item.open').forEach(x => {
      x.classList.remove('open');
      x.querySelector('.faq-body').style.maxHeight = '0';
    });

    if (!isOpen) {
      item.classList.add('open');
      body.style.maxHeight = body.scrollHeight + 'px';
    }
  });
});