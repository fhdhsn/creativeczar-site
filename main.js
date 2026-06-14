import * as THREE from "three";

/* ============================================================
   CREATIVE CZAR — interactions
   - Three.js animated particle field (mouse reactive)
   - GSAP scroll reveals, hero timeline, marquee, counters
   - Custom cursor, nav, mobile menu, loader
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- THREE.JS PARTICLE FIELD ---------------- */
let renderer, scene, camera, points, geometry;
const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
const COUNT = window.innerWidth < 768 ? 4000 : 9000;

function initThree() {
  const canvas = document.getElementById("bg-canvas");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 14;

  geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const scales = new Float32Array(COUNT);

  // Brand palette
  const palette = [
    new THREE.Color("#FF2E63"),
    new THREE.Color("#7C3AED"),
    new THREE.Color("#00E5FF"),
    new THREE.Color("#C6FF00"),
    new THREE.Color("#FF9E00"),
  ];

  // Distribute particles on a sphere-ish flowing form
  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3;
    const r = 8 + Math.random() * 4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
    positions[i3 + 2] = r * Math.cos(phi);

    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i3] = c.r; colors[i3 + 1] = c.g; colors[i3 + 2] = c.b;
    scales[i] = Math.random();
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
  geometry.userData.basePositions = positions.slice();

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uSize: { value: renderer.getPixelRatio() * 26 } },
    vertexShader: `
      uniform float uTime;
      uniform float uSize;
      attribute float aScale;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec3 p = position;
        float t = uTime * 0.5;
        p.x += sin(t + position.y * 0.5) * 0.4;
        p.y += cos(t + position.x * 0.5) * 0.4;
        p.z += sin(t + position.z * 0.4) * 0.4;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (aScale * 0.6 + 0.4) * (1.0 / -mv.z);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor, alpha * 0.9);
      }
    `,
    vertexColors: true,
  });

  points = new THREE.Points(geometry, material);
  scene.add(points);

  window.addEventListener("resize", onResize);
  animate();
}

function onResize() {
  if (!renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

let scrollProgress = 0;
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  points.material.uniforms.uTime.value = t;

  // smooth mouse follow
  pointer.x += (pointer.tx - pointer.x) * 0.05;
  pointer.y += (pointer.ty - pointer.y) * 0.05;

  // rotation driven by mouse + time + scroll
  points.rotation.y = t * 0.04 + pointer.x * 0.4;
  points.rotation.x = pointer.y * 0.3 + scrollProgress * 0.6;
  camera.position.z = 14 - scrollProgress * 3;

  renderer.render(scene, camera);
}

window.addEventListener("pointermove", (e) => {
  pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
});
window.addEventListener("scroll", () => {
  const max = document.body.scrollHeight - window.innerHeight;
  scrollProgress = max > 0 ? window.scrollY / max : 0;
});

/* ---------------- CUSTOM CURSOR ---------------- */
function initCursor() {
  const cursor = document.getElementById("cursor");
  const dot = document.getElementById("cursorDot");
  if (!cursor || window.matchMedia("(hover: none)").matches) return;
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const dotPos = { ...pos };
  window.addEventListener("pointermove", (e) => { pos.tx = e.clientX; pos.ty = e.clientY; });
  function loop() {
    pos.x += ((pos.tx ?? pos.x) - pos.x) * 0.18;
    pos.y += ((pos.ty ?? pos.y) - pos.y) * 0.18;
    dotPos.x += ((pos.tx ?? pos.x) - dotPos.x) * 0.5;
    dotPos.y += ((pos.ty ?? pos.y) - dotPos.y) * 0.5;
    cursor.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%,-50%)`;
    dot.style.transform = `translate(${dotPos.x}px, ${dotPos.y}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  }
  loop();
  document.querySelectorAll("[data-cursor]").forEach((el) => {
    const type = el.getAttribute("data-cursor");
    el.addEventListener("mouseenter", () => cursor.classList.add(type));
    el.addEventListener("mouseleave", () => cursor.classList.remove(type));
  });
}

/* ---------------- NAV + MOBILE MENU ---------------- */
function initNav() {
  const nav = document.getElementById("nav");
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 40);
  });
  const burger = document.getElementById("burger");
  const menu = document.getElementById("mobileMenu");
  burger.addEventListener("click", () => {
    burger.classList.toggle("open");
    menu.classList.toggle("open");
  });
  menu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => { burger.classList.remove("open"); menu.classList.remove("open"); })
  );
}

