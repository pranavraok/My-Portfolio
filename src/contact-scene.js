import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createCharacter } from "./character.js";

export function createContactScene(host, getProgress) {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 40);
  const maps = new Set(), materials = new Map();
  const mat = (color, options = {}) => {
    const key = color + JSON.stringify(options);
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: .82, ...options }));
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
  const person = createCharacter({ mesh, mat, box, ball, cylinder, rod, texture, panel });
  scene.add(person.root);
  person.root.position.set(0, .02, .35);
  person.root.traverse(o => { if (o.isMesh) o.receiveShadow = false; });
  scene.add(new THREE.HemisphereLight("#fff9ed", "#8eaa91", 2.5));
  const light = new THREE.DirectionalLight("#fff2dc", 3.3);
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
  let width = 0, height = 0, mobile = false, visible = false, frame, last = 0;
  const pointer = {x:0,y:0}, followPointer = {x:0,y:0};
  let sleep = 1, wakeAt = -100, hasWoken = false;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const resize = () => {
    const rect = host.getBoundingClientRect(); width = rect.width; height = rect.height;
    if(!width || !height) return;
    mobile = width <= 600 || width / height < 1;
    packages.scale.setScalar(mobile ? .48 : 1);
    packages.position.x = mobile ? -.03 : 0;
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.35 : 1.7)); renderer.setSize(width,height);
    camera.aspect = width / height; camera.updateProjectionMatrix();
  };
  const sizeObserver = new ResizeObserver(resize); sizeObserver.observe(host); resize();
  const visibleObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }); visibleObserver.observe(host);
  const move = event => { if(mobile) return; const r = host.getBoundingClientRect(); pointer.x = (event.clientX-r.left)/r.width*2-1; pointer.y = (event.clientY-r.top)/r.height*2-1; };
  window.addEventListener("pointermove",move,{passive:true});
  const smooth = (a,b,v) => { const p = THREE.MathUtils.clamp((v-a)/(b-a),0,1); return p*p*p*(p*(p*6-15)+10); };
  function tick(time) {
    frame = requestAnimationFrame(tick);
    if(!visible || document.hidden || time-last < 20) return;
    const delta=Math.min(.05,(time-last)/1000 || 1/60); last=time;
    const t=time/1000, data=getProgress() || {};
    sleep=THREE.MathUtils.lerp(sleep,data.sleep ?? 1,reduced.matches ? 1 : 1-Math.exp(-delta*7));
    if(sleep>.85) hasWoken=false;
    if(!hasWoken && sleep<.35) {wakeAt=t;hasWoken=true;}
    const since=t-Math.max(data.waveAt ?? -100,wakeAt+.28);
    const greeting=reduced.matches ? 0 : (1-smooth(2.15,3.05,since))*smooth(0,.55,since)*(1-sleep);
    const wakeTime=t-wakeAt;
    const stretch=reduced.matches ? 0 : smooth(0,.3,wakeTime)*(1-smooth(.45,1.05,wakeTime))*(1-sleep);
    person.pose(1);
    person.restPose?.(sleep,t);
    person.portraitPose?.((1-sleep)*(1-greeting)*(1-stretch));
    person.arms.forEach((arm,i)=>{
      arm.rotation.x-=stretch*.22;
      arm.rotation.z+=(i===0 ? -.12 : .12)*stretch;
    });
    if(!reduced.matches) person.greetPose?.(greeting,t);
    if(!reduced.matches) {
      const gaze=1-Math.exp(-delta*3.5);
      followPointer.x=THREE.MathUtils.lerp(followPointer.x,pointer.x,gaze);
      followPointer.y=THREE.MathUtils.lerp(followPointer.y,pointer.y,gaze);
      person.head.rotation.y=(1-sleep)*(Math.sin(t*.45)*.045+followPointer.x*.11);
      person.head.rotation.x+=(1-sleep)*(Math.sin(t*.9)*.025+followPointer.y*.035);
      person.head.rotation.z+=(1-sleep)*Math.sin(t*.63)*.018;
      person.body.scale.y=1+Math.sin(t*1.45)*.0025;
    }
    person.root.rotation.y = -.035 + (reduced.matches ? 0 : followPointer.x*.06);
    if(mobile) { camera.position.set(.2,3.2,10.4); camera.lookAt(0,2.5,.35); }
    else { camera.position.set(.4,3.35,9.6); camera.lookAt(0,2.5,.25); }
    camera.clearViewOffset();
    host.dataset.sleep=sleep.toFixed(2); host.dataset.greeting=greeting.toFixed(2);host.dataset.glasses='worn';
    host.dataset.pose=sleep>.65 ? 'dozing' : stretch>.2 ? 'waking' : greeting>.1 ? 'greeting' : 'relaxed';
    renderer.render(scene,camera);
  }
  frame=requestAnimationFrame(tick);
  return { dispose() {
    cancelAnimationFrame(frame); sizeObserver.disconnect(); visibleObserver.disconnect(); window.removeEventListener("pointermove",move);
    const geometry=new Set(), material=new Set(), skeletons=new Set();
    scene.traverse(o => { if(o.geometry)geometry.add(o.geometry); if(o.isSkinnedMesh)skeletons.add(o.skeleton); if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>material.add(m)); });
    skeletons.forEach(s=>s.dispose()); geometry.forEach(g=>g.dispose()); material.forEach(m=>m.dispose()); maps.forEach(m=>m.dispose()); renderer.dispose(); renderer.domElement.remove();
  }};
}
