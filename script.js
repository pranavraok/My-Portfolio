const BOOT_LINES_DESKTOP = [
  "PRANAV-OS v2.4.0 (Build 2026)",
  "Initializing kernel modules...          [OK]",
  "Loading neural stack: Python, React, Flutter...  [OK]",
  "Mounting /dev/imagination...            [OK]",
  "Starting ML subsystems...               [OK]",
  "Calibrating hackathon protocols...      [OK]",
  "Establishing connection: Bengaluru, India...  [OK]",
  "Boot complete. Welcome."
];

const BOOT_LINES_MOBILE = [
  "PRANAV-OS v2.4.0",
  "Init modules... [OK]",
  "Load Python/React/Flutter... [OK]",
  "Connect Bengaluru... [OK]",
  "Boot complete."
];

const IS_MOBILE = window.matchMedia("(max-width: 767px)").matches;
const BOOT_LINES = IS_MOBILE ? BOOT_LINES_MOBILE : BOOT_LINES_DESKTOP;
const BOOT_SESSION_KEY = "pranavOsBootSeenV1";
const BOOT_FAST_MODE = IS_MOBILE || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let hasSeenBoot = false;
try {
  hasSeenBoot = window.sessionStorage.getItem(BOOT_SESSION_KEY) === "1";
} catch {
  hasSeenBoot = false;
}

const bootScreen = document.getElementById("boot-screen");
const bootLog = document.getElementById("boot-log");
const bootProgressFill = document.getElementById("boot-progress-fill");
const app = document.getElementById("app");

const menuToggle = document.getElementById("menu-toggle");
const mobileNav = document.getElementById("mobile-nav");

const cursorMain = document.getElementById("cursor-main");
const cursorGhosts = [
  document.getElementById("cursor-ghost-1"),
  document.getElementById("cursor-ghost-2"),
  document.getElementById("cursor-ghost-3")
];

const aboutRaw = document.getElementById("about-raw");
const lineNumbers = document.querySelector(".line-numbers");
const photoScan = document.getElementById("photo-scan");

function initializeSite() {
  setupLineNumbers();
  setupMenu();
  setupCursor();
  setupProjectVideos();

  runBootSequence().then(() => {
    app.classList.remove("hidden-until-boot");
    runBootExitAnimation();
    setupLenis();
    setupTyped();
    setupSectionAnimations();
    setupSkillRows();
    setupPhotoScanSweep();
    setupFooterTyped();
  });
}

function setupLineNumbers() {
  if (!aboutRaw || !lineNumbers) {
    return;
  }

  const lines = aboutRaw.textContent.split("\n").length;
  const frag = document.createDocumentFragment();
  for (let i = 1; i <= lines; i += 1) {
    const li = document.createElement("li");
    li.textContent = String(i);
    frag.appendChild(li);
  }
  lineNumbers.appendChild(frag);
}

async function runBootSequence() {
  if (!bootScreen || !bootLog || !bootProgressFill) {
    return;
  }

  if (BOOT_FAST_MODE || hasSeenBoot) {
    bootLog.textContent = `${BOOT_LINES[0]}\nBoot complete. Welcome.`;
    bootProgressFill.style.width = "100%";
    await wait(90);
    return;
  }

  for (let i = 0; i < BOOT_LINES.length; i += 1) {
    await typeLine(BOOT_LINES[i]);
    bootLog.textContent += "\n";
    const pct = ((i + 1) / BOOT_LINES.length) * 100;
    bootProgressFill.style.width = `${pct}%`;
    await wait(20);
  }

  try {
    window.sessionStorage.setItem(BOOT_SESSION_KEY, "1");
  } catch {
    /* Ignore storage errors in restricted contexts. */
  }

  await wait(140);
}

function typeLine(line) {
  return new Promise((resolve) => {
    let idx = 0;
    const timer = window.setInterval(() => {
      if (idx >= line.length) {
        window.clearInterval(timer);
        resolve();
        return;
      }
      bootLog.textContent += line[idx];
      idx += 1;
    }, 18);
  });
}

function runBootExitAnimation() {
  if (!window.gsap) {
    bootScreen.style.display = "none";
    return;
  }

  const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
  tl.to(bootScreen, {
    duration: 0.05,
    x: -8,
    filter: "contrast(1.5) saturate(1.3)",
    backgroundColor: "rgba(20,0,0,0.8)"
  })
    .to(bootScreen, {
      duration: 0.05,
      x: 8,
      backgroundColor: "rgba(0,0,20,0.8)"
    })
    .to(bootScreen, {
      duration: 0.08,
      x: 0,
      opacity: 0,
      onComplete: () => {
        bootScreen.style.display = "none";
      }
    })
    .from(
      ".hero-terminal",
      {
        y: 140,
        opacity: 0,
        duration: 0.5,
        ease: "expo.out"
      },
      "-=0.1"
    )
    .from(
      ".hero-name",
      {
        scale: 0.8,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out"
      },
      "-=0.35"
    );
}

