import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createCharacter } from "./character.js";
import { loadApprovedHead } from "./approved-avatar.js";
import { footerGreeting,desktopFooterGreeting,desktopFooterAwake,footerSleepRequest } from "./footer-motion.js";
import { watchSceneContext } from "./scene-context.js";

export async function createContactScene(host, getProgress) {
  await loadApprovedHead();
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .98;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const graphics=watchSceneContext(renderer,host);
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 40);
  const maps = new Set(), materials = new Map();
  const mat = (color, options = {}) => {
    const key = color + JSON.stringify(options);
    if (!materials.has(key)) materials.set(key, new (options.sheen ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial)({ color, roughness: .82, ...options }));
    return materials.get(key);
  };
  function mesh(geometry, material, parent, pos = [0, 0, 0], scale = [1, 1, 1]) {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(...pos); item.scale.set(...scale);
    item.castShadow = true; item.receiveShadow = true; parent.add(item);
    return item;
  }
  const box = (size, color, parent, pos, radius = .04) => mesh(new RoundedBoxGeometry(...size, 3, Math.min(radius, ...size.map(v => v / 2))), mat(color), parent, pos);
  const ball = (size, color, parent, pos) => mesh(new THREE.SphereGeometry(1, 24, 16), mat(color), parent, pos, size);
  const cylinder = (rt, rb, h, color, parent, pos) => mesh(new THREE.CylinderGeometry(rt, rb, h, 32), mat(color), parent, pos);
  const rod = (a, b, radius, color, parent) => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const item = cylinder(radius, radius, start.distanceTo(end), color, parent, start.clone().add(end).multiplyScalar(.5).toArray());
    item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize()); return item;
  };
  const texture = (draw, w = 512, h = 320) => {
    const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
    draw(canvas.getContext("2d"), w, h);
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; maps.add(map); return map;
  };
  const panel = (size, map, parent, pos) => mesh(new THREE.PlaneGeometry(...size), new THREE.MeshBasicMaterial({ map, transparent: true }), parent, pos);
  const person = await createCharacter({ mesh, mat, box, ball, cylinder, rod, texture, panel,animateEyes:true });
  scene.add(person.root);
  person.root.position.set(0, -.012, .35);
  person.root.traverse(o => { if (o.isMesh) o.receiveShadow = false; });
  scene.add(new THREE.HemisphereLight("#fff9ed", "#8eaa91", 1.35));
  const light = new THREE.DirectionalLight("#fff2dc", 1.8);
  light.position.set(-3, 7, 7); light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  Object.assign(light.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 });
  light.shadow.normalBias = .025; scene.add(light);
  const fill = new THREE.DirectionalLight("#d1e6dc", 1); fill.position.set(4, 3, -4); scene.add(fill);
  const floor = mesh(new THREE.PlaneGeometry(15, 10), new THREE.ShadowMaterial({ opacity: .13 }), scene, [0, -.012, 0]);
  floor.rotation.x = -Math.PI / 2;
  const packages = new THREE.Group(); scene.add(packages);
  function parcel(size, position, angle = 0) {
    const item = new THREE.Group(); item.position.set(...position); item.rotation.y = angle; packages.add(item);
    box(size, "#cfbfa7", item, [0, size[1] / 2, 0], .035);
    box([size[0] * .18, .012, size[2] + .015], "#bfa88b", item, [0, size[1] + .004, 0], .003);
    box([size[0] * .18, size[1] * .25, .014], "#bfa88b", item, [0, size[1] * .875, size[2] / 2 + .008], .003);
    box([.2, .12, .014], "#f2ecdf", item, [size[0] * .28, size[1] * .65, size[2] / 2 + .01], .003);
    for(let i = 0; i < 3; i++) box([.085 - i * .02, .006, .003], "#998d79", item, [size[0] * .28 - .03, size[1] * .68 - i * .022, size[2] / 2 + .02], .001);
    return item;
  }
  parcel([1.48, .86, 1.1], [-2.18, 0, -.62], .12);
  parcel([1.04, .65, .82], [-2.23, .87, -.65], -.05);
  parcel([.8, .65, .8], [-1.03, 0, -.25], -.12);
  parcel([.7, .55, .73], [-1.5, 0, .3], .06);
  parcel([1.24, .73, .96], [-2.7, 0, .22], .19);
  const envelopeMap = texture((ctx, w, h) => {
    ctx.fillStyle = "#f3f0e6"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#c8cbbf"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w / 2, h * .58); ctx.lineTo(w, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(w * .36, h * .43); ctx.moveTo(w, h); ctx.lineTo(w * .64, h * .43); ctx.stroke();
  });
  for(const [x,z,a] of [[-1.8,1.1,.35],[-.65,.65,-.3],[-1.6,.62,.2],[-2,1.62,-.16],[-1,1.65,-.2],[-2.3,.65,.45]]) {
    const envelope = panel([.58,.35], envelopeMap, packages,[x,.018,z]); envelope.rotation.set(-Math.PI / 2,0,a);
  }
  const parcelCenter=new THREE.Box3().setFromObject(packages).getCenter(new THREE.Vector3());
  let width = 0, height = 0, mobile = false, frame, last = 0;
  const contactStage=host.closest('.contact-stage')||host;
  const pointer = {x:0,y:0}, followPointer = {x:0,y:0};
  let sleep = 1, wakeAt = -100, waveAt = -100, lastWaveRequest=-100, hasWoken = false,waveBlend=0,unfoldBlend=0;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const resize = () => {
    const rect = host.getBoundingClientRect(); width = rect.width; height = rect.height;
    if(!width || !height) return;
    mobile = width <= 600 || width / height < 1;
    const parcelScale=mobile ? .48 : Math.min(.98,(width/height)*.52);
    packages.scale.setScalar(parcelScale);
    const halfWidth=Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*(8.5-.35)*width/height;
    packages.position.x = mobile ? -.03 : halfWidth*.59-parcelCenter.x*parcelScale;
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.35 : 1.7)); renderer.setSize(width,height);
    camera.aspect = width / height; camera.updateProjectionMatrix();
  };
  const sizeObserver = new ResizeObserver(resize); sizeObserver.observe(host); resize();
  const move = event => { if(mobile) return; const r = host.getBoundingClientRect(); pointer.x = (event.clientX-r.left)/r.width*2-1; pointer.y = (event.clientY-r.top)/r.height*2-1; };
  window.addEventListener("pointermove",move,{passive:true});
  const resetPointer=()=>{pointer.x=0;pointer.y=0;};
  document.addEventListener('pointerleave',resetPointer);window.addEventListener('blur',resetPointer);
  let firstFrame=false,resolveReady,animationTime=0;
  const ready=new Promise(resolve=>{resolveReady=resolve;});
  function tick(time) {
    frame = requestAnimationFrame(tick);
    const bounds=host.getBoundingClientRect(),viewport=host.ownerDocument.documentElement.clientHeight;
    const visible=bounds.bottom>0&&bounds.top<viewport&&bounds.width>0;
    host.dataset.inView=String(visible);
    if(graphics.lost || (firstFrame&&(!visible||document.hidden)) || time-last < 14) return;
    const delta=Math.min(.05,(time-last)/1000 || 1/60); last=time;
    const t=(animationTime+=delta), data=getProgress() || {};
    const stageTop=contactStage.getBoundingClientRect().top;
    const manualHold=data.manualTop!=null&&Math.abs(stageTop-data.manualTop)<4;
    if(data.manualTop!=null&&!manualHold)data.manualTop=null;
    const requestedSleep=manualHold?0:footerSleepRequest(stageTop,contactStage.clientHeight,viewport);
    const wakeOnEntry=mobile ? (hasWoken?requestedSleep<=.9:requestedSleep<.30) : manualHold||desktopFooterAwake(stageTop,viewport,hasWoken);
    const manualWave=(data.waveAt ?? -100)>lastWaveRequest;
    if(manualWave){
      lastWaveRequest=data.waveAt;waveAt=t;
      if(!hasWoken||sleep>.35)wakeAt=t;
      hasWoken=true;
    } else if(hasWoken&&!wakeOnEntry){hasWoken=false;waveAt=-100;}
    else if(!hasWoken&&wakeOnEntry){
      wakeAt=t;
      waveAt=wakeAt;hasWoken=true;
    }
    // Once the footer is revealed, finish waking even if scrolling stops.
    // A separate return threshold prevents tiny swipes from restarting it.
    const sleepTarget=hasWoken&&t>=wakeAt?0:1;
    const sleepStep=(sleepTarget-sleep)*(1-Math.exp(-delta*3.2));
    sleep=reduced.matches?sleepTarget:sleep+THREE.MathUtils.clamp(sleepStep,-delta*(mobile?.65:.72),delta*.45);
    const since=t-waveAt,movement=(mobile?footerGreeting:desktopFooterGreeting)(since,sleep);
    const settle=1-Math.exp(-delta*12);
    waveBlend=reduced.matches?0:THREE.MathUtils.lerp(waveBlend,movement.wave,settle);
    unfoldBlend=reduced.matches?0:THREE.MathUtils.lerp(unfoldBlend,movement.unfold,settle);
    const greeting=waveBlend;
    const stretch=reduced.matches?0:movement.stretch;
    person.pose(1);
    person.restPose?.(sleep,reduced.matches?0:t);
    // Folded arms remain quiet during sleep. Release them before lifting
    // the greeting arm, then fold them again only after the hand lowers.
    person.portraitPose?.(1-unfoldBlend);
    person.arms.forEach((arm,i)=>{
      arm.rotation.x-=stretch*.07;
      arm.rotation.z+=(i===0 ? -.025 : .025)*stretch;
    });
    if(!reduced.matches) person.greetPose?.(greeting,movement.waveTime,1,.12);
    if(!reduced.matches) {
      const gaze=1-Math.exp(-delta*3.5);
      followPointer.x=THREE.MathUtils.lerp(followPointer.x,pointer.x,gaze);
      followPointer.y=THREE.MathUtils.lerp(followPointer.y,pointer.y,gaze);
      person.head.rotation.y=(mobile?0:-.10*sleep)+(1-sleep)*(Math.sin(t*.45)*.045+followPointer.x*.11);
      person.head.rotation.x+=sleep*(mobile?.06:.12)+(1-sleep)*(Math.sin(t*.9)*.012+followPointer.y*.025);
      person.head.rotation.z+=sleep*(mobile?.08:-.10)+(1-sleep)*Math.sin(t*.63)*.009;
      person.body.scale.y=1+Math.sin(t*1.05)*(.0025+sleep*.0015);
    } else {
      person.body.scale.y=1;person.head.rotation.y=0;
    }
    person.root.rotation.y = -.035 + (reduced.matches ? 0 : followPointer.x*.06);
    const eyeHold=!mobile&&!reduced.matches&&t-wakeAt<3 ? desktopFooterGreeting(t-wakeAt,sleep).eyeHold : 0;
    const settlingBlink=movement.blink*(t-wakeAt<(mobile?2:3)?1:0);
    const eyelids=person.updateFace?.(reduced.matches?0:t,reduced.matches?0:Math.max(eyeHold,settlingBlink));
    if(mobile) { camera.position.set(.2,2.25,9.2); camera.lookAt(0,1.50,.35); }
    else { camera.position.set(0,2.55,8.5); camera.lookAt(0,1.73,.35); }
    camera.clearViewOffset();
    host.parentElement.style.setProperty('--sleep',sleep.toFixed(3));
    host.dataset.sleep=sleep.toFixed(2); host.dataset.greeting=greeting.toFixed(2);host.dataset.glasses='worn';
    host.dataset.motionTime=t.toFixed(3);host.dataset.exposure=requestedSleep.toFixed(3);
    const animationActive=!reduced.matches&&(movement.active||waveBlend>.001||unfoldBlend>.001);
    host.dataset.eyelids=eyelids.toFixed(3);host.dataset.animationActive=String(animationActive);
    host.dataset.layout=mobile?'mobile':'text-left-character-center-parcels-right';
    host.dataset.pose=sleep>.85 ? 'sleeping' : sleep>.15||stretch>.2 ? 'waking' : greeting>.1 ? 'greeting' : 'relaxed';
    const greetingButton=host.parentElement.querySelector('.character-greeting');
    if(greetingButton)greetingButton.disabled=animationActive;
    renderer.render(scene,camera);
    graphics.rendered();
    if(!firstFrame){firstFrame=true;host.dataset.frameReady='true';resolveReady();}
  }
  frame=requestAnimationFrame(tick);
  return {ready,dispose() {
    resolveReady();graphics.dispose();
    cancelAnimationFrame(frame); sizeObserver.disconnect(); window.removeEventListener("pointermove",move);document.removeEventListener('pointerleave',resetPointer);window.removeEventListener('blur',resetPointer);
    const geometry=new Set(), material=new Set(), skeletons=new Set();
    scene.traverse(o => { if(o.geometry)geometry.add(o.geometry); if(o.isSkinnedMesh)skeletons.add(o.skeleton); if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>material.add(m)); });
    const avatarMaps=new Set();material.forEach(m=>{for(const value of Object.values(m))if(value?.isTexture)avatarMaps.add(value);});avatarMaps.forEach(map=>map.dispose());
    skeletons.forEach(s=>s.dispose()); geometry.forEach(g=>g.dispose()); material.forEach(m=>m.dispose()); maps.forEach(m=>m.dispose()); renderer.dispose(); renderer.domElement.remove();
  }};
}
