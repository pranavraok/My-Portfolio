// The HTML splash is present before React and the avatar download begin.
export function finishStartup(){
  const splash=document.getElementById('startup-screen');
  if(!splash||splash.dataset.ready==='true')return;
  splash.dataset.ready='true';
  splash.setAttribute('aria-hidden','true');
  document.getElementById('root')?.removeAttribute('inert');
  document.body.classList.remove('is-loading');
  const remove=()=>splash.remove();
  splash.addEventListener('transitionend',remove,{once:true});
  setTimeout(remove,450);
}
