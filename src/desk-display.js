const ease = value => { const t = Math.max(0,Math.min(1,value)); return t*t*t*(t*(t*6-15)+10); };

// A live miniature of Pranav's site on the desk, rather than a static screenshot.
export function drawDeskWebsite(ctx,w,h,time=0) {
  const cycle = (time % 28)/28;
  const travel = cycle < .12 ? 0 : cycle < .44 ? ease((cycle-.12)/.32) : cycle < .58 ? 1 : cycle < .9 ? 1-ease((cycle-.58)/.32) : 0;
  const scroll = travel*435;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#f3f0e8'; ctx.fillRect(0,0,w,h);
  ctx.save(); ctx.beginPath(); ctx.rect(0,30,w,h-30); ctx.clip(); ctx.translate(0,30-scroll);
  ctx.fillStyle='#dce9e1'; ctx.fillRect(0,0,w,218);
  ctx.fillStyle='#183f32'; ctx.font='bold 43px sans-serif';
  ctx.fillText('Pranav',29,82); ctx.fillText('Rao K',29,127);
  ctx.fillStyle='#e85a62'; ctx.fillRect(30,145,192,23);
  ctx.fillStyle='#fff6e9'; ctx.font='bold 10px sans-serif'; ctx.fillText('DEVELOPER & ML ENGINEER',39,160);
  ctx.save(); ctx.translate(w*.77,98); ctx.rotate(Math.sin(time*.5)*.025);
  ctx.fillStyle='#ed5760'; ctx.beginPath(); ctx.roundRect(-31,35,62,66,16); ctx.fill();
  ctx.fillStyle='#c38a66'; ctx.beginPath(); ctx.ellipse(0,0,47,47,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#252527'; ctx.beginPath(); ctx.ellipse(0,-27,45,28,-.05,0,Math.PI*2); ctx.fill();
  for(let i=0;i<8;i++){ctx.beginPath();ctx.arc(-30+i*9,-40-Math.sin(i*1.7)*6,10,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#151e24'; ctx.beginPath(); ctx.roundRect(-40,-13,36,23,6); ctx.roundRect(4,-13,36,23,6); ctx.fill(); ctx.fillRect(-5,-8,10,4);
  ctx.strokeStyle='#754b3c';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,10,16,.3,Math.PI-.3);ctx.stroke();
  ctx.restore();
  ctx.fillStyle='#214e3c';ctx.font='bold 29px sans-serif';ctx.fillText('Selected projects.',29,269);
  const cards=[['Mentora','Learning, reimagined.','#cab9ec'],['NutriGo','A healthier everyday.','#b9d6a4'],['TradeLedger','Find your trading rhythm.','#efc19c']];
  cards.forEach(([title,detail,color],i)=>{
    const y=291+i*93;ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(28,y,w-56,79,10);ctx.fill();
    ctx.fillStyle='#1c3c31';ctx.font='bold 20px sans-serif';ctx.fillText(title,46,y+33);ctx.font='11px sans-serif';ctx.fillText(detail,46,y+53);
    ctx.fillStyle='#ffffff95';ctx.beginPath();ctx.roundRect(w-129,y+13,70,52,6);ctx.fill();
    ctx.fillStyle=color;ctx.fillRect(w-115,y+25,40,6);ctx.fillRect(w-115,y+38,27,5);ctx.fillRect(w-115,y+48,33,5);
  });
  ctx.fillStyle='#dce6db';ctx.fillRect(0,591,w,180);ctx.fillStyle='#244739';ctx.font='bold 27px sans-serif';ctx.fillText('Let’s work together!',28,647);
  ctx.font='12px sans-serif';ctx.fillText('pranavraok18@gmail.com',29,678);
  ctx.restore();
  ctx.fillStyle='#e9eee5';ctx.fillRect(0,0,w,30);ctx.fillStyle='#264d3d';ctx.font='bold 12px sans-serif';ctx.fillText('PR',15,20);
  ctx.font='9px sans-serif';ctx.fillText('ABOUT     PROJECTS     CONTACT',w-205,19);
  ctx.fillStyle='#eb6b71';ctx.beginPath();ctx.arc(w-17,15,5,0,Math.PI*2);ctx.fill();
}
