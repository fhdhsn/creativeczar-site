import * as THREE from "three";

/* ============================================================
   CREATIVE CZAR — premium editorial studio
   - Three.js: a quiet, slow-drifting gradient "fog" on a
     full-screen plane (atmospheric, never distracting)
   - GSAP: line-mask headline reveals, word fades, parallax
   - Minimal ink cursor, loader with a hard fallback
   ============================================================ */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- THREE.JS — soft gradient fog ---------------- */
let renderer, scene, camera, mesh, uniforms;
const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

function initThree() {
  const canvas = document.getElementById("bg-canvas");
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  uniforms = {
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    // flat near-white — keeps the page paper-white for the Swiss layout
    uBg: { value: new THREE.Color("#FFFFFF") },
    uC1: { value: new THREE.Color("#FAFAFA") },
    uC2: { value: new THREE.Color("#FFFFFF") },
    uC3: { value: new THREE.Color("#F6F6F6") },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime; uniform vec2 uRes; uniform vec2 uMouse;
      uniform vec3 uBg, uC1, uC2, uC3;

      // simplex-ish value noise
      vec2 hash(vec2 p){ p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))); return -1.0+2.0*fract(sin(p)*43758.5453123); }
      float noise(vec2 p){
        vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*(3.0-2.0*f);
        return mix(mix(dot(hash(i+vec2(0.0,0.0)),f-vec2(0.0,0.0)),dot(hash(i+vec2(1.0,0.0)),f-vec2(1.0,0.0)),u.x),
                   mix(dot(hash(i+vec2(0.0,1.0)),f-vec2(0.0,1.0)),dot(hash(i+vec2(1.0,1.0)),f-vec2(1.0,1.0)),u.x),u.y);
      }
      float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.0; a*=0.5; } return v; }

      void main(){
        vec2 uv = vUv;
        vec2 asp = vec2(uRes.x/uRes.y, 1.0);
        vec2 p = uv * asp;
        float t = uTime * 0.025;                 // very slow
        vec2 m = (uMouse - 0.5) * 0.25;          // gentle mouse drift

        float n1 = fbm(p * 1.6 + vec2(t, -t) + m);
        float n2 = fbm(p * 2.4 - vec2(t*0.7, t) + n1);
        float blend = smoothstep(0.0, 1.0, n1 * 0.5 + 0.5);
        float blend2 = smoothstep(0.0, 1.0, n2 * 0.5 + 0.5);

        vec3 col = mix(uBg, uC1, blend * 0.9);
        col = mix(col, uC2, blend2 * 0.5);
        col = mix(col, uC3, smoothstep(0.3, 0.9, fbm(p*0.9 + t)) * 0.45);

        // soft vignette toward the base bg so edges stay calm
        float vig = smoothstep(1.25, 0.2, length(uv - 0.5));
        col = mix(uBg, col, 0.65 + vig * 0.35);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);

  window.addEventListener("resize", onResize);
  if (!prefersReduced) animate();
  else renderer.render(scene, camera);
}

function onResize() {
  if (!renderer) return;
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.uRes.value.set(window.innerWidth, window.innerHeight);
}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  uniforms.uTime.value = clock.getElapsedTime();
  mouse.x += (mouse.tx - mouse.x) * 0.04;
  mouse.y += (mouse.ty - mouse.y) * 0.04;
  uniforms.uMouse.value.set(mouse.x, mouse.y);
  renderer.render(scene, camera);
}

window.addEventListener("pointermove", (e) => {
  mouse.tx = e.clientX / window.innerWidth;
  mouse.ty = 1 - e.clientY / window.innerHeight;
});

