import * as THREE from "three";
import { createApprovedHead, AVATAR_SKIN } from "./approved-avatar.js";

const C = {
  skin: AVATAR_SKIN, skinShade: "#c69976", hair: "#202329",
  shirt: "#25282b", neckline: "#171a1d", jeans: "#202b39",
  shoe: "#db5360", sole: "#b63e49", frame: "#272d32",
};
const DOWN = new THREE.Vector3(0, -1, 0);
const UPPER_ARM=.51, FOREARM=.44, THIGH=.66, SHIN=.61, HIP_HEIGHT=1.43;
const HEAD_SCALE=.56, HEAD_HEIGHT=2.50;
const SHOULDER_HEIGHT=2.35, SHOULDER_OFFSET=.315;

// The body glides through the steps; each foot eases into and out of its plant.
export function walkPath(amount) {
  const phase = THREE.MathUtils.clamp(amount, 0, 1) * 4;
  const step = Math.min(3, Math.floor(phase));
  const raw=THREE.MathUtils.clamp(phase-step,0,1),fraction=raw*raw*raw*(10+raw*(-15+6*raw));
  const t=phase/4,advance=t*t*(3-2*t);
  return { step, fraction, advance };
}

/** Original stylized human hero, with a separate adult rig and wearable accessories. */
export function createAvatarBody({ mesh, mat, box, rod, texture, headTemplate, faceMap=null, faceUV={} }, seated = false) {
  faceMap=null; // This avatar is sculpted; photographic maps are intentionally unused.
  const root = new THREE.Group();
  root.name = "Pranav-hero";
  const body = new THREE.Group();
  body.name = "character-body";
  root.add(body);
  const head = new THREE.Group();
  head.name = "character-head";
  head.position.y = HEAD_HEIGHT;
  head.scale.setScalar(HEAD_SCALE);
  body.add(head);
  const arms = [], legs = [], skeletons = [], eyes = [];
  const mapping={left:-.988,right:.988,bottom:-.711,top:.825,...faceUV};
  const mappedUV=(x,y)=>[(x-mapping.left)/(mapping.right-mapping.left),(y-mapping.bottom)/(mapping.top-mapping.bottom)];
  const mappedSkin=mat(faceMap?"#ffffff":C.skin,{map:faceMap,roughness:.72});
  const unmappedSkin=mat(C.skin,{roughness:.76});
  const mappedGeometries=[];
  function mapGeometry(geometry){
    const position=geometry.attributes.position,uv=[];
    for(let i=0;i<position.count;i++)uv.push(...mappedUV(position.getX(i),position.getY(i)));
    geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));mappedGeometries.push(geometry);return geometry;
  }

  const soft = (size, color, parent, position, options = {}) =>
    mesh(new THREE.SphereGeometry(1, 26, 18), mat(color, { roughness: 0.95, ...options }), parent, position, size);

  function curve(points, radius, color, parent, options = {}) {
    return mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 24, radius, 8, false),
      mat(color, { roughness: 0.95, ...options }), parent,
    );
  }

  // Profiles are elliptical, with one continuous soft surface per garment.
  function loft(profile, rings = 30, sides = 32) {
    const spline = new THREE.CatmullRomCurve3(profile.map(p => new THREE.Vector3(...p)), false, "centripetal");
    const positions = [], uvs = [], indices = [];
    for (let row = 0; row <= rings; row++) {
      const p = spline.getPoint(row / rings);
      for (let col = 0; col <= sides; col++) {
        const angle = col / sides * Math.PI * 2;
        positions.push(Math.max(0, p.x) * Math.cos(angle), p.y, Math.max(0, p.z) * Math.sin(angle));
        uvs.push(col / sides, row / rings);
        if (row < rings && col < sides) {
          const a = row * (sides + 1) + col, b = a + sides + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  const shirtMaterial=mat(C.shirt,{roughness:.92,sheen:.35,sheenColor:new THREE.Color('#41464b'),sheenRoughness:.9});
  const floralMap=texture((ctx,w,h)=>{
    ctx.fillStyle="#172333";ctx.fillRect(0,0,w,h);
    let seed=2391;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(let row=0;row<5;row++)for(let col=0;col<5;col++){
      const x=(col+.5+(row%2)*.18)*w/5+(random()-.5)*30,y=(row+.5)*h/5+(random()-.5)*30,r=28+random()*18;
      for(const dx of [-w,0,w])for(const dy of [-h,0,h]){
        for(let leaf=0;leaf<4;leaf++){
          const a=random()*Math.PI*2,lx=x+dx+Math.cos(a)*r*.9,ly=y+dy+Math.sin(a)*r*.9;
          ctx.save();ctx.translate(lx,ly);ctx.rotate(a);ctx.fillStyle=leaf%2?"#25948e":"#2c787a";ctx.beginPath();ctx.ellipse(0,0,r*.65,r*.19,0,0,Math.PI*2);ctx.fill();ctx.restore();
        }
        for(let petal=0;petal<9;petal++){
          const a=petal*Math.PI*2/9;ctx.save();ctx.translate(x+dx,y+dy);ctx.rotate(a);
          ctx.fillStyle=petal%3?"#dd5d4b":"#ec874b";ctx.beginPath();ctx.ellipse(r*.55,0,r*.57,r*.18,0,0,Math.PI*2);ctx.fill();ctx.restore();
        }
        ctx.fillStyle="#b74745";ctx.beginPath();ctx.arc(x+dx,y+dy,r*.19,0,Math.PI*2);ctx.fill();
      }
    }
  },512,512);floralMap.wrapS=floralMap.wrapT=THREE.RepeatWrapping;
  const floralMaterial=mat("#ffffff",{map:floralMap,roughness:.96});

  const {faceMesh,glasses,eyes:headEyes,headphones,faceBounds,blinkPose:headBlink,updateFace:headUpdateFace}=createApprovedHead(head,headTemplate);
  eyes.push(...headEyes);

  mesh(loft([[0,2.996,0],[.115,3.015,.110],[.090,3.10,.091],[.085,3.19,.088],[.09,3.23,.095],[0,3.25,0]],36,40),unmappedSkin,body,[0,0,-.023]).name="avatar-neck";
  const hoodieGeometry=loft([[0,1.64,0],[.338,1.653,.229],[.348,1.81,.242],[.353,2.28,.256],[.396,2.76,.259],[.405,2.965,.245],[.325,3.041,.197],[.185,3.075,.130],[0,3.08,0]],44,40);
  // Clip real triangle edges against the exact V planes, preserving smooth
  // normals and UVs. The neckline has no omitted-grid stair steps.
  const hpSource=hoodieGeometry.attributes.position,hnSource=hoodieGeometry.attributes.normal,huSource=hoodieGeometry.attributes.uv,hiSource=hoodieGeometry.index;
  const clippedPositions=[],clippedNormals=[],clippedUVs=[],vBottom=2.855,vSlope=.146/(3.025-vBottom);
  function clipPanel(polygon,distance){
    const result=[];
    for(let i=0;i<polygon.length;i++){
      const a=polygon[i],b=polygon[(i+1)%polygon.length],da=distance(a.p),db=distance(b.p),insideA=da>=-1e-9,insideB=db>=-1e-9;
      if(insideA)result.push(a);
      if(insideA!==insideB){const t=da/(da-db);result.push({p:a.p.clone().lerp(b.p,t),n:a.n.clone().lerp(b.n,t).normalize(),uv:a.uv.clone().lerp(b.uv,t)});}
    }
    return result;
  }
  function emitPanel(polygon){for(let i=1;i<polygon.length-1;i++)for(const v of [polygon[0],polygon[i],polygon[i+1]]){clippedPositions.push(v.p.x,v.p.y,v.p.z);clippedNormals.push(v.n.x,v.n.y,v.n.z);clippedUVs.push(v.uv.x,v.uv.y);}}
  for(let i=0;i<hiSource.count;i+=3){
    const triangle=Array.from({length:3},(_,j)=>{const id=hiSource.getX(i+j);return {p:new THREE.Vector3().fromBufferAttribute(hpSource,id),n:new THREE.Vector3().fromBufferAttribute(hnSource,id),uv:new THREE.Vector2().fromBufferAttribute(huSource,id)};});
    emitPanel(clipPanel(triangle,p=>-p.z));
    const front=clipPanel(triangle,p=>p.z);
    emitPanel(clipPanel(front,p=>vBottom-p.y));
    const above=clipPanel(front,p=>p.y-vBottom);
    emitPanel(clipPanel(above,p=>-p.x-vSlope*(p.y-vBottom)));
    emitPanel(clipPanel(above,p=>p.x-vSlope*(p.y-vBottom)));
  }
  hoodieGeometry.dispose();const clippedHoodie=new THREE.BufferGeometry();clippedHoodie.setAttribute("position",new THREE.Float32BufferAttribute(clippedPositions,3));clippedHoodie.setAttribute("normal",new THREE.Float32BufferAttribute(clippedNormals,3));clippedHoodie.setAttribute("uv",new THREE.Float32BufferAttribute(clippedUVs,2));mesh(clippedHoodie,shirtMaterial,body).name="avatar-hoodie";
  soft([.286,.129,.190],C.jeans,body,[0,1.795,-.017]).name="character-hips";
  const hood=loft([[.294,2.948,.260],[.330,3.042,.298],[.298,3.205,.273],[.243,3.273,.188]],24,40);const hoodIndex=[];
  for(let row=0;row<24;row++)for(let col=20;col<40;col++){const a=row*41+col,b=a+41;hoodIndex.push(a,b,a+1,b,b+1,a+1);}hood.setIndex(hoodIndex);hood.computeVertexNormals();mesh(hood,mat(C.neckline,{roughness:1,side:THREE.DoubleSide}),body).name="avatar-folded-hood";
  for(const side of [-1,1])curve([[side*.245,3.214,-.048],[side*.269,3.052,.151],[side*.141,2.94,.247],[0,2.848,.250]],.028,C.neckline,body);
  const undershirt=new THREE.Shape();undershirt.moveTo(-.139,3.005);undershirt.lineTo(.139,3.005);undershirt.lineTo(0,2.821);undershirt.closePath();mesh(new THREE.ShapeGeometry(undershirt),mat("#f5f2e9",{roughness:.96,side:THREE.DoubleSide}),body,[0,0,.267]).name="avatar-white-undershirt";
  for(const side of [-1,1])curve([[side*.143,3.015,.275],[side*.101,2.972,.275],[side*.060,2.920,.275],[0,2.850,.274]],.013,C.neckline,body).name='smooth-inner-collar-edge';
  for(const side of [-1,1]){curve([[side*.093,2.969,.279],[side*.096,2.825,.275],[side*.092,2.624,.272]],.0045,"#3b3e41",body);mesh(new THREE.TorusGeometry(.012,.0035,6,16),mat("#101316"),body,[side*.093,2.969,.278]);}
  const mark=Array.from({length:25},(_,i)=>{const a=i/24*Math.PI*2;return [.023*Math.cos(a),2.664+.038*Math.sin(a),.264];});curve(mark,.0035,"#dfdfd8",body).name="avatar-chest-insignia";
  curve([[-.222,2.170,.245],[-.257,1.989,.244],[0,1.93,.247],[.257,1.989,.244],[.222,2.17,.245]],.0028,"#373b3f",body).name="avatar-pocket-seam";

  // Keep the garment construction, but give the reference avatar its compact
  // torso. Normals receive the same affine transform as the surface.
  const torsoRatio=(SHOULDER_HEIGHT-HIP_HEIGHT)/(3.02-1.79);
  const torsoOffset=HIP_HEIGHT-1.79*torsoRatio;
  for(const item of body.children){
    if(!item.isMesh)continue;
    item.geometry.scale(1,torsoRatio,1);
    item.position.y=item.position.y*torsoRatio+torsoOffset;
  }

  for(const side of [-1,1]) {
    // A fixed shoulder yoke overlaps the moving sleeve at every arm angle.
    soft([.105,.100,.133],C.shirt,body,[side*.321,SHOULDER_HEIGHT-.042,-.012],{roughness:.92,sheen:.35,sheenColor:new THREE.Color('#41464b'),sheenRoughness:.9}).name='hoodie-shoulder-yoke';
    const arm=new THREE.Group(); arm.name=side<0?"left-arm":"right-arm";
    arm.position.set(side*SHOULDER_OFFSET,SHOULDER_HEIGHT,-.008); body.add(arm); arms.push(arm);
    const shoulder=new THREE.Bone();shoulder.name=`${arm.name}-shoulder`;arm.add(shoulder);
    const elbow=new THREE.Bone(); elbow.name=`${arm.name}-elbow`; elbow.position.y=-UPPER_ARM; shoulder.add(elbow);
    const bendBone=new THREE.Bone();bendBone.name=`${arm.name}-soft-bend`;bendBone.position.y=-UPPER_ARM;shoulder.add(bendBone);
    const hand=new THREE.Bone(); hand.name=`${arm.name}-hand`; hand.position.y=-FOREARM;hand.scale.set(.92,.92,.92); elbow.add(hand);
    const sleeveGeometry=loft([[.063,-.978,.068],[.067,-.940,.074],[.080,-.820,.087],[.090,-.640,.100],[.096,-.510,.104],[.112,-.315,.124],[.130,-.120,.142],[.124,.008,.134],[.055,.058,.060],[0,.072,0]],64,40);
    const sleeveIndices=[],sleeveWeights=[];
    for(let i=0;i<sleeveGeometry.attributes.position.count;i++){
      const depth=-sleeveGeometry.attributes.position.getY(i),pre=THREE.MathUtils.smoothstep(depth,UPPER_ARM-.20,UPPER_ARM),post=THREE.MathUtils.smoothstep(depth,UPPER_ARM,UPPER_ARM+.20);
      sleeveIndices.push(0,1,2,0);sleeveWeights.push(1-pre,pre*(1-post),post,0);
    }
    sleeveGeometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(sleeveIndices,4));sleeveGeometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sleeveWeights,4));
    const sleeve=new THREE.SkinnedMesh(sleeveGeometry,shirtMaterial);sleeve.name=arm.name+'-continuous-sleeve';sleeve.castShadow=sleeve.receiveShadow=true;sleeve.frustumCulled=false;arm.add(sleeve);
    const sleeveSkeleton=new THREE.Skeleton([shoulder,bendBone,elbow,hand]);arm.updateWorldMatrix(true,true);sleeve.bind(sleeveSkeleton);skeletons.push(sleeveSkeleton);
    const cuff=mesh(new THREE.TorusGeometry(.066,.0075,10,32),mat(C.neckline,{roughness:1}),elbow,[0,-FOREARM-.012,0]);cuff.rotation.x=Math.PI/2;
    const palm=mesh(loft([[0,-.012,0],[.054,-.020,.034],[.083,-.061,.043],[.092,-.115,.037],[.079,-.166,.031],[.058,-.194,.026],[0,-.207,0]],32,40),mat(C.skin,{roughness:.84}),hand);
    palm.name=arm.name+"-anatomical-palm";
    curve([[-.058,-.077,.040],[-.014,-.095,.043],[.046,-.082,.040]],.0011,C.skinShade,hand);
    curve([[-.039,-.112,.038],[.004,-.137,.038],[.058,-.126,.034]],.0010,C.skinShade,hand);
    const fingers=[];
    for(let i=0;i<4;i++){
      const finger=new THREE.Bone(); finger.name=`${arm.name}-finger-${i}`;
      finger.position.set(-0.056+i*0.0375,-0.168,0.011); hand.add(finger);
      const lengths=side>0?[.158,.180,.169,.135]:[.135,.169,.180,.158];
      const length=lengths[i]*.83,radius=i===0||i===3?.016:.018;
      const proximal=length*.39,middle=length*.34,distal=length*.27;
      const mid=new THREE.Bone();mid.name=finger.name+"-middle";mid.position.y=-proximal;finger.add(mid);
      const tip=new THREE.Bone();tip.name=finger.name+"-tip";tip.position.y=-middle;mid.add(tip);
      const fingerGeometry=loft([[0,-length-.006,0],[radius*.66,-length,.012],[radius*.84,-length+.014,radius*.86],[radius*.89,-proximal-middle,radius*.93],[radius,-proximal,radius],[radius,.009,radius],[0,.025,0]],40,20);
      const fi=[],fw=[];
      for(let v=0;v<fingerGeometry.attributes.position.count;v++){
        const depth=-fingerGeometry.attributes.position.getY(v),a=THREE.MathUtils.smoothstep(depth,proximal-.016,proximal+.016),b=THREE.MathUtils.smoothstep(depth,proximal+middle-.015,proximal+middle+.015);
        fi.push(0,1,2,0);fw.push(1-a,a*(1-b),a*b,0);
      }
      fingerGeometry.translate(...finger.position.toArray());fingerGeometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(fi,4));fingerGeometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(fw,4));
      const fingerSurface=new THREE.SkinnedMesh(fingerGeometry,unmappedSkin);fingerSurface.name=finger.name+'-smooth-surface';fingerSurface.castShadow=fingerSurface.receiveShadow=true;fingerSurface.frustumCulled=false;hand.add(fingerSurface);
      const fingerSkeleton=new THREE.Skeleton([finger,mid,tip]);hand.updateWorldMatrix(true,true);fingerSurface.bind(fingerSkeleton);skeletons.push(fingerSkeleton);
      soft([radius*.67,distal*.33,.003], "#e1b39c",tip,[0,-distal*.68,-radius*.82],{roughness:.49});
      fingers.push(finger);
    }
    const thumb=new THREE.Bone(); thumb.name=`${arm.name}-thumb`; thumb.position.set(-side*.083,-.079,.024); hand.add(thumb);
    const thumbTip=new THREE.Bone();thumbTip.name=thumb.name+'-tip';thumbTip.position.y=-.058;thumb.add(thumbTip);
    const thumbGeometry=loft([[0,-.116,0],[.014,-.109,.013],[.019,-.095,.019],[.023,-.058,.023],[.027,-.024,.025],[.020,.006,.017],[0,.019,0]],32,24);
    const ti=[],tw=[];for(let i=0;i<thumbGeometry.attributes.position.count;i++){const w=THREE.MathUtils.smoothstep(-thumbGeometry.attributes.position.getY(i),.04,.08);ti.push(0,1,0,0);tw.push(1-w,w,0,0);}
    thumbGeometry.translate(...thumb.position.toArray());thumbGeometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(ti,4));thumbGeometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(tw,4));
    const thumbSurface=new THREE.SkinnedMesh(thumbGeometry,unmappedSkin);thumbSurface.name=thumb.name+'-smooth-surface';thumbSurface.castShadow=thumbSurface.receiveShadow=true;thumbSurface.frustumCulled=false;hand.add(thumbSurface);
    const thumbSkeleton=new THREE.Skeleton([thumb,thumbTip]);hand.updateWorldMatrix(true,true);thumbSurface.bind(thumbSkeleton);skeletons.push(thumbSkeleton);
    soft([.014,.019,.003],"#edc9ae",thumbTip,[0,-.033,-.018],{roughness:.49});thumb.rotation.z=side*.45;
    hand.userData={fingers,thumb,thumbTip}; arm.userData={shoulder,elbow,bendBone,hand,side};

    const leg=new THREE.Group(); leg.name=side<0?"left-leg":"right-leg";
    leg.position.set(side*.171,HIP_HEIGHT,0); body.add(leg); legs.push(leg);
    const hip=new THREE.Bone(),knee=new THREE.Bone(),ankle=new THREE.Bone();
    hip.name=`${leg.name}-hip`; knee.name=`${leg.name}-knee`; ankle.name=`${leg.name}-ankle`;
    knee.position.y=-THIGH; ankle.position.y=-SHIN; hip.add(knee); knee.add(ankle);
    function weighted(geometry){const indices=[],weights=[];for(let i=0;i<geometry.attributes.position.count;i++){const weight=THREE.MathUtils.smoothstep(-geometry.attributes.position.getY(i),THIGH-.15,THIGH+.15);indices.push(0,1,0,0);weights.push(1-weight,weight,0,0);}geometry.setAttribute("skinIndex",new THREE.Uint16BufferAttribute(indices,4));geometry.setAttribute("skinWeight",new THREE.Float32BufferAttribute(weights,4));return geometry;}
    const compactLeg=points=>points.map(([x,y,z])=>[x,y>=-.87?y*THIGH/.87:-THIGH+(y+.87)*SHIN/.76,z]);
    const skinGeometry=weighted(loft(compactLeg([[0,-1.67,0],[.059,-1.636,.066],[.067,-1.50,.071],[.086,-1.31,.096],[.119,-1.08,.120],[.111,-.94,.108],[.110,-.79,.111],[.144,-.46,.151],[.162,-.10,.165],[.157,.018,.163],[0,.048,0]]),64,40));
    const skinLeg=new THREE.SkinnedMesh(skinGeometry,unmappedSkin);skinLeg.name=`${leg.name}-bare-leg`;skinLeg.castShadow=skinLeg.receiveShadow=true;skinLeg.frustumCulled=false;leg.add(skinLeg);skinLeg.add(hip);
    const skeleton=new THREE.Skeleton([hip,knee,ankle]);skinLeg.bind(skeleton);skeletons.push(skeleton);
    const shortsGeometry=weighted(loft(compactLeg([[.170,-.723,.175],[.171,-.712,.176],[.180,-.654,.184],[.191,-.40,.193],[.191,-.10,.195],[.171,.026,.175],[0,.043,0]]),40,40));
    const trousers=new THREE.SkinnedMesh(shortsGeometry,floralMaterial);trousers.name=`${leg.name}-floral-shorts`;trousers.castShadow=trousers.receiveShadow=true;trousers.frustumCulled=false;leg.add(trousers);trousers.bind(skeleton);
    const foot=new THREE.Group();foot.name=`${leg.name}-red-clog`;ankle.add(foot);
    soft([.108,.073,.207],C.skin,foot,[0,-.020,.055]);
    const soleOutline=new THREE.Shape();soleOutline.moveTo(-.128,-.174);
    soleOutline.bezierCurveTo(-.158,-.174,-.165,-.112,-.165,-.025);soleOutline.lineTo(-.164,.235);soleOutline.bezierCurveTo(-.161,.351,-.103,.391,0,.392);soleOutline.bezierCurveTo(.103,.391,.161,.351,.164,.235);soleOutline.lineTo(.165,-.025);soleOutline.bezierCurveTo(.165,-.112,.158,-.174,.128,-.174);soleOutline.quadraticCurveTo(0,-.190,-.128,-.174);
    const soleGeometry=new THREE.ExtrudeGeometry(soleOutline,{depth:.058,bevelEnabled:true,bevelSize:.010,bevelThickness:.0065,bevelSegments:5,curveSegments:24});soleGeometry.rotateX(Math.PI/2);
    mesh(soleGeometry,mat(C.sole,{roughness:.83}),foot,[0,-.0955,0]).name='rounded-clog-sole';
    const shoeWidth=z=>Math.max(.006,.159*Math.sqrt(Math.max(0,1-((z-.120)/.28)**2)));
    const shoeHeight=z=>.145-.057*THREE.MathUtils.smoothstep(z,.18,.40);
    const shoeSurface=(x,z)=>-.086+shoeHeight(z)*Math.sqrt(Math.max(0,1-(x/shoeWidth(z))**2));
    const vents=[-.072,0,.072].flatMap(x=>[.095,.194,.281].map(z=>({x,z})));const sp=[],si=[],rows=46,sides=48;
    for(let row=0;row<=rows;row++)for(let col=0;col<=sides;col++){
      const z=-.024+row/rows*.420,a=col/sides*Math.PI,x=shoeWidth(z)*Math.cos(a),y=-.086+shoeHeight(z)*Math.sin(a);sp.push(x,y,z);
      if(row<rows&&col<sides){const zc=-.024+(row+.5)/rows*.420,ac=(col+.5)/sides*Math.PI,xc=shoeWidth(zc)*Math.cos(ac);const vent=vents.some(v=>((xc-v.x)/.018)**2+((zc-v.z)/.025)**2<1)&&Math.sin(ac)>.45;if(!vent){const a=row*(sides+1)+col,b=a+sides+1;si.push(a,a+1,b,a+1,b+1,b);}}
    }
    const upper=new THREE.BufferGeometry();upper.setAttribute("position",new THREE.Float32BufferAttribute(sp,3));upper.setIndex(si);upper.computeVertexNormals();mesh(upper,mat(C.shoe,{roughness:.74,side:THREE.DoubleSide}),foot).name="perforated-clog-upper";
    for(const vent of vents){const points=Array.from({length:25},(_,i)=>{const a=i/24*Math.PI*2,x=vent.x+.019*Math.cos(a),z=vent.z+.026*Math.sin(a);return [x,shoeSurface(x,z)+.001,z];});curve(points,.0018,C.shoe,foot);}
    curve([[-.151,.001,-.015],[-.134,.071,-.123],[0,.101,-.174],[.134,.071,-.123],[.151,.001,-.015]],.017,C.shoe,foot);
    for(const side of [-1,1])soft([.009,.019,.019],C.sole,foot,[side*.151,.003,-.015]);
    leg.userData={hip,knee,ankle,foot,trousers,side};
  }

  const elbowPosition=new THREE.Vector3(0,-UPPER_ARM,0),handPosition=new THREE.Vector3(0,-FOREARM,0);
  const foldedTargets=arms.map(arm=>{
    const left=arm.userData.side<0,side=arm.userData.side;
    const upper=new THREE.Quaternion().setFromUnitVectors(DOWN,new THREE.Vector3(...(left?[.045,-.83,.557]:[-.035,-.60,.799])).normalize());
    const lower=new THREE.Quaternion().setFromUnitVectors(DOWN,new THREE.Vector3(...(left?[.94,-.12,.32]:[-.95,-.06,.30])).normalize());
    const fingerDirection=new THREE.Vector3(-side*.93,.06,-.36).normalize(),handY=fingerDirection.clone().negate(),handZ=new THREE.Vector3(0,0,-1);
    handZ.addScaledVector(handY,-handZ.dot(handY)).normalize();const handX=new THREE.Vector3().crossVectors(handY,handZ).normalize();
    const worldHand=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(handX,handY,handZ));
    return {upper,elbow:upper.clone().invert().multiply(lower),hand:lower.clone().invert().multiply(worldHand)};
  });
  const greetingTargets=arms.map(arm=>{
    const side=arm.userData.side;
    const upper=new THREE.Quaternion().setFromUnitVectors(DOWN,new THREE.Vector3(side*.75,-.12,.65).normalize());
    const lower=new THREE.Quaternion().setFromUnitVectors(DOWN,new THREE.Vector3(side*.08,.94,-.33).normalize());
    return {upper,elbow:upper.clone().invert().multiply(lower),inverseLower:lower.clone().invert()};
  });
  let faceSleep=0;
  const waveHand=new THREE.Quaternion(),waveEuler=new THREE.Euler();
  const clamp=(value,fallback=0)=>THREE.MathUtils.clamp(Number.isFinite(value)?value:fallback,0,1);
  function update(){for(const arm of arms)arm.userData.bendBone.quaternion.identity().slerp(arm.userData.elbow.quaternion,.5);root.updateMatrixWorld(true);for(const skeleton of skeletons)skeleton.update();}

  const wristTarget=new THREE.Vector3(),direction=new THREE.Vector3(),pole=new THREE.Vector3(),bend=new THREE.Vector3(),lowerDirection=new THREE.Vector3();
  const upperRotation=new THREE.Quaternion(),lowerRotation=new THREE.Quaternion(),relativeRotation=new THREE.Quaternion();
  const bodyRotation=new THREE.Quaternion(),handRotation=new THREE.Quaternion();
  const deskHandRotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI/2,0,0));
  const restHandRotation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(-1,0,0),new THREE.Vector3(0,0,-1),new THREE.Vector3(0,-1,0)));

  // Two actual joints reach the wrist target; the hand never moves separately
  // from its forearm. The pole controls where the elbow bends.
  function reachArm(arm,target,poleHint,orientation,amount=1) {
    const blend=clamp(amount);if(!blend)return;
    direction.copy(target).sub(arm.position);
    const distance=THREE.MathUtils.clamp(direction.length(),Math.abs(UPPER_ARM-FOREARM)+.00001,UPPER_ARM+FOREARM-.00001);
    direction.normalize();
    const along=(UPPER_ARM*UPPER_ARM-FOREARM*FOREARM+distance*distance)/(2*distance);
    const height=Math.sqrt(Math.max(0,UPPER_ARM*UPPER_ARM-along*along));
    pole.copy(poleHint).addScaledVector(direction,-poleHint.dot(direction)).normalize();
    bend.copy(direction).multiplyScalar(along).addScaledVector(pole,height);
    upperRotation.setFromUnitVectors(DOWN,bend.clone().normalize());
    lowerDirection.copy(direction).multiplyScalar(distance).sub(bend).normalize();
    lowerRotation.setFromUnitVectors(DOWN,lowerDirection);
    arm.quaternion.slerp(upperRotation,blend);
    relativeRotation.copy(upperRotation).invert().multiply(lowerRotation);
    arm.userData.elbow.quaternion.slerp(relativeRotation,blend);
    relativeRotation.copy(lowerRotation).invert().multiply(orientation);
    arm.userData.hand.quaternion.slerp(relativeRotation,blend);
  }

  const restTargets=arms.map(arm=>({wrist:new THREE.Vector3(arm.userData.side*.55,SHOULDER_HEIGHT-.38,.02),pole:new THREE.Vector3(arm.userData.side*.20,-1,-.28)}));

  function pose(amount){
    const standing=clamp(amount,1),angle=(1-standing)*Math.PI/2;
    body.position.x=0;
    body.position.y=-THIGH*(1-Math.cos(angle));
    for(const leg of legs){leg.rotation.set(-angle,0,0);leg.userData.knee.rotation.set(angle,0,0);leg.userData.ankle.rotation.set(0,0,0);}
    for(const arm of arms){
      arm.position.set(arm.userData.side*SHOULDER_OFFSET,SHOULDER_HEIGHT,-.008);
      arm.rotation.set(THREE.MathUtils.lerp(-1,-0.015,standing),0,arm.userData.side*THREE.MathUtils.lerp(0.16,0.085,standing));
      arm.userData.elbow.position.copy(elbowPosition); arm.userData.elbow.rotation.set(THREE.MathUtils.lerp(-0.55,-0.09,standing),0,0);
      arm.userData.hand.position.copy(handPosition); arm.userData.hand.rotation.set(THREE.MathUtils.lerp(0.08,0.02,standing),0,0);
      arm.userData.hand.userData.fingers.forEach((finger,i)=>{finger.rotation.set(-.12-i*.012,0,0);const middle=finger.getObjectByName(finger.name+"-middle"),tip=finger.getObjectByName(finger.name+"-tip");if(middle)middle.rotation.set(-.22,0,0);if(tip)tip.rotation.set(-.14,0,0);});
      arm.userData.hand.userData.thumb.rotation.set(0,0,arm.userData.side*0.45);
      arm.userData.hand.userData.thumbTip.rotation.x=-.18;
    }
    arms.forEach((arm,index)=>reachArm(arm,restTargets[index].wrist,restTargets[index].pole,restHandRotation,1-standing));
    glasses.position.set(0,0,0); glasses.rotation.set(0,0,0); glasses.visible=true; head.rotation.x=0; head.rotation.z=0;
    faceSleep=0;blinkPose(0);
    update(); return standing;
  }

  function portraitPose(amount){
    const blend=clamp(amount); if(!blend)return blend;
    arms.forEach((arm,i)=>{
      const target=foldedTargets[i],left=arm.userData.side<0;
      const wrist=new THREE.Vector3(left?.135:-.155,SHOULDER_HEIGHT-(left?.25:.43),left?.28:.285);
      const poleHint=new THREE.Vector3(arm.userData.side*.20,-1,.45);
      const worldHand=target.upper.clone().multiply(target.elbow).multiply(target.hand);
      reachArm(arm,wrist,poleHint,worldHand,blend);
      arm.userData.hand.userData.fingers.forEach(finger=>{finger.rotation.x=THREE.MathUtils.lerp(finger.rotation.x,-.24,blend);const middle=finger.getObjectByName(finger.name+"-middle"),tip=finger.getObjectByName(finger.name+"-tip");if(middle)middle.rotation.x=THREE.MathUtils.lerp(middle.rotation.x,-.68,blend);if(tip)tip.rotation.x=THREE.MathUtils.lerp(tip.rotation.x,-.42,blend);});
      arm.userData.hand.userData.thumb.rotation.x=-.25*blend;
    });
    update(); return blend;
  }

  function deskPose(amount,mouseWrist,keyboardWrist,time=0) {
    const blend=clamp(amount);if(!blend)return;
    body.updateWorldMatrix(true,false);
    body.getWorldQuaternion(bodyRotation).invert();
    handRotation.copy(bodyRotation).multiply(deskHandRotation);
    [mouseWrist,keyboardWrist].forEach((target,index)=>{
      wristTarget.copy(target);body.worldToLocal(wristTarget);
      pole.set(index===0 ? 1 : -1,-.25,.05).applyQuaternion(bodyRotation);
      reachArm(arms[index],wristTarget,pole,handRotation,blend);
    });
    const mouseFingers=arms[0].userData.hand.userData.fingers;
    mouseFingers.forEach(finger=>finger.rotation.x=-.10*blend);
    mouseFingers[1].rotation.x-=.025*Math.pow(Math.max(0,Math.sin(time*2.1)),8)*blend;
    arms[1].userData.hand.userData.fingers.forEach((finger,index)=>{
      finger.rotation.x=(-.085-.025*Math.pow(Math.max(0,Math.sin(time*3.8+index*.8)),4))*blend;
    });
    update();
  }

  function armrestPose(amount,targets){
    const blend=clamp(amount);if(!blend)return;
    body.updateWorldMatrix(true,false);
    body.getWorldQuaternion(bodyRotation).invert();
    root.getWorldQuaternion(handRotation).multiply(restHandRotation);
    handRotation.premultiply(bodyRotation);
    targets.forEach((target,index)=>{
      wristTarget.copy(target);body.worldToLocal(wristTarget);
      reachArm(arms[index],wristTarget,new THREE.Vector3(arms[index].userData.side*.20,-1,-.28),handRotation,blend);
    });
    update();
  }

  function greetPose(amount,time=0,armIndex=0){
    const blend=clamp(amount); if(!blend)return blend;
    const arm=arms[armIndex],hand=arm.userData.hand,side=arm.userData.side,seconds=Number.isFinite(time)?time:0;
    const flutter=Math.sin((seconds-1.05)*Math.PI*1.25),wrist=new THREE.Vector3(side*(.59+flutter*.045),SHOULDER_HEIGHT+.29,.28);
    waveEuler.set(-.035,side*.08,Math.PI+flutter*.12);waveHand.setFromEuler(waveEuler);
    reachArm(arm,wrist,new THREE.Vector3(side*.35,-.9,.10),waveHand,blend);
    hand.userData.fingers.forEach((finger,i)=>{
      finger.rotation.x=THREE.MathUtils.lerp(finger.rotation.x,-.025,blend);
      finger.rotation.z=THREE.MathUtils.lerp(finger.rotation.z,[-.065,-.020,.023,.070][i],blend);
      finger.getObjectByName(finger.name+'-middle').rotation.x=THREE.MathUtils.lerp(finger.getObjectByName(finger.name+'-middle').rotation.x,-.035,blend);
      finger.getObjectByName(finger.name+'-tip').rotation.x=THREE.MathUtils.lerp(finger.getObjectByName(finger.name+'-tip').rotation.x,-.015,blend);
    });
    hand.userData.thumb.rotation.z=THREE.MathUtils.lerp(hand.userData.thumb.rotation.z,-side*.95,blend);
    hand.userData.thumb.rotation.x=THREE.MathUtils.lerp(hand.userData.thumb.rotation.x,-.10,blend);
    hand.userData.thumbTip.rotation.x=THREE.MathUtils.lerp(hand.userData.thumbTip.rotation.x,-.06,blend);
    update(); return blend;
  }

  function restPose(sleepAmount,time=0){
    const sleep=clamp(sleepAmount),seconds=Number.isFinite(time)?time:0;
    head.rotation.x=THREE.MathUtils.lerp(-0.035,0.245,sleep)+Math.sin(seconds*0.58)*0.009*sleep;
    head.rotation.z=Math.sin(seconds*0.5)*0.035*sleep;
    faceSleep=sleep*.86;blinkPose(faceSleep);
    // Clear spectacles and headphones stay attached while the head nods.
    update(); return sleep;
  }

  function walkPose(amount, travel=1.7){
    const t=clamp(amount),envelope=Math.sin(Math.PI*t);
    const {step,fraction,advance}=walkPath(t);
    const feet=legs.map(leg=>{
      const left=leg.userData.side<0;
      const active=left ? step===0 || step===2 : step===1 || step===3;
      const starts=left ? [0,1/3,1/3,1] : [0,0,2/3,2/3];
      const ends=left ? [1/3,1/3,1,1] : [0,2/3,2/3,1];
      const plant=THREE.MathUtils.lerp(starts[step],ends[step],fraction);
      const roll=active?Math.sin(Math.PI*fraction*2)*.16:0;
      return {leg,z:(plant-advance)*travel,lift:active?Math.sin(Math.PI*fraction)**2*.105+Math.abs(roll)*.17:0,roll};
    });
    const reach=Math.max(...feet.map(foot=>Math.abs(foot.z)));
    body.position.y=Math.min(-.025*envelope,Math.sqrt(Math.max(.01,(THIGH+SHIN)**2-reach*reach))-(THIGH+SHIN)-.005*envelope);
    const gait=(step+fraction)*Math.PI;
    body.position.x=Math.sin(gait)*.024*envelope;
    body.rotation.set(0,0,Math.sin(gait)*.014*envelope);body.scale.y=1;
    body.updateWorldMatrix(true,false);
    const inverseBody=body.getWorldQuaternion(new THREE.Quaternion()).invert(),rootOrientation=root.getWorldQuaternion(new THREE.Quaternion());
    for(const {leg,z,lift,roll} of feet){
      const ankleTarget=root.localToWorld(new THREE.Vector3(leg.position.x,.16+lift,z));body.worldToLocal(ankleTarget);ankleTarget.sub(leg.position);
      const distance=THREE.MathUtils.clamp(ankleTarget.length(),.071,THIGH+SHIN-.00001),axis=ankleTarget.normalize();
      const along=(THIGH*THIGH-SHIN*SHIN+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,THIGH*THIGH-along*along));
      const kneePole=new THREE.Vector3(0,0,1).addScaledVector(axis,-axis.z).normalize();
      const upper=axis.clone().multiplyScalar(along).addScaledVector(kneePole,height),lower=axis.clone().multiplyScalar(distance).sub(upper);
      const hipRotation=new THREE.Quaternion().setFromUnitVectors(DOWN,upper.normalize()),shinRotation=new THREE.Quaternion().setFromUnitVectors(DOWN,lower.normalize());
      leg.quaternion.copy(hipRotation);leg.userData.knee.quaternion.copy(hipRotation).invert().multiply(shinRotation);
      const footOrientation=inverseBody.clone().multiply(rootOrientation).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(roll,leg.userData.side*.035,0)));
      leg.userData.ankle.quaternion.copy(shinRotation).invert().multiply(footOrientation);
    }
    // Small counter-swings keep the adult gait relaxed without moving a wrist
    // independently from the shoulder/elbow hierarchy.
    const swing=Math.sin(gait)*envelope;
    for(const arm of arms){
      arm.rotation.set(-.025+arm.userData.side*.16*swing,0,arm.userData.side*.07);
      arm.userData.elbow.rotation.set(-.18-.045*Math.abs(swing),0,0);
      arm.userData.hand.rotation.set(.04,0,0);
    }
    update(); return t;
  }

  pose(seated?0:1);
  const standingHeight=new THREE.Box3().setFromObject(root).max.y-body.position.y;
  const rigDimensions={seatedRootY:.06,standingHeight,upperArm:UPPER_ARM,forearm:FOREARM,thigh:THIGH,shin:SHIN,hipHeight:HIP_HEIGHT,headHeight:HEAD_HEIGHT,headScale:HEAD_SCALE,shoulderHeight:SHOULDER_HEIGHT,shoulderOffset:SHOULDER_OFFSET,seatHeight:HIP_HEIGHT-THIGH+.06,seatedShoulderHeight:SHOULDER_HEIGHT-THIGH+.06};
  const getWorldWrists=()=>{update();return arms.map(arm=>arm.userData.hand.getWorldPosition(new THREE.Vector3()));};
  function blinkPose(amount){return headBlink(amount);}
  function updateFace(seconds=0){const close=headUpdateFace(seconds,faceSleep);update();return close;}
  function setFaceMap(){return false;}
  return {root,body,head,arms,legs,pose,portraitPose,greetPose,restPose,walkPose,deskPose,armrestPose,glasses,eyes,rigDimensions,getWorldWrists,faceMesh,faceBounds,faceUV:mapping,setFaceMap,headphones,blinkPose,updateFace};
}
