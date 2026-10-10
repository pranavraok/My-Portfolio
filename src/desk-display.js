// A calm code editor: the camera moves, while the monitor stays a coding desk.
export function drawDeskCode(ctx,w,h,time=0) {
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#19212e';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#111824';ctx.fillRect(0,0,31,h);ctx.fillRect(31,0,w-31,30);
  ctx.fillStyle='#273342';ctx.fillRect(31,0,123,30);
  ctx.font='11px monospace';ctx.fillStyle='#bacbd7';ctx.fillText('App.tsx',51,20);
  ctx.fillStyle='#6c8597';ctx.fillText('avatar.ts',175,20);
  ['#ef7b83','#e6c885','#97c9b2'].forEach((color,index)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(w-50+index*14,15,3,0,Math.PI*2);ctx.fill();});
  for(let i=0;i<5;i++){ctx.strokeStyle=i===0?'#8ed3bc':'#526374';ctx.lineWidth=2;ctx.strokeRect(9,45+i*35,12,14);}
  const lines=[
    "import { useState } from 'react';",
    "import { Portfolio } from './Portfolio';",
    '',
    'export default function Pranav() {',
    '  const [music, setMusic] = useState(false);',
    '',
    '  return (',
    '    <Portfolio',
    '      name="Pranav Rao K"',
    '      stack={["React", "Python", "AI"]}',
    '      onReady={() => setMusic(true)}',
    '    />',
    '  );',
    '}',
  ];
  const liveLine="// Building something good, one detail at a time.";
  const step=Math.floor(time*9)%(liveLine.length+45);
  lines.push('',liveLine.slice(0,Math.min(step,liveLine.length)));
  ctx.font='11px monospace';
  lines.forEach((line,index)=>{
    const y=48+index*13;
    ctx.fillStyle='#576d81';ctx.fillText(String(index+1).padStart(2,' '),38,y);
    ctx.fillStyle=line.trim().startsWith('//') ? '#7c9b85' : /import|export|return/.test(line) ? '#be9be8' : /const|onReady|stack/.test(line) ? '#7bbace' : '#d6d2c2';
    ctx.fillText(line,65,y);
  });
  if(Math.floor(time*2)%2===0){ctx.fillStyle='#b8dbc9';ctx.fillRect(65+ctx.measureText(lines[15]).width,48+15*13-9,1.5,11);}
  ctx.fillStyle='#121b26';ctx.fillRect(31,257,w-31,45);
  ctx.fillStyle='#769a89';ctx.font='10px monospace';ctx.fillText('TERMINAL',45,271);ctx.fillStyle='#a3cfb2';ctx.fillText('✓ ready    › npm run dev',45,289);
  ctx.fillStyle='#2e6855';ctx.fillRect(0,h-18,w,18);ctx.fillStyle='#d5e4dc';ctx.font='9px monospace';ctx.fillText('main  ✓',13,h-6);ctx.fillText('TypeScript React     UTF-8     Ln 16',w-228,h-6);
}