/* ---------------- Minimal cursor ---------------- */
function initCursor() {
  const cursor = document.getElementById("cursor");
  if (!cursor || window.matchMedia("(hover: none)").matches) return;
  const p = { x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2 };
  window.addEventListener("pointermove", (e) => { p.tx = e.clientX; p.ty = e.clientY; });
  (function loop() {
    p.x += (p.tx - p.x) * 0.2; p.y += (p.ty - p.y) * 0.2;
    cursor.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll("[data-cursor], a, button").forEach((el) => {
    el.addEventListener("mouseenter", () => cursor.classList.add("grow"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("grow"));
  });
}

/* ---------------- Nav ---------------- */
function initNav() {
  const nav = document.getElementById("nav");
  window.addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 30));
  const burger = document.getElementById("burger");
  const menu = document.getElementById("mobileMenu");
  const setMenu = (open) => {
    burger.classList.toggle("open", open);
    menu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
  };
  burger.addEventListener("click", () => setMenu(!menu.classList.contains("open")));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
}

/* ---- Hero video: nudge autoplay (iOS/Safari can defer muted autoplay) ---- */
function initHeroVideo() {
  const v = document.querySelector(".hero-video");
  if (!v) return;
  v.muted = true; // required for autoplay; also set as a property
  const tryPlay = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  tryPlay();
  v.addEventListener("loadeddata", tryPlay);
  ["touchstart", "pointerdown", "scroll"].forEach((ev) =>
    window.addEventListener(ev, tryPlay, { once: true, passive: true })
  );
}

/* ---------------- Loader (with hard fallback) ---------------- */
let booted = false;
function revealAll() {
  if (booted) return;
  booted = true;
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
  document.querySelectorAll(".reveal-fade, .reveal-word").forEach((el) => { el.style.opacity = "1"; el.style.transform = "none"; });
  document.querySelectorAll(".ln > span").forEach((el) => { el.style.transform = "none"; });
}

function runLoader(done) {
  const loader = document.getElementById("loader");
  const bar = document.getElementById("loaderBar");
  const pct = document.getElementById("loaderPct");
  if (!loader || prefersReduced) { revealAll(); done(false); return; }

  // Never let content stay hidden behind the loader (CDN/throttle safety).
  const safety = setTimeout(() => { revealAll(); done(false); }, 3500);

  const obj = { v: 0 };
  gsap.to(obj, {
    v: 100, duration: 1.5, ease: "power2.inOut",
    onUpdate: () => { const v = Math.round(obj.v); bar.style.width = v + "%"; pct.textContent = String(v).padStart(2, "0"); },
    onComplete: () => {
      gsap.to(loader, {
        yPercent: -100, duration: 1.0, ease: "power4.inOut",
        onComplete: () => { clearTimeout(safety); loader.style.display = "none"; booted = true; done(true); },
      });
    },
  });
}

/* ---------------- GSAP reveals ---------------- */
function initGsap(animate = true) {
  if (typeof gsap === "undefined") { revealAll(); return; }
  gsap.registerPlugin(ScrollTrigger);

  if (!animate) { revealAll(); return; }

  // Hero line masks
  gsap.to(".hero-title .ln > span", { y: 0, duration: 1.2, ease: "power4.out", stagger: 0.1 });

  // Generic fade-ups
  gsap.utils.toArray(".reveal-fade").forEach((el) => {
    if (el.closest(".hero")) {
      gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.4 });
      return;
    }
    gsap.to(el, {
      opacity: 1, y: 0, duration: 1, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 90%" },
    });
  });

  // Word-by-word statement reveals
  gsap.utils.toArray(".reveal-word").forEach((el) => {
    gsap.to(el, {
      opacity: 1, duration: 1.1, ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });

  // Section heading line masks
  gsap.utils.toArray(".contact-mail .ln > span").forEach((el) => {
    gsap.to(el, { y: 0, duration: 1.1, ease: "power4.out",
      scrollTrigger: { trigger: ".contact-mail", start: "top 80%" } });
  });

  // Subtle parallax on project visuals
  gsap.utils.toArray("[data-parallax]").forEach((el) => {
    gsap.fromTo(el, { y: 40 }, {
      y: -40, ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 },
    });
  });
}

/* ---------------- Boot ---------------- */
window.addEventListener("DOMContentLoaded", () => {
  initThree();
  initCursor();
  initNav();
  initHeroVideo();
  if (typeof gsap !== "undefined") runLoader((animate) => initGsap(animate));
  else revealAll();
});
