import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Bake only explicitly static props. Moving chair parts, avatar bones, screen
// textures and the speaker retain their original objects and transforms.
export function batchStaticMeshes(root, excluded=[]) {
  const skip=new Set(excluded.filter(Boolean)), buckets=new Map();
  root.updateWorldMatrix(true,true);
  const inverse=root.matrixWorld.clone().invert();
  const visit=object=>{
    if(skip.has(object))return;
    if(object.isMesh&&!object.isSkinnedMesh&&!Array.isArray(object.material)&&!object.material.transparent&&!object.material.map){
      const geometry=object.geometry;
      const attributes=Object.keys(geometry.attributes).sort().map(key=>`${key}:${geometry.attributes[key].itemSize}`).join(',');
      const key=`${object.material.uuid}/${object.castShadow}/${object.receiveShadow}/${attributes}`;
      if(!buckets.has(key))buckets.set(key,[]);
      buckets.get(key).push(object);
    }
    object.children.forEach(visit);
  };
  root.children.forEach(visit);
  for(const meshes of buckets.values()){
    if(meshes.length<2)continue;
    const geometries=meshes.map(mesh=>{
      const geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
      return geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld));
    });
    const merged=mergeGeometries(geometries);
    geometries.forEach(geometry=>geometry.dispose());
    if(!merged)continue;
    merged.computeBoundingSphere();
    const batch=new THREE.Mesh(merged,meshes[0].material);
    batch.castShadow=meshes[0].castShadow;batch.receiveShadow=meshes[0].receiveShadow;
    root.add(batch);
    for(const mesh of meshes){mesh.removeFromParent();mesh.geometry.dispose();}
  }
}
