// Mobile menu
const hamburger = document.getElementById('hamburger');
const menu = document.getElementById('menu');
hamburger.addEventListener('click', () => menu.classList.toggle('open'));
document.querySelectorAll('.nav-link').forEach(a =>
  a.addEventListener('click', () => menu.classList.remove('open'))
);

// Active link on scroll
const sections = [...document.querySelectorAll('header, section')];
const navLinks = document.querySelectorAll('.nav-link');
function setActive(){
  let current = sections[0];
  for(const sec of sections){
    const r = sec.getBoundingClientRect();
    if(r.top <= 120 && r.bottom >= 120){ current = sec; break; }
  }
  navLinks.forEach(l=>l.classList.remove('active'));
  const match = [...navLinks].find(l => l.getAttribute('href') === `#${current.id}`);
  if(match) match.classList.add('active');
}
window.addEventListener('scroll', setActive);
window.addEventListener('load', setActive);

// Reveal on scroll
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('show');
      io.unobserve(e.target);
    }
  })
},{threshold:.12});
document.querySelectorAll('.reveal, .card').forEach(el=>io.observe(el));

// Typewriter effect
const words = ['Developer','CSE Undergrad','Problem Solver','Machine Learning Enthusiast','UI/UX Designer','AI Agents/Automation Builder','Graphic Designer'];
const tw = document.getElementById('typewriter');
let wi=0, ci=0, dir=1; // typing
const TYPE=90, HOLD=1500, ERASE=55;

function loop(){
  const w = words[wi];
  tw.textContent = w.slice(0, ci);
  if(dir===1){
    if(ci < w.length){ ci++; setTimeout(loop, TYPE); }
    else { setTimeout(()=>{ dir=-1; setTimeout(loop, ERASE); }, HOLD); }
  } else {
    if(ci>0){ ci--; setTimeout(loop, ERASE); }
    else { dir=1; wi=(wi+1)%words.length; setTimeout(loop, TYPE); }
  }
}
loop();