function setupLenis() {
  if (!window.Lenis) {
    return;
  }

  const lenis = new Lenis({
    duration: 1.1,
    wheelMultiplier: 0.95,
    lerp: 0.08,
    smoothWheel: true
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
}

function setupMenu() {
  if (!menuToggle || !mobileNav) {
    return;
  }

  menuToggle.addEventListener("click", () => {
    mobileNav.classList.toggle("open");
  });

  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("open");
    });
  });
}

function setupCursor() {
  if (IS_MOBILE || !cursorMain || cursorGhosts.some((ghost) => !ghost)) {
    return;
  }

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  const ghostPositions = [
    { x: mouseX, y: mouseY },
    { x: mouseX, y: mouseY },
    { x: mouseX, y: mouseY }
  ];

  document.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
  });

  const hoverTargets = document.querySelectorAll("a, button, .cmd-btn, .proc-card");
  hoverTargets.forEach((el) => {
    el.addEventListener("mouseenter", () => {
      cursorMain.textContent = ">_";
      cursorMain.style.color = "#ffffff";
    });

    el.addEventListener("mouseleave", () => {
      cursorMain.textContent = "_";
      cursorMain.style.color = "var(--accent-green)";
    });
  });

  const tick = () => {
    const lag = 0.2;
    const mainX = parseFloat(cursorMain.style.left || mouseX);
    const mainY = parseFloat(cursorMain.style.top || mouseY);
    const nextX = mainX + (mouseX - mainX) * lag;
    const nextY = mainY + (mouseY - mainY) * lag;

    cursorMain.style.left = `${nextX}px`;
    cursorMain.style.top = `${nextY}px`;

    ghostPositions.forEach((pos, idx) => {
      const targetX = idx === 0 ? nextX : ghostPositions[idx - 1].x;
      const targetY = idx === 0 ? nextY : ghostPositions[idx - 1].y;
      pos.x += (targetX - pos.x) * 0.25;
      pos.y += (targetY - pos.y) * 0.25;

      const ghost = cursorGhosts[idx];
      ghost.style.left = `${pos.x}px`;
      ghost.style.top = `${pos.y}px`;
      ghost.style.opacity = String(0.3 - idx * 0.09);
    });

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

function setupTyped() {
  if (!window.Typed) {
    const fallbackRole = document.getElementById("role-typed");
    if (fallbackRole) {
      fallbackRole.textContent = "Full-Stack Developer_";
    }
    return;
  }

  new Typed("#role-typed", {
    strings: [
      "Full-Stack Developer_",
      "AI/ML Engineer_",
      "Hackathon Winner_",
      "Problem Solver_"
    ],
    typeSpeed: 42,
    backSpeed: 22,
    backDelay: 950,
    loop: true
  });
}

function setupSectionAnimations() {
  if (!window.gsap || !window.ScrollTrigger) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  gsap.utils
    .toArray([
      ".about-panel",
      ".experience-panel",
      ".skills-panel",
      ".achievements-panel",
      ".projects-panel",
      ".footer-panel"
    ])
    .forEach((section) => {
      gsap.from(section, {
        opacity: 0,
        y: 60,
        duration: 0.5,
        ease: "power2.out",
        scrollTrigger: {
          trigger: section,
          start: "top 82%"
        }
      });
    });

  gsap.from(".editor-shell", {
    x: 180,
    opacity: 0,
    duration: 0.6,
    ease: "power3.out",
    scrollTrigger: {
      trigger: ".about-panel",
      start: "top 72%"
    }
  });

  gsap.from(".raw-content", {
    opacity: 0,
    duration: 0.7,
    ease: "none",
    scrollTrigger: {
      trigger: ".about-panel",
      start: "top 70%"
    }
  });

  gsap.to(".git-line", {
    strokeDashoffset: 0,
    duration: 0.8,
    ease: "none",
    scrollTrigger: {
      trigger: ".experience-panel",
      start: "top 65%",
      scrub: 1
    }
  });

  gsap.from(".commit-item", {
    opacity: 0,
    y: 18,
    duration: 0.45,
    stagger: 0.1,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".experience-panel",
      start: "top 72%"
    }
  });

  gsap.from(".ach-card", {
    x: "100%",
    opacity: 0,
    duration: 0.42,
    stagger: 0.2,
    ease: "expo.out",
    scrollTrigger: {
      trigger: ".achievements-panel",
      start: "top 78%"
    },
    onComplete: () => {
      gsap.to(".ach-card", {
        keyframes: [{ x: 3 }, { x: -3 }, { x: 2 }, { x: -2 }, { x: 0 }],
        duration: 0.2,
        ease: "none"
      });
    }
  });

  gsap.from(".proc-card", {
    scale: 0.9,
    opacity: 0,
    duration: 0.4,
    stagger: 0.08,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".projects-panel",
      start: "top 75%"
    }
  });
}

