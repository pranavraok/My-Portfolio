/* =======================================================================
   PRANAV-OS v3.1 — JavaScript Engine — All Fixes Applied
   GSAP timeline zoom, window transitions, hover explorer, slam FX
======================================================================= */

// ============================== LENIS ==============================
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smooth: true,
  smoothTouch: false,
});
function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
gsap.registerPlugin(ScrollTrigger);

// ============================== CUSTOM CURSOR ==============================
const cursorEl = document.createElement('div');
cursorEl.className = 'cursor-main';
cursorEl.textContent = '_';
document.body.appendChild(cursorEl);

let mouseX = 0, mouseY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  // Ghost trail
  const ghost = document.createElement('div');
  ghost.className = 'cursor-ghost';
  ghost.textContent = '_';
  ghost.style.left = mouseX + 'px';
  ghost.style.top = mouseY + 'px';
  document.body.appendChild(ghost);
  setTimeout(() => ghost.remove(), 300);
});

gsap.ticker.add(() => {
  gsap.set(cursorEl, { x: mouseX, y: mouseY });
});

// Hover swaps
document.querySelectorAll('a, button, .desktop-icon, .file-row, .thumb, .dialog-btn, .inline-link').forEach(el => {
  el.addEventListener('mouseenter', () => cursorEl.textContent = '>_');
  el.addEventListener('mouseleave', () => cursorEl.textContent = '_');
});

// ============================== TASKBAR CLOCK ==============================
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const el = document.getElementById('taskbar-clock');
  if (el) el.textContent = `${h}:${m}`;
}
updateClock();
setInterval(updateClock, 30000);

// ============================== PARTICLE CONSTELLATION ==============================
const canvas = document.getElementById('particles-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let particles = [];
const PARTICLE_COUNT = 50;
const CONNECT_DIST = 110;

function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function initParticles() {
  particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
    });
  }
}

function drawParticles() {
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONNECT_DIST) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
    ctx.fill();
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
  });
  requestAnimationFrame(drawParticles);
}

if (canvas) { initParticles(); drawParticles(); }

// ============================== PHASE 1: ZOOM SEQUENCE ==============================
const deskPhoto = document.getElementById('desk-photo');
const vignetteOverlay = document.getElementById('vignette-overlay');
const monitorGlint = document.getElementById('monitor-glint');
const scrollPrompt = document.getElementById('scroll-prompt');
const osScreen = document.getElementById('os-screen');
const bezel = document.getElementById('monitor-bezel');
const taskbar = document.getElementById('os-taskbar');
const bezelLed = document.querySelector('.bezel-led');
const bezelLabel = document.querySelector('.bezel-label');
const particlesCanvas = document.getElementById('particles-canvas');
const deskForeground = document.getElementById('desk-foreground-blur');
const zoomStage = document.querySelector('.zoom-stage');

// Monitor center in the Unsplash photo (adjust to match)
const MONITOR_CENTER_X = 51;
const MONITOR_CENTER_Y = 37;
const MONITOR_SCALE = 5.5;

// SET INITIAL TILT STATE — cinematic camera angle
gsap.set(zoomStage, {
  rotateX: 4,
  rotateY: -3,
  transformPerspective: 1200,
  transformOrigin: 'center center'
});

// GSAP Timeline — scroll-driven zoom
const zoomTl = gsap.timeline({
  scrollTrigger: {
    trigger: '#zoom-wrapper',
    start: 'top top',
    end: '+=250vh',
    scrub: 2,
    pin: true,
    anticipatePin: 1,
    onUpdate: (self) => {
      // Fade scroll prompt quickly
      if (scrollPrompt) {
        scrollPrompt.style.opacity = self.progress < 0.08 ? 1 - (self.progress / 0.08) : 0;
      }
    }
  }
});