/* ---------------- GSAP ANIMATIONS ---------------- */
function initGsap(animate = true) {
  if (typeof gsap === "undefined") { revealAll(); return; }
  gsap.registerPlugin(ScrollTrigger);

  // If we're in fallback mode (content already force-revealed), skip the
  // entrance animations that would temporarily hide content — but still wire
  // up the non-hiding enhancements (marquee, counters, parallax) below.
  if (animate) {
    // Hero intro
    gsap.set(".hero-badge, .hero-sub, .hero-actions, .hero-scroll", { y: 30 });
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.from(".hero-title .line span", { yPercent: 110, duration: 1.1, stagger: 0.12 })
      .to(".hero-badge", { opacity: 1, y: 0, duration: 0.8 }, "-=0.7")
      .to(".hero-sub", { opacity: 1, y: 0, duration: 0.8 }, "-=0.6")
      .to(".hero-actions", { opacity: 1, y: 0, duration: 0.8 }, "-=0.6")
      .to(".hero-scroll", { opacity: 1, y: 0, duration: 0.8 }, "-=0.6");

    // Generic reveals
    gsap.utils.toArray(".reveal").forEach((el) => {
      if (el.closest(".hero")) return;
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });
  }

  // Stat counters
  gsap.utils.toArray(".stat .num").forEach((el) => {
    const target = +el.dataset.count;
    if (!animate) { el.textContent = target; return; }
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: () => {
        gsap.to({ v: 0 }, {
          v: target, duration: 2, ease: "power2.out",
          onUpdate: function () { el.textContent = Math.round(this.targets()[0].v); },
        });
      },
    });
  });

  // Marquee scroll-linked drift
  const track = document.querySelector(".marquee-track");
  if (track) {
    gsap.to(track, {
      xPercent: -50, repeat: -1, duration: 20, ease: "none",
    });
    gsap.to(track, {
      x: "+=200",
      scrollTrigger: { trigger: ".marquee-wrap", scrub: 1, start: "top bottom", end: "bottom top" },
    });
  }

  // Section heading parallax
  gsap.utils.toArray(".section-head h2").forEach((h) => {
    gsap.from(h, {
      backgroundPositionX: "100%",
      scrollTrigger: { trigger: h, scrub: 1, start: "top 80%", end: "top 30%" },
    });
  });
}

/* ---------------- LOADER ---------------- */
let booted = false;

// Guaranteed, RAF-independent way to reveal the page. Safe to call multiple
// times. Protects against GSAP failing to load or rAF being throttled — the
// site must never get stuck behind a frozen loader with hidden content.
function revealAll() {
  if (booted) return;
  booted = true;
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
  document.querySelectorAll(".reveal, .hero-badge, .hero-sub, .hero-actions, .hero-scroll")
    .forEach((el) => { el.style.opacity = "1"; el.style.transform = "none"; });
}

function runLoader(done) {
  const loader = document.getElementById("loader");
  const bar = document.getElementById("loaderBar");
  const count = document.getElementById("loaderCount");
  if (!loader || prefersReduced) { revealAll(); done(); return; }

  // Hard safety net: if the GSAP-driven loader hasn't finished in 3.5s
  // (CDN blocked, throttled rAF, etc.), force the page open anyway and tell
  // the caller to wire up animations in non-hiding fallback mode.
  const safety = setTimeout(() => { revealAll(); done(false); }, 3500);

  const obj = { v: 0 };
  gsap.to(obj, {
    v: 100, duration: 1.6, ease: "power2.inOut",
    onUpdate: () => { const v = Math.round(obj.v); bar.style.width = v + "%"; count.textContent = v; },
    onComplete: () => {
      gsap.to(loader, {
        yPercent: -100, duration: 0.9, ease: "power4.inOut",
        onComplete: () => { clearTimeout(safety); loader.style.display = "none"; booted = true; done(true); },
      });
    },
  });
}

/* ---------------- BOOT ---------------- */
window.addEventListener("DOMContentLoaded", () => {
  initThree();
  initCursor();
  initNav();
  if (typeof gsap !== "undefined") {
    runLoader((animate) => initGsap(animate));
  } else {
    // GSAP failed to load — never leave the page stuck behind the loader.
    revealAll();
  }
});
