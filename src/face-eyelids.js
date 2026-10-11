import * as THREE from 'three';

// Eye coordinates belong to the approved head's original glTF space. The
// eyelids shade its existing curved eye surfaces inside the glasses frames.
export function addEyelidAnimation(model){
  const closure={value:0},skin={value:new THREE.Color('#dbb393')},crease={value:new THREE.Color('#725239')};
  model.traverse(object=>{
    if(!object.isMesh)return;
    for(const material of Array.isArray(object.material)?object.material:[object.material]){
      material.onBeforeCompile=shader=>{
        shader.uniforms.uEyeClose=closure;
        shader.uniforms.uLidSkin=skin;
        shader.uniforms.uLidCrease=crease;
        shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vLidPosition;\nvarying vec3 vLidSmoothNormal;').replace('#include <begin_vertex>','#include <begin_vertex>\nvLidPosition = position;\nvLidSmoothNormal = normalize(normalMatrix * vec3((position.x+.035)*1.2,.035,1.0));');
        shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
          varying vec3 vLidPosition;
          varying vec3 vLidSmoothNormal;
          uniform float uEyeClose;
          uniform vec3 uLidSkin;
          uniform vec3 uLidCrease;
          vec3 closeEye(vec3 original, vec2 center, vec2 radius, float frontLimit, out float coverage){
            vec2 p=(vLidPosition.xy-center)/radius;
            float shape=sqrt(max(0.0,1.0-p.x*p.x));
            float region=(1.0-smoothstep(.88,1.02,length(p)))*(1.0-smoothstep(frontLimit-.006,frontLimit,vLidPosition.z))*smoothstep(.18,.23,vLidPosition.z);
            float seam=center.y-.013-.008*shape;
            float upper=mix(center.y+radius.y*shape,seam,uEyeClose);
            float lower=mix(center.y-radius.y*shape,seam,uEyeClose);
            float cover=clamp(smoothstep(upper-.002,upper+.002,vLidPosition.y)+1.0-smoothstep(lower-.002,lower+.002,vLidPosition.y),0.0,1.0)*region;
            coverage=cover;
            float edge=exp(-pow((vLidPosition.y-upper)/.0032,2.0))*smoothstep(.20,.55,uEyeClose)*region;
            vec3 lid=uLidSkin*(1.0+.012*sin(vLidPosition.x*89.0+vLidPosition.y*53.0));
            return mix(mix(original,lid,cover),uLidCrease,edge*.70);
          }
        `).replace('#include <color_fragment>',`#include <color_fragment>
          float lidCoverage=0.0;
          if(uEyeClose>.0001){
            float leftLid=0.0,rightLid=0.0;
            diffuseColor.rgb=closeEye(diffuseColor.rgb,vec2(-.214,.490),vec2(.112,.076),.45,leftLid);
            diffuseColor.rgb=closeEye(diffuseColor.rgb,vec2(.114,.466),vec2(.105,.074),.45,rightLid);
            lidCoverage=max(leftLid,rightLid);
          }
        `).replace('#include <normal_fragment_maps>',`vec3 lidSurfaceNormal=normalize(vLidSmoothNormal);
          #include <normal_fragment_maps>
          normal=normalize(mix(normal,lidSurfaceNormal,lidCoverage));
        `).replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
          roughnessFactor=mix(roughnessFactor,.84,lidCoverage);
        `);
      };
      material.customProgramCacheKey=()=> 'pranav-footer-eyelids-v1';
      material.needsUpdate=true;
    }
  });
  return amount=>{closure.value=THREE.MathUtils.clamp(Number.isFinite(amount)?amount:0,0,1);return closure.value;};
}