zoomTl
  // Camera tilt resolves to straight as we dolly in
  .to(zoomStage, {
    rotateX: 0,
    rotateY: 0,
    ease: 'none',
    duration: 1
  }, 0)
  // Scale the desk photo into the monitor
  .to(deskPhoto, {
    scale: MONITOR_SCALE,
    transformOrigin: `${MONITOR_CENTER_X}% ${MONITOR_CENTER_Y}%`,
    ease: 'power1.inOut',
    duration: 1
  }, 0)
  // Foreground parallax — scales SLOWER for depth illusion
  .to(deskForeground, {
    scale: 3,
    transformOrigin: '50% 100%',
    ease: 'power1.inOut',
    duration: 1
  }, 0)
  // Vignette overlay fades in (hole centered on monitor)
  .to(vignetteOverlay, {
    opacity: 1,
    ease: 'power2.in',
    duration: 0.6
  }, 0.3)
  // Monitor glint sweep
  .fromTo(monitorGlint,
    { scaleX: 0, opacity: 0.8 },
    { scaleX: 1, opacity: 0, duration: 0.12 },
    0.82
  )
  // Photo fades out
  .to(deskPhoto, {
    opacity: 0,
    duration: 0.15
  }, 0.85)
  // Foreground fades with photo
  .to(deskForeground, {
    opacity: 0,
    duration: 0.15
  }, 0.85)
  // Monitor overlay text fades
  .to('.monitor-screen-overlay', {
    opacity: 0,
    duration: 0.1
  }, 0.82)
  // OS screen fades in
  .to(osScreen, {
    opacity: 1,
    duration: 0.2
  }, 0.85)
  // Bezel + taskbar appear
  .to([bezel, taskbar, bezelLed, bezelLabel], {
    opacity: 1,
    duration: 0.3
  }, 0.88)
  // Particles appear
  .to(particlesCanvas, {
    opacity: 1,
    duration: 0.3
  }, 0.88);

// ============================== HERO TYPING (triggers when OS appears) ==============================
let heroTyped = false;
ScrollTrigger.create({
  trigger: '#zoom-wrapper',
  start: 'top top',
  end: '+=250vh',
  onUpdate: (self) => {
    if (self.progress > 0.9 && !heroTyped) {
      heroTyped = true;
      initHeroTyping();
      // Animate terminal window in
      gsap.from('#win-hero', {
        scale: 0.9, opacity: 0,
        duration: 0.5, ease: 'back.out(1.5)'
      });
      gsap.from('#win-preview', {
        scale: 0.9, opacity: 0,
        duration: 0.5, delay: 0.2, ease: 'back.out(1.5)'
      });
    }
  }
});

function initHeroTyping() {
  new Typed('#hero-typewriter', {
    strings: [
      'Full-Stack Developer',
      'AI/ML Engineer',
      'Hackathon Winner',
      'Problem Solver'
    ],
    typeSpeed: 50,
    backSpeed: 30,
    backDelay: 1500,
    loop: true,
    showCursor: false,
  });
}

// ============================== WINDOW OPEN ANIMATIONS ==============================
const windows = [
  { trigger: '#about', win: '#win-about' },
  { trigger: '#experience', win: '#win-exp' },
  { trigger: '#skills', win: '#win-skills' },
  { trigger: '#achievements', win: '#win-achieve' },
  { trigger: '#projects', win: '#win-projects' },
];

windows.forEach(({ trigger, win }) => {
  const el = document.querySelector(win);
  if (!el) return;
  gsap.from(el, {
    scale: 0.85, opacity: 0, y: 30,
    duration: 0.5,
    ease: 'back.out(1.5)',
    scrollTrigger: {
      trigger: trigger,
      start: 'top 75%',
    }
  });
});

// ============================== GIT LINE DRAW ==============================
const gitLine = document.querySelector('.git-line-draw');
if (gitLine) {
  gsap.to(gitLine, {
    strokeDashoffset: 0,
    ease: 'none',
    scrollTrigger: {
      trigger: '#experience',
      start: 'top 60%',
      end: 'bottom 60%',
      scrub: 1,
    }
  });
}

// ============================== HTOP BARS ==============================
gsap.utils.toArray('.skill-bar').forEach((bar, i) => {
  gsap.to(bar, {
    width: bar.getAttribute('data-level') + '%',
    duration: 0.8,
    delay: i * 0.03,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '#skills',
      start: 'top 70%',
    }
  });
});

// ============================== ACHIEVEMENT SLAM ==============================
gsap.utils.toArray('.slam-banner').forEach((banner, i) => {
  gsap.to(banner, {
    x: 0,
    rotation: 0,
    duration: 0.6,
    delay: i * 0.25,
    ease: 'expo.out',
    scrollTrigger: {
      trigger: banner,
      start: 'top 85%',
    },
    onComplete: function() {
      // Vibration shake on land
      gsap.to(banner, {
        x: '+=5', duration: 0.04,
        yoyo: true, repeat: 5,
        ease: 'none',
        clearProps: 'x'
      });
    }
  });
});

// Set initial rotation for banners
gsap.utils.toArray('.slam-banner').forEach(banner => {
  gsap.set(banner, { rotation: 2 });
});

