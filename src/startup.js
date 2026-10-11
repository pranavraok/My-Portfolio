// The HTML splash is present before React and the avatar download begin.
export function updateStartup(progress, caption = "Loading my workspace") {
  const splash = document.getElementById('startup-screen');
  if (!splash || splash.dataset.ready === 'true') return;
  const value = Math.max(0, Math.min(100, Math.round(progress)));
  splash.style.setProperty('--load-progress', `${value}%`);
  splash.dataset.progress = String(value);
  const label = splash.querySelector('.startup-caption');
  if (label) label.textContent = `${caption} · ${value}%`;
}

export function finishStartup(){
  const splash=document.getElementById('startup-screen');
  if(!splash||splash.dataset.ready==='true')return;
  updateStartup(100, "Ready");
  splash.dataset.ready='true';
  clearTimeout(window.portfolioStartupTimer);
  splash.setAttribute('aria-hidden','true');
  document.getElementById('root')?.removeAttribute('inert');
  document.body.classList.remove('is-loading');
  const remove=()=>splash.remove();
  splash.addEventListener('transitionend',remove,{once:true});
  setTimeout(remove,450);
}
