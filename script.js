// ============= MOBILE MENU ============= //
const hamburger = document.getElementById('hamburger');
const menu = document.getElementById('menu');

hamburger.addEventListener('click', () => {
  menu.classList.toggle('open');
});

// Close menu when clicking a link
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    menu.classList.remove('open');
  });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  if (!hamburger.contains(e.target) && !menu.contains(e.target)) {
    menu.classList.remove('open');
  }
});

// ============= ACTIVE LINK ON SCROLL ============= //
const sections = [...document.querySelectorAll('header, section')];
const navLinks = document.querySelectorAll('.nav-link');

function setActiveLink() {
  let currentSection = sections[0];
  
  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 150 && rect.bottom >= 150) {
      currentSection = section;
      break;
    }
  }
  
  navLinks.forEach(link => link.classList.remove('active'));
  
  const activeLink = [...navLinks].find(link => 
    link.getAttribute('href') === `#${currentSection.id}`
  );
  
  if (activeLink) {
    activeLink.classList.add('active');
  }
}

// Throttle function for better performance
function throttle(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

window.addEventListener('scroll', throttle(setActiveLink, 100));
window.addEventListener('load', setActiveLink);

// ============= REVEAL ON SCROLL ============= //
const observerOptions = {
  threshold: 0.12,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.reveal, .card').forEach(element => {
  observer.observe(element);
});

// ============= TYPEWRITER EFFECT ============= //
const words = [
  'Developer',
  'CSE Undergrad',
  'Problem Solver',
  'ML Enthusiast',
  'UI/UX Designer',
  'AI Builder',
  'Full-Stack Dev',
  'Entrepreneur'
];

const typewriterElement = document.getElementById('typewriter');
let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;

const TYPE_SPEED = 90;
const DELETE_SPEED = 55;
const PAUSE_DURATION = 1500;

function typeWriter() {
  const currentWord = words[wordIndex];
  
  if (isDeleting) {
    // Deleting characters
    typewriterElement.textContent = currentWord.slice(0, charIndex);
    charIndex--;
    
    if (charIndex < 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      setTimeout(typeWriter, TYPE_SPEED);
    } else {
      setTimeout(typeWriter, DELETE_SPEED);
    }
  } else {
    // Typing characters
    typewriterElement.textContent = currentWord.slice(0, charIndex + 1);
    charIndex++;
    
    if (charIndex === currentWord.length) {
      isDeleting = true;
      setTimeout(typeWriter, PAUSE_DURATION);
    } else {
      setTimeout(typeWriter, TYPE_SPEED);
    }
  }
}

// Start typewriter effect
typeWriter();

// ============= SMOOTH SCROLL ============= //
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    
    if (targetId === '#') return;
    
    const targetElement = document.querySelector(targetId);
    
    if (targetElement) {
      const navHeight = document.querySelector('.nav').offsetHeight;
      const targetPosition = targetElement.offsetTop - navHeight - 20;
      
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// ============= NAVBAR BACKGROUND ON SCROLL ============= //
const nav = document.querySelector('.nav');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;
  
  if (currentScroll > 100) {
    nav.style.background = 'rgba(10, 11, 13, 0.85)';
    nav.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.3)';
  } else {
    nav.style.background = 'rgba(10, 11, 13, 0.75)';
    nav.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
  }
  
  lastScroll = currentScroll;
});

// ============= FLOATING ANIMATION FOR CARDS ============= //
const floatingCards = document.querySelectorAll('.floating-card');

floatingCards.forEach((card, index) => {
  card.style.animationDelay = `${index * 1.5}s`;
});

// ============= PERFORMANCE OPTIMIZATION ============= //
// Lazy load videos when they come into viewport
const videos = document.querySelectorAll('video');
const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const video = entry.target;
      video.load();
      videoObserver.unobserve(video);
    }
  });
}, { rootMargin: '200px' });

videos.forEach(video => {
  videoObserver.observe(video);
});

// ============= CONSOLE MESSAGE ============= //
console.log('%c👋 Hey there!', 'color: #00D9A3; font-size: 20px; font-weight: bold;');
console.log('%cInterested in the code? Check out the source!', 'color: #9BA1A6; font-size: 14px;');
console.log('%cPranav.dev © 2025', 'color: #00D9A3; font-size: 12px;');
