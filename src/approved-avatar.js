import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { addEyelidAnimation } from './face-eyelids.js';

export const AVATAR_SKIN='#e0bea0';
let headPromise;

export function loadApprovedHead(){
  if(!headPromise)headPromise=new GLTFLoader().loadAsync('/media/pranav-approved-head-fast.glb').then(gltf=>gltf.scene).catch(error=>{headPromise=null;throw error;});
  return headPromise;
}

// The face, hair, glasses and headphones are the approved Meshy geometry.
// Each renderer owns its clone so footer disposal cannot invalidate the hero.
export function createApprovedHead(head,template,{animateEyes=false}={}){
  if(!template)throw new Error('Approved avatar head has not loaded');
  const model=template.clone(true),textureCopies=new Map();
  model.name='pranav-approved-meshy-head';
  model.traverse(object=>{
    if(!object.isMesh)return;
    object.geometry=object.geometry.clone();
    const duplicate=material=>{
      const copy=material.clone();
      for(const property of ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap']){
        const source=material[property];if(!source)continue;
        if(!textureCopies.has(source)){const texture=source.clone();texture.needsUpdate=true;textureCopies.set(source,texture);}
        copy[property]=textureCopies.get(source);
      }
      copy.roughness=Math.max(copy.roughness,.72);copy.metalness=Math.min(copy.metalness,.06);
      return copy;
    };
    object.material=Array.isArray(object.material)?object.material.map(duplicate):duplicate(object.material);
    object.castShadow=true;object.receiveShadow=false;
  });
  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const scale=1.50/size.y;
  model.scale.multiplyScalar(scale);
  model.position.set(-center.x*scale,-bounds.min.y*scale-.08,-center.z*scale);
  head.add(model);
  const glasses=new THREE.Group(),headphones=new THREE.Group();
  // Compatibility handles stay hidden; actual accessories are attached in GLB.
  glasses.visible=false;headphones.visible=false;head.add(glasses,headphones);
  let faceMesh;model.traverse(object=>{if(object.isMesh&&!faceMesh)faceMesh=object;});
  const blinkPose=animateEyes?addEyelidAnimation(model):()=>0;
  const ease=(a,b,value)=>{const t=THREE.MathUtils.clamp((value-a)/(b-a),0,1);return t*t*t*(10+t*(-15+6*t));};
  const updateFace=(seconds=0,sleep=0,extraBlink=0)=>{
    const phase=((seconds%5.4)+5.4)%5.4;
    const blink=ease(4.60,4.71,phase)*(1-ease(4.78,4.97,phase));
    return blinkPose(Math.max(sleep,extraBlink,blink));
  };
  return {faceMesh,glasses,headphones,eyes:[],faceBounds:{height:size.y*scale},blinkPose,updateFace};
}