function setupSkillRows() {
  if (!window.gsap || !window.ScrollTrigger) {
    document.querySelectorAll(".skill-row").forEach((row) => {
      const fill = row.querySelector(".skill-fill");
      const level = Number(row.dataset.level || "0");
      if (fill) {
        fill.style.width = `${level}%`;
      }
    });

    const cpu = document.querySelector(".meter-cpu");
    const mem = document.querySelector(".meter-mem");
    if (cpu) {
      cpu.style.maskSize = "94.2% 100%";
    }
    if (mem) {
      mem.style.maskSize = "71% 100%";
    }
    return;
  }

  gsap.to(".meter-cpu", {
    maskSize: "94.2% 100%",
    duration: 0.9,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".skills-panel",
      start: "top 78%"
    }
  });

  gsap.to(".meter-mem", {
    maskSize: "71% 100%",
    duration: 0.9,
    ease: "power2.out",
    scrollTrigger: {
      trigger: ".skills-panel",
      start: "top 78%"
    }
  });

  document.querySelectorAll(".skill-row").forEach((row) => {
    const fill = row.querySelector(".skill-fill");
    const level = Number(row.dataset.level || "0");

    gsap.to(fill, {
      width: `${level}%`,
      duration: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: row,
        start: "top 90%"
      }
    });
  });
}

