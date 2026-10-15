import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { batchStaticMeshes } from '../src/static-meshes.js';
import { startSceneLoop } from '../src/scene-loop.js';
import { advanceScrollPage } from '../src/scroll-motion.js';

test('static batching preserves world bounds, material and shadow settings around moving props',()=>{
  const root=new THREE.Group();root.position.set(2,3,-1);root.rotation.y=.35;
  const material=new THREE.MeshStandardMaterial({color:'#466352'});
  for(let i=0;i<8;i++){
    const group=new THREE.Group();group.position.set(i*.4,0,0);group.rotation.z=i*.1;root.add(group);
    const part=new THREE.Mesh(new THREE.BoxGeometry(.2,.3,.4),material);
    part.position.y=.3;part.castShadow=part.receiveShadow=true;group.add(part);
  }
  const seat=new THREE.Group();root.add(seat);
  const movingPart=new THREE.Mesh(new THREE.BoxGeometry(.5,.2,.5),material);seat.add(movingPart);
  const before=new THREE.Box3().setFromObject(root);
  const meshCount=()=>{let count=0;root.traverse(o=>{if(o.isMesh)count++;});return count;};
  assert.equal(meshCount(),9);
  batchStaticMeshes(root,[seat]);
  assert.equal(meshCount(),2);
  assert.equal(movingPart.parent,seat);
  const after=new THREE.Box3().setFromObject(root);
  assert.ok(before.min.distanceTo(after.min)<1e-6);
  assert.ok(before.max.distanceTo(after.max)<1e-6);
  const batch=root.children.find(o=>o.isMesh);
  assert.equal(batch.material,material);
  assert.equal(batch.castShadow,true);assert.equal(batch.receiveShadow,true);
  seat.rotation.y=1;seat.updateMatrixWorld(true);
  assert.equal(movingPart.parent,seat);
});

test('scene loop sleeps offscreen, resumes once, handles hidden tabs and cleans up',()=>{
  const saved={document:globalThis.document,IntersectionObserver:globalThis.IntersectionObserver,requestAnimationFrame:globalThis.requestAnimationFrame,cancelAnimationFrame:globalThis.cancelAnimationFrame};
  const callbacks=new Map(),listeners=new Map();let next=0,intersection,disconnected=false,draws=0;
  globalThis.document={hidden:false,addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
  globalThis.requestAnimationFrame=fn=>{callbacks.set(++next,fn);return next;};
  globalThis.cancelAnimationFrame=id=>callbacks.delete(id);
  globalThis.IntersectionObserver=class{constructor(fn){intersection=fn;}observe(){}disconnect(){disconnected=true;}};
  const frame=()=>{const [id,fn]=callbacks.entries().next().value;callbacks.delete(id);fn(next*16.7);};
  try{
    const stop=startSceneLoop({},()=>draws++);
    frame();assert.equal(draws,1);assert.equal(callbacks.size,0);
    intersection([{isIntersecting:true}]);intersection([{isIntersecting:true}]);
    assert.equal(callbacks.size,1);frame();assert.equal(draws,2);
    intersection([{isIntersecting:false}]);assert.equal(callbacks.size,0);
    intersection([{isIntersecting:true}]);assert.equal(callbacks.size,1);
    document.hidden=true;listeners.get('visibilitychange')();assert.equal(callbacks.size,0);
    document.hidden=false;listeners.get('visibilitychange')();frame();assert.equal(draws,3);
    stop();assert.equal(callbacks.size,0);assert.equal(listeners.size,0);assert.equal(disconnected,true);
  } finally{
    for(const [key,value] of Object.entries(saved)){
      if(value===undefined)delete globalThis[key];else globalThis[key]=value;
    }
  }
});

test('short scroll gestures settle promptly without overshooting chair poses in either direction',()=>{
  for(const [start,target] of [[.2,.38],[.38,.2],[0,.9],[.9,0],[.5,2.7],[2.7,.5]]){
    let page=start;
    for(let frame=0;frame<90;frame++){
      const next=advanceScrollPage(page,target,1000/60);
      assert.ok(next>=Math.min(start,target)&&next<=Math.max(start,target));
      assert.ok(Math.abs(target-next)<=Math.abs(target-page));page=next;
    }
    assert.ok(Math.abs(page-target)<.002,`${start} → ${target}: ${page}`);
  }
});