// ============================== SHUTDOWN DIALOG ==============================
const shutdownDialog = document.getElementById('shutdown-dialog');
if (shutdownDialog) {
  gsap.to(shutdownDialog, {
    scale: 1, opacity: 1,
    duration: 0.5, ease: 'back.out(1.4)',
    scrollTrigger: {
      trigger: '#footer',
      start: 'top 70%',
    }
  });
}

const footerIcons = document.getElementById('footer-icons');
if (footerIcons) {
  gsap.from(footerIcons.children, {
    y: 20, opacity: 0,
    stagger: 0.1, duration: 0.4,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '#footer',
      start: 'top 60%',
    }
  });
}

// ============================== FILE EXPLORER — HOVER to preview ==============================
const projectsData = [
  { name: 'MENTORA', type: '[Mobile App]', desc: 'AI Learning & Career App — AI-powered career guidance and personalized learning roadmaps.', stack: '> Flutter · AI/ML · Supabase · Dart', video: './src/vids/MR.mp4' },
  { name: 'ELECTROTECH', type: '[Mobile App]', desc: 'Electronics E-Commerce — Full-featured shopping experience.', stack: '> Flutter · Dart · Firebase · Figma', video: './src/vids/ET.mp4' },
  { name: 'NUTRIGO', type: '[PWA]', desc: 'Smart Nutrition Tracker — AI-powered food tracking and dietary insights.', stack: '> React · TypeScript · Next.js · LangChain', video: './src/vids/NG.mp4' },
  { name: 'STOCK_ANALYSIS_PRO', type: '[Fintech/ML]', desc: 'Equity Research Platform for Indian Investors — comprehensive stock analysis.', stack: '> Python · FPDF · ML · Fintech', video: './src/vids/SA.mp4' },
  { name: 'EMAIL_CLASSIFIER', type: '[AI Agents]', desc: 'Automated Inbox Organization — AI-driven email categorization and response.', stack: '> n8n · Gemini API · Gmail', video: './src/vids/GSD.mp4' },
  { name: 'SAANVI', type: '[AI Automation]', desc: 'AI Voice Assistant — intelligent conversational voice interface.', stack: '> n8n · Retell AI · Automation', video: './src/vids/VA.mp4' },
  { name: 'SPEEDSNARE', type: '[Computer Vision]', desc: 'Vehicle Speed Detection — real-time monitoring using computer vision.', stack: '> OpenCV · Python · Flask', video: './src/vids/SS.mp4' },
  { name: 'DERMISCAN', type: '[Healthcare AI]', desc: 'Skin Cancer Detection — deep learning-powered dermatological analysis.', stack: '> TensorFlow · Deep Learning · Flask', video: './src/vids/DS.mp4' },
  { name: 'AUTOWORTH', type: '[Machine Learning]', desc: 'Vehicle Worth Estimation — ML-driven car valuation predictor.', stack: '> Scikit-learn · ML · Matplotlib', video: './src/vids/AW.mp4' },
];

const fileRows = document.querySelectorAll('.file-row');
const pdVideo = document.getElementById('pd-video');
const pdName = document.getElementById('pd-name');
const pdType = document.getElementById('pd-type');
const pdDesc = document.getElementById('pd-desc');
const pdStack = document.getElementById('pd-stack');
const previewPanel = document.getElementById('preview-panel');

function updatePreview(idx) {
  const project = projectsData[idx];
  if (!project) return;

  // Quick crossfade
  gsap.to(previewPanel, {
    opacity: 0, duration: 0.1,
    onComplete: () => {
      if (pdName) pdName.textContent = '> ' + project.name;
      if (pdType) pdType.textContent = project.type;
      if (pdDesc) pdDesc.textContent = project.desc;
      if (pdStack) pdStack.textContent = project.stack;
      if (pdVideo) {
        pdVideo.src = project.video;
        pdVideo.load();
        pdVideo.play().catch(() => {});
      }
      gsap.to(previewPanel, { opacity: 1, duration: 0.2 });
    }
  });
}

fileRows.forEach(row => {
  row.addEventListener('mouseenter', () => {
    const idx = parseInt(row.getAttribute('data-project'));
    fileRows.forEach(r => r.classList.remove('active'));
    row.classList.add('active');
    updatePreview(idx);
  });
});

// Auto-play first project video on scroll
ScrollTrigger.create({
  trigger: '#projects',
  start: 'top 70%',
  once: true,
  onEnter: () => {
    if (pdVideo) {
      pdVideo.play().catch(() => {});
    }
  }
});