function setupProjectVideos() {
  const PROJECT_DATA = {
    "001": {
      process: "[PID: 001] mentora.flutter",
      title: "MENTORA",
      tag: "[Mobile App]",
      desc: "AI Learning & Career App",
      stack: "Flutter · AI/ML · Supabase · Dart",
      video: "src/vids/MR.mp4"
    },
    "002": {
      process: "[PID: 002] electrotech.flutter",
      title: "ELECTROTECH",
      tag: "[Mobile App]",
      desc: "Smart Electronics Store",
      stack: "Flutter · Dart · Firebase · Figma",
      video: "src/vids/ET.mp4"
    },
    "003": {
      process: "[PID: 003] nutrigo.react",
      title: "NUTRIGO",
      tag: "[Progressive Web App]",
      desc: "AI Nutrition Tracker",
      stack: "React · TypeScript · Next.js · LangChain",
      video: "src/vids/NG.mp4"
    },
    "004": {
      process: "[PID: 004] stockanalysis.py",
      title: "STOCK ANALYSIS PRO",
      tag: "[Fintech / ML]",
      desc: "Market Trend Predictor",
      stack: "Python · FPDF · ML · Fintech",
      video: "src/vids/SA.mp4"
    },
    "005": {
      process: "[PID: 005] email-classifier.n8n",
      title: "EMAIL CLASSIFIER",
      tag: "[AI Agents]",
      desc: "Smart Inbox Management",
      stack: "n8n · Gemini API · Gmail",
      video: "src/vids/GSD.mp4"
    },
    "006": {
      process: "[PID: 006] saanvi.n8n",
      title: "SAANVI",
      tag: "[AI Automation]",
      desc: "Voice AI Assistant",
      stack: "n8n · Retell AI · Automation",
      video: "src/vids/VA.mp4"
    },
    "007": {
      process: "[PID: 007] speedsnare.cv",
      title: "SPEEDSNARE",
      tag: "[Computer Vision]",
      desc: "Traffic Monitoring",
      stack: "OpenCV · Python · Flask",
      video: "src/vids/SS.mp4"
    },
    "008": {
      process: "[PID: 008] dermiscan.tf",
      title: "DERMISCAN",
      tag: "[Healthcare AI]",
      desc: "Skin Disease Classifier",
      stack: "TensorFlow · Deep Learning · Flask",
      video: "src/vids/DS.mp4"
    },
    "009": {
      process: "[PID: 009] autoworth.ml",
      title: "AUTOWORTH",
      tag: "[Machine Learning]",
      desc: "Vehicle Price Predictor",
      stack: "Scikit-learn · ML · Matplotlib",
      video: "src/vids/AW.mp4"
    }
  };

  const detailProcess = document.getElementById("detail-process");
  const detailStatus = document.getElementById("detail-status");
  const detailTitle = document.getElementById("detail-title");
  const detailTag = document.getElementById("detail-tag");
  const detailDesc = document.getElementById("detail-desc");
  const detailStack = document.getElementById("detail-stack");
  const detailVideo = document.getElementById("detail-video");
  const detailBack = document.getElementById("detail-back");
  const projectExplorer = document.getElementById("project-explorer");

  const cards = document.querySelectorAll(".proc-card");
  const items = document.querySelectorAll(".project-item");

  if (!cards.length) {
    return;
  }

  const setActiveProject = (projectId, openPreview = false) => {
    const data = PROJECT_DATA[projectId];
    if (!data) {
      return;
    }

    cards.forEach((card) => {
      card.classList.toggle("active", card.dataset.project === projectId);
    });

    items.forEach((item) => {
      item.classList.toggle("active", item.dataset.project === projectId);
    });

    if (detailProcess) {
      detailProcess.textContent = data.process;
    }
    if (detailStatus) {
      detailStatus.textContent = "[RUNNING o]";
    }
    if (detailTitle) {
      detailTitle.textContent = data.title;
    }
    if (detailTag) {
      detailTag.textContent = data.tag;
    }
    if (detailDesc) {
      detailDesc.textContent = data.desc;
    }
    if (detailStack) {
      detailStack.textContent = data.stack;
    }

    if (detailVideo) {
      detailVideo.src = data.video;
      detailVideo.currentTime = 0;
      const shouldAutoplay = openPreview || projectExplorer?.classList.contains("preview-open");
      if (shouldAutoplay) {
        detailVideo.play().catch(() => {
          /* Autoplay can fail without user gesture in some browsers. */
        });
      }
    }

    if (openPreview && projectExplorer) {
      projectExplorer.classList.add("preview-open");
      if (window.gsap && !window.matchMedia("(max-width: 767px)").matches) {
        gsap.fromTo(
          "#project-detail",
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" }
        );
      }
    }
  };

  const closePreview = () => {
    if (!projectExplorer) {
      return;
    }

    projectExplorer.classList.remove("preview-open");

    if (detailVideo) {
      detailVideo.pause();
    }
  };

  if (detailBack) {
    detailBack.addEventListener("click", () => {
      closePreview();
    });
  }

  if (projectExplorer) {
    projectExplorer.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closePreview();
      }
    });
  }

  cards.forEach((card) => {
    const projectId = card.dataset.project;
    const video = card.querySelector("video");
    const openLink = card.querySelector(".proc-open");
    if (!video) {
      return;
    }

    card.addEventListener("mouseenter", () => {
      if (projectExplorer?.classList.contains("preview-open")) {
        return;
      }

      video.play().catch(() => {
        /* Autoplay can fail without user gesture in some browsers. */
      });
    });

    card.addEventListener("mouseleave", () => {
      video.pause();
      video.currentTime = 0;
    });

    card.addEventListener("click", () => {
      if (projectId) {
        setActiveProject(projectId, true);
      }
    });

    if (openLink) {
      openLink.addEventListener("click", (event) => {
        event.preventDefault();
        if (projectId) {
          setActiveProject(projectId, true);
        }
      });
    }
  });

  items.forEach((item) => {
    item.addEventListener("click", () => {
      const projectId = item.dataset.project;
      if (projectId) {
        setActiveProject(projectId, true);
      }
    });
  });

  setActiveProject("001", false);
}

function setupPhotoScanSweep() {
  if (!photoScan || !window.gsap) {
    return;
  }

  const runScan = () => {
    gsap.fromTo(
      photoScan,
      { yPercent: -120, opacity: 0.95 },
      { yPercent: 620, opacity: 0, duration: 0.7, ease: "power1.out" }
    );
  };

  runScan();
  window.setInterval(runScan, 5000);
}

function setupFooterTyped() {
  const shutdownEl = document.getElementById("shutdown-typed");
  const shutdownText = "> Saving session state...             [OK]\n> Closing all connections...          [OK]\n> Flushing cache: pranav@universe...  [OK]\n>\n> \"Building innovative solutions through code.\"\n>\n> System will restart with next great idea.";

  if (!shutdownEl) {
    return;
  }

  if (!window.ScrollTrigger || !window.Typed) {
    shutdownEl.textContent = shutdownText;
    return;
  }

  ScrollTrigger.create({
    trigger: "#footer",
    start: "top 80%",
    once: true,
    onEnter: () => {
      new Typed("#shutdown-typed", {
        strings: [shutdownText],
        typeSpeed: 23,
        showCursor: false
      });
    }
  });
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

initializeSite();
