const code=[
  "import { useEffect, useState } from 'react';",
  "import { HeroScene } from './HeroScene';",
  "import { Radio } from './Radio';",
  '',
  'const profile = {',
  "  name: 'Pranav Rao K',",
  "  role: 'Developer & Product Builder',",
  "  location: 'Bengaluru, India',",
  '};',
  '',
  'export function Portfolio() {',
  '  const [ready, setReady] = useState(false);',
  '  const [music, setMusic] = useState(true);',
  '',
  '  useEffect(() => {',
  '    const controller = new AbortController();',
  '    loadWorkspace(controller.signal)',
  '      .then(() => setReady(true));',
  '    return () => controller.abort();',
  '  }, []);',
  '',
  '  return (',
  '    <main className="portfolio">',
  '      <HeroScene',
  '        profile={profile}',
  '        ready={ready}',
  '        onWave={() => sayHello()}',
  '      />',
  '      <Radio',
  '        playing={music}',
  '        onPause={() => setMusic(false)}',
  '      />',
  '    </main>',
  '  );',
  '}',
  '',
  'async function loadWorkspace(signal) {',
  '  const assets = await Promise.all([',
  '    loadCharacter({ signal }),',
  '    loadEnvironment({ signal }),',
  '    warmUpMaterials(),',
  '  ]);',
  '  return assets;',
  '}',
  '',
  'function sayHello() {',
  "  console.log('A little curiosity.');",
  "  console.log('A little imagination.');",
  "  console.log('A useful product.');",
  '}',
  '',
  '// Design. Build. Refine. Repeat.',
];
export function deskCodeState(time,height=320) {
  const seconds=((time%36)+36)%36,progress=(1-Math.cos(seconds/36*Math.PI*2))/2;
  const scroll=progress*Math.max(0,code.length*13-(height-96));
  const row=Math.min(code.length-1,Math.floor(scroll/13)+7+Math.floor(seconds/1.5)%3);
  return {scroll,row,characters:Math.floor((seconds/1.5%1)*code[row].length),lineCount:code.length};
}
export function drawDeskCode(ctx,w,h,time=0) {
  const state=deskCodeState(time,h);
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#19212e';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#111824';ctx.fillRect(0,0,31,h);ctx.fillRect(31,0,w-31,30);
  ctx.fillStyle='#273342';ctx.fillRect(31,0,123,30);ctx.font='11px monospace';ctx.fillStyle='#bacbd7';ctx.fillText('App.tsx',51,20);
  ctx.fillStyle='#6c8597';ctx.fillText('hero.ts',175,20);
  ['#ef7b83','#e6c885','#97c9b2'].forEach((color,i)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(w-50+i*14,15,3,0,Math.PI*2);ctx.fill();});
  for(let i=0;i<5;i++){ctx.strokeStyle=i===0?'#8ed3bc':'#526374';ctx.lineWidth=2;ctx.strokeRect(9,45+i*35,12,14);}
  ctx.save();ctx.beginPath();ctx.rect(31,31,w-31,h-96);ctx.clip();ctx.font='11px monospace';
  code.forEach((line,index)=>{
    const y=48+index*13-state.scroll;if(y<20||y>h-52)return;
    const visible=index===state.row?line.slice(0,state.characters):line;
    if(index===state.row){ctx.fillStyle='#29394a';ctx.fillRect(32,y-10,w-32,13);}
    ctx.fillStyle='#576d81';ctx.fillText(String(index+1).padStart(2,' '),38,y);
    ctx.fillStyle=line.trim().startsWith('//')?'#7c9b85':/import|export|return|function/.test(line)?'#be9be8':/const|onPause|profile/.test(line)?'#7bbace':'#d6d2c2';ctx.fillText(visible,65,y);
    if(index===state.row&&Math.floor(time*2)%2===0){ctx.fillStyle='#b8dbc9';ctx.fillRect(65+ctx.measureText(visible).width,y-9,1.5,11);}
  });ctx.restore();
  ctx.fillStyle='#121b26';ctx.fillRect(31,h-63,w-31,45);ctx.fillStyle='#769a89';ctx.font='10px monospace';ctx.fillText('TERMINAL',45,h-49);ctx.fillStyle='#a3cfb2';ctx.fillText('✓ ready    › npm run dev',45,h-31);
  ctx.fillStyle='#2e6855';ctx.fillRect(0,h-18,w,18);ctx.fillStyle='#d5e4dc';ctx.font='9px monospace';ctx.fillText('main  ✓',13,h-6);ctx.fillText(`TypeScript React    Ln ${state.row+1}`,w-194,h-6);
}
