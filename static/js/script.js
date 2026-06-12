import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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
const MODEL_URL = '/static/models/continents.glb';

let model = null;

new GLTFLoader().load(
  MODEL_URL,
  (gltf) => {
    model = gltf.scene;

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

function isMobile() {
  return window.innerWidth < 600;
}

// ── Class-based scroll lock / unlock ────────────────────────────────────
//
//  lockScroll(targetSection)
//    • Saves the current scrollY
//    • Calculates the offset that centres `targetSection` in the viewport
//    • Applies that offset via --scroll-lock-offset on <html>
//    • Adds  .scroll-locked  to <body>  (position:fixed, width:100%)
//    • Removes .scroll-unlocked if present
//
//  unlockScroll(targetY)
//    • Removes .scroll-locked, adds .scroll-unlocked  (lets CSS play an
//      "unlock" transition if you want one)
//    • Restores window scroll position to targetY (or savedScrollY)
//    • Strips the transition class after one animation frame so it doesn't
//      interfere with future locks

let savedScrollY = 0;

function lockScroll(targetSection) {
  savedScrollY = window.scrollY;

  // Centre the target section in the viewport
  let offset = savedScrollY;
  if (targetSection) {
    const rect = targetSection.getBoundingClientRect();
    const sectionMid = savedScrollY + rect.top + rect.height / 2;
    offset = Math.round(sectionMid - window.innerHeight / 2);
    offset = Math.max(0, offset);              // never scroll above top
  }

  document.documentElement.style.setProperty('--scroll-lock-offset', `-${offset}px`);
  document.body.classList.remove('scroll-unlocked');
  document.body.classList.add('scroll-locked');
}

function unlockScroll(targetY) {
  document.body.classList.remove('scroll-locked');
  document.body.classList.add('scroll-unlocked');
  document.documentElement.style.removeProperty('--scroll-lock-offset');

  window.scrollTo(0, targetY ?? savedScrollY);

  // Remove the transient class after one frame so it doesn't block future locks
  requestAnimationFrame(() => {
    document.body.classList.remove('scroll-unlocked');
  });
}


document.addEventListener('DOMContentLoaded', () => {
  const panel4L = document.querySelector('[id="4L"]');
  const panel4R = document.querySelector('[id="4R"]');
  if (!panel4L || !panel4R) return;

  const fifthSection  = panel4L.parentElement;
  const sixthSection  = fifthSection.nextElementSibling;
  if (!sixthSection) return;

  // ── Layout setup (desktop only) ──────────────────────────────────────
  if (!isMobile()) {
    fifthSection.style.flexDirection = 'row';
  }

  // ── Build sixth-section two-panel layout ─────────────────────────────
  const sixthChildren = Array.from(sixthSection.children);
  const leftPanel  = document.createElement('div');
  const rightPanel = document.createElement('div');
  leftPanel.className  = 'sixth-panel sixth-panel--left';
  rightPanel.className = 'sixth-panel sixth-panel--right';

  sixthChildren.forEach((el, i) =>
    (i % 2 === 0 ? leftPanel : rightPanel).appendChild(el)
  );
  sixthSection.style.alignItems    = 'center';
  sixthSection.style.justifyContent = 'center';
  sixthSection.appendChild(leftPanel);
  sixthSection.appendChild(rightPanel);

  // ── State ─────────────────────────────────────────────────────────────
  let triggered = false;
  let animating  = false;
  const PHASE    = 750;   // ms — must match CSS transition duration

  // ── Forward: 5th section slides out → 6th section slides in ──────────
  function runForward() {
    if (triggered || animating) return;
    triggered = true;
    animating  = true;

    // Lock scroll centred on the fifth section so the exit animation
    // is fully visible in the middle of the screen.
    lockScroll(fifthSection);

    // Trigger slide-out on the fifth-section panels
    panel4L.classList.add('slide-out-left');
    panel4R.classList.add('slide-out-right');

    setTimeout(() => {
      // Reposition the locked viewport to centre the sixth section
      const sixthY = sixthSection.offsetTop;
      const centredOffset = Math.max(
        0,
        Math.round(sixthY + sixthSection.offsetHeight / 2 - window.innerHeight / 2)
      );
      document.documentElement.style.setProperty(
        '--scroll-lock-offset', `-${centredOffset}px`
      );

      // Trigger slide-in on the sixth-section panels
      leftPanel.classList.add('sixth-panel--entered');
      rightPanel.classList.add('sixth-panel--entered');

      setTimeout(() => {
        // Unlock and land slightly above the sixth section
        unlockScroll(sixthY - 100);
        animating = false;
      }, PHASE + 50);
    }, PHASE);
  }

  // ── Reverse: 6th section slides out → 5th section slides in ──────────
  function runReverse() {
    if (!triggered || animating) return;
    animating = true;

    // Lock scroll centred on the sixth section for the exit animation
    lockScroll(sixthSection);

    // Remove the entered state — CSS handles the slide-out transition
    leftPanel.classList.remove('sixth-panel--entered');
    rightPanel.classList.remove('sixth-panel--entered');

    setTimeout(() => {
      const fifthY = fifthSection.offsetTop;
      const centredOffset = Math.max(
        0,
        Math.round(fifthY + fifthSection.offsetHeight / 2 - window.innerHeight / 2)
      );
      document.documentElement.style.setProperty(
        '--scroll-lock-offset', `-${centredOffset}px`
      );

      // Remove slide-out classes → CSS transitions panels back in
      panel4L.classList.remove('slide-out-left');
      panel4R.classList.remove('slide-out-right');

      setTimeout(() => {
        unlockScroll(fifthY);
        animating  = false;
        triggered  = false;
      }, PHASE + 50);
    }, PHASE);
  }

  // ── Wheel listener (desktop only) ────────────────────────────────────
  window.addEventListener('wheel', (e) => {
    if (isMobile()) return;

    if (animating) {
      e.preventDefault();
      return;
    }

    const fifthRect = fifthSection.getBoundingClientRect();
    const sixthRect = sixthSection.getBoundingClientRect();

    const fifthInView = fifthRect.top >= -20 && fifthRect.bottom <= window.innerHeight + 20;
    const atSixthTop  = sixthRect.top  >= -30 && sixthRect.top  <= 80;

    if (!triggered && e.deltaY > 0 && fifthInView) {
      e.preventDefault();
      runForward();
    } else if (triggered && e.deltaY < 0 && atSixthTop) {
      e.preventDefault();
      runReverse();
    }
  }, { passive: false });

  // ── Touch listener (desktop only) ────────────────────────────────────
  let touchStartY = 0;

  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (isMobile()) return;

    if (animating) { e.preventDefault(); return; }

    const deltaY    = touchStartY - e.touches[0].clientY;
    const fifthRect = fifthSection.getBoundingClientRect();
    const sixthRect = sixthSection.getBoundingClientRect();

    const fifthInView = fifthRect.top >= -20 && fifthRect.bottom <= window.innerHeight + 20;
    const atSixthTop  = sixthRect.top  >= -30 && sixthRect.top  <= 80;

    if (!triggered && deltaY > 30 && fifthInView) {
      e.preventDefault();
      runForward();
    } else if (triggered && deltaY < -30 && atSixthTop) {
      e.preventDefault();
      runReverse();
    }
  }, { passive: false });

  // ── Cleanup on resize / orientation change ────────────────────────────
  window.addEventListener('resize', () => {
    if (!isMobile()) {
      fifthSection.style.flexDirection = 'row';
    } else {
      fifthSection.style.flexDirection = '';
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
  cursorDot.style.top  = e.clientY + 'px';
});

/* ── 9. FAQ accordion ─────────────────────────────────────── */
document.querySelectorAll('.faq-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const item   = btn.closest('.faq-item');
    const body   = item.querySelector('.faq-body');
    const isOpen = item.classList.contains('open');

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