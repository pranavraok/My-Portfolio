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
const ease01=value=>{const t=THREE.MathUtils.clamp(value,0,1);return t*t*t*(10+t*(-15+6*t));};
const interval=(a,b,value)=>ease01((value-a)/(b-a));

// The hands settle before the chair turns, and return before desk work resumes.
export function heroGreeting(seconds,weight=1){
  return {
    hands:interval(.10,1.2,seconds)*(1-interval(8.7,9.85,seconds))*weight,
    turn:interval(1.3,2.9,seconds)*(1-interval(7.05,8.6,seconds))*weight,
    wave:interval(2.8,3.7,seconds)*(1-interval(6.05,7.05,seconds))*weight,
    active:seconds<9.9&&weight>.2,
  };
}

// A short greeting has two broad forearm swings, then settles before lowering.
// The wrist and shoulder follow the forearm at different delays.
export function waveMotion(seconds){
  const swingAt=t=>Math.sin((t-3.75)*Math.PI*1.7)*interval(3.70,3.98,t)*(1-interval(5.68,6.02,t));
  return {forearm:swingAt(seconds),wrist:swingAt(seconds-.065),shoulder:swingAt(seconds-.12)};
}

export function chairRise(standing){
  const extension=interval(.18,.94,standing);
  return {
    extension,
    forward:.085*interval(.025,.20,standing)*(1-extension),
    release:interval(.42,.86,standing),
    lean:.36*interval(.015,.27,standing)*(1-interval(.43,.96,standing)),
    cushion:.008*Math.sin(Math.PI*interval(0,.18,standing))**2,
  };
}

export function chairSwivel(turn){
  const envelope=Math.sin(Math.PI*turn);
  return {
    angle:(.04-Math.PI)*turn-.028*Math.sin(2*Math.PI*turn)*envelope,
    torsoLag:.055*envelope,
    footLag:.14*envelope,
  };
}

// Both feet share the load briefly before the next foot leaves the floor.
export function walkPath(amount) {
  const phase = THREE.MathUtils.clamp(amount, 0, 1) * 4;
  const step = Math.min(3, Math.floor(phase));
  const raw=THREE.MathUtils.clamp(phase-step,0,1),fraction=interval(.16,.88,raw);
  const t=phase/4,advance=t*t*(3-2*t);
  return { step, raw, fraction, advance };
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

  const garmentAnchor=new THREE.Bone();garmentAnchor.name='hoodie-torso-anchor';body.add(garmentAnchor);
  for(const side of [-1,1]) {
    const arm=new THREE.Group(); arm.name=side<0?"left-arm":"right-arm";
    arm.position.set(side*SHOULDER_OFFSET,SHOULDER_HEIGHT,-.008); body.add(arm); arms.push(arm);
    const shoulder=new THREE.Bone();shoulder.name=`${arm.name}-shoulder`;arm.add(shoulder);
    const elbow=new THREE.Bone(); elbow.name=`${arm.name}-elbow`; elbow.position.y=-UPPER_ARM; shoulder.add(elbow);
    const bendBone=new THREE.Bone();bendBone.name=`${arm.name}-soft-bend`;bendBone.position.y=-UPPER_ARM;shoulder.add(bendBone);
    const hand=new THREE.Bone(); hand.name=`${arm.name}-hand`; hand.position.y=-FOREARM;hand.scale.setScalar(1); elbow.add(hand);
    const sleeveGeometry=loft([[.057,-.962,.062],[.062,-.930,.068],[.075,-.820,.082],[.084,-.640,.091],[.091,-.510,.096],[.102,-.315,.110],[.118,-.120,.126],[.110,.008,.122],[.050,.024,.056],[0,.034,0]],64,40);
    const sleeveIndices=[],sleeveWeights=[];
    for(let i=0;i<sleeveGeometry.attributes.position.count;i++){
      const depth=-sleeveGeometry.attributes.position.getY(i),attachment=THREE.MathUtils.smoothstep(depth,-.025,.21),pre=THREE.MathUtils.smoothstep(depth,UPPER_ARM-.15,UPPER_ARM),post=THREE.MathUtils.smoothstep(depth,UPPER_ARM,UPPER_ARM+.15);
      sleeveIndices.push(0,1,2,3);sleeveWeights.push(1-attachment,attachment*(1-pre),attachment*pre*(1-post),attachment*post);
    }
    sleeveGeometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(sleeveIndices,4));sleeveGeometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sleeveWeights,4));
    // The shoulder end belongs to the torso, while the elbow and cuff follow
    // the arm. A rotating cap must never peel away from the sweatshirt.
    sleeveGeometry.translate(...arm.position.toArray());
    const sleeve=new THREE.SkinnedMesh(sleeveGeometry,shirtMaterial);sleeve.name=arm.name+'-continuous-sleeve';sleeve.castShadow=sleeve.receiveShadow=true;sleeve.frustumCulled=false;body.add(sleeve);
    const sleeveSkeleton=new THREE.Skeleton([garmentAnchor,shoulder,bendBone,elbow,hand]);body.updateWorldMatrix(true,true);sleeve.bind(sleeveSkeleton);skeletons.push(sleeveSkeleton);
    mesh(loft([[.058,-FOREARM+.020,.063],[.059,-FOREARM-.002,.063],[.051,-FOREARM-.018,.054]],8,32),shirtMaterial,elbow).name=arm.name+'-soft-cuff';
    // One uninterrupted surface joins the narrow wrist to the palm; a
    // separate wrist sphere made the hands look like detachable mittens.
    const palm=mesh(loft([[0,.025,0],[.036,.012,.030],[.046,-.026,.032],[.069,-.073,.040],[.079,-.121,.043],[.072,-.165,.033],[.049,-.190,.025],[0,-.197,0]],40,40),mat(C.skin,{roughness:.84}),hand);
    palm.name=arm.name+"-anatomical-palm";
    soft([.027,.042,.017],C.skin,hand,[side*.052,-.090,.016],{roughness:.84}).name=arm.name+'-thumb-pad';
    const fingers=[];
    for(let i=0;i<4;i++){
      const finger=new THREE.Bone(); finger.name=`${arm.name}-finger-${i}`;
      finger.position.set(-.0525+i*.035,[-.159,-.171,-.171,-.159][i],.009); hand.add(finger);
      const lengths=side>0?[.135,.169,.180,.158]:[.158,.180,.169,.135];
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
    // With the palm facing the visitor, the thumb belongs on the inner side
    // of each raised hand. The old mirrored assignment put it outside.
    const thumb=new THREE.Bone(); thumb.name=`${arm.name}-thumb`; thumb.position.set(side*.070,-.085,.016); hand.add(thumb);
    const thumbTip=new THREE.Bone();thumbTip.name=thumb.name+'-tip';thumbTip.position.y=-.050;thumb.add(thumbTip);
    const thumbGeometry=loft([[0,-.103,0],[.013,-.097,.012],[.017,-.084,.018],[.021,-.050,.022],[.025,-.021,.024],[.020,.005,.017],[0,.016,0]],32,24);
    const ti=[],tw=[];for(let i=0;i<thumbGeometry.attributes.position.count;i++){const w=THREE.MathUtils.smoothstep(-thumbGeometry.attributes.position.getY(i),.034,.069);ti.push(0,1,0,0);tw.push(1-w,w,0,0);}
    thumbGeometry.translate(...thumb.position.toArray());thumbGeometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(ti,4));thumbGeometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(tw,4));
    const thumbSurface=new THREE.SkinnedMesh(thumbGeometry,unmappedSkin);thumbSurface.name=thumb.name+'-smooth-surface';thumbSurface.castShadow=thumbSurface.receiveShadow=true;thumbSurface.frustumCulled=false;hand.add(thumbSurface);
    const thumbSkeleton=new THREE.Skeleton([thumb,thumbTip]);hand.updateWorldMatrix(true,true);thumbSurface.bind(thumbSkeleton);skeletons.push(thumbSkeleton);
    soft([.013,.017,.003],"#edc9ae",thumbTip,[0,-.030,-.017],{roughness:.49});thumb.rotation.z=side*.45;
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
  const relaxedTargets=arms.map(arm=>{
    const side=arm.userData.side;
    const upper=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.055,0,side*.11));
    const elbow=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.23,0,0));
    const lower=upper.clone().multiply(elbow);
    // Palms face the thighs, with a soft elbow and a natural finger curl.
    const hand=new THREE.Quaternion().setFromEuler(new THREE.Euler(.045,-side*1.28,0));
    const offset=new THREE.Vector3(0,-UPPER_ARM,0).applyQuaternion(upper);
    const wrist=arm.position.clone().add(offset).add(new THREE.Vector3(0,-FOREARM,0).applyQuaternion(lower));
    return {upper,elbow,hand,wrist,orientation:lower.clone().multiply(hand),pole:offset.normalize()};
  });
  let faceSleep=0;
  const waveHand=new THREE.Quaternion();
  const clamp=(value,fallback=0)=>THREE.MathUtils.clamp(Number.isFinite(value)?value:fallback,0,1);
  function update(){for(const arm of arms)arm.userData.bendBone.quaternion.identity().slerp(arm.userData.elbow.quaternion,.5);root.updateMatrixWorld(true);for(const skeleton of skeletons)skeleton.update();}

  const wristTarget=new THREE.Vector3(),direction=new THREE.Vector3(),pole=new THREE.Vector3(),bend=new THREE.Vector3(),lowerDirection=new THREE.Vector3();
  const upperRotation=new THREE.Quaternion(),lowerRotation=new THREE.Quaternion(),relativeRotation=new THREE.Quaternion();
  const bodyRotation=new THREE.Quaternion(),handRotation=new THREE.Quaternion();
  const deskHandRotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI/2,0,0));
  const restHandRotation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(-1,0,0),new THREE.Vector3(0,0,-1),new THREE.Vector3(0,-1,0))).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-.16));
  const chairElbowPole=side=>new THREE.Vector3(side*.15,.28,-1);
  const ease=value=>{const t=clamp(value);return t*t*t*(10+t*(-15+6*t));};
  const localHand=new THREE.Quaternion();
  function currentArm(arm){
    update();
    body.getWorldQuaternion(bodyRotation).invert();
    arm.userData.hand.getWorldQuaternion(localHand).premultiply(bodyRotation);
  }
  function fingersPose(hand,openness){
    const open=clamp(openness);
    hand.userData.fingers.forEach((finger,i)=>{
      finger.rotation.set(THREE.MathUtils.lerp(-.18-i*.015,-.035,open),0,THREE.MathUtils.lerp(0,[-.052,-.016,.018,.056][i],open));
      finger.getObjectByName(finger.name+'-middle').rotation.set(THREE.MathUtils.lerp(-.38,-.065,open),0,0);
      finger.getObjectByName(finger.name+'-tip').rotation.set(THREE.MathUtils.lerp(-.24,-.04,open),0,0);
    });
    const side=arms.find(arm=>arm.userData.hand===hand).userData.side;
    hand.userData.thumb.rotation.set(THREE.MathUtils.lerp(-.20,-.10,open),0,side*THREE.MathUtils.lerp(.48,.72,open));
    hand.userData.thumbTip.rotation.set(THREE.MathUtils.lerp(-.30,-.10,open),0,0);
  }

  function restingFingers(hand,pressure=0,amount=1){
    const blend=clamp(amount),flatten=clamp(pressure);
    const side=arms.find(arm=>arm.userData.hand===hand).userData.side;
    hand.userData.fingers.forEach((finger,i)=>{
      const digit=side>0?i:3-i;
      // The finger bases stay above the padding; only the tips drape over
      // its rounded front edge. The thumb curls around the inner side.
      finger.rotation.x=THREE.MathUtils.lerp(finger.rotation.x,[.025,.015,.017,.020][digit]*(1-flatten*.45),blend);
      finger.rotation.z=THREE.MathUtils.lerp(finger.rotation.z,[-.020,-.008,.008,.020][i],blend);
      const middle=finger.getObjectByName(finger.name+'-middle'),tip=finger.getObjectByName(finger.name+'-tip');
      middle.rotation.x=THREE.MathUtils.lerp(middle.rotation.x,-.04,blend);
      tip.rotation.x=THREE.MathUtils.lerp(tip.rotation.x,[-.09,-.24,-.26,-.17][digit],blend);
    });
    hand.userData.thumb.rotation.x=THREE.MathUtils.lerp(hand.userData.thumb.rotation.x,-.28,blend);
    hand.userData.thumb.rotation.z=THREE.MathUtils.lerp(hand.userData.thumb.rotation.z,side*.50,blend);
    hand.userData.thumbTip.rotation.x=THREE.MathUtils.lerp(hand.userData.thumbTip.rotation.x,-.22,blend);
  }

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

  const restTargets=arms.map(arm=>({wrist:new THREE.Vector3(arm.userData.side*.55,SHOULDER_HEIGHT-.362,.185),pole:chairElbowPole(arm.userData.side)}));

  function pose(amount){
    const standing=clamp(amount,1),rising=chairRise(standing),angle=(1-rising.extension)*Math.PI/2,armStanding=rising.release;
    body.position.x=0;
    body.position.y=-THIGH*(1-Math.cos(angle))-rising.cushion;
    body.position.z=0;
    for(const leg of legs){leg.rotation.set(-angle,0,0);leg.userData.knee.rotation.set(angle,0,0);leg.userData.ankle.rotation.set(0,0,0);}
    for(const [index,arm] of arms.entries()){
      arm.position.set(arm.userData.side*SHOULDER_OFFSET,SHOULDER_HEIGHT,-.008);
      arm.quaternion.copy(relaxedTargets[index].upper);
      arm.userData.elbow.position.copy(elbowPosition);arm.userData.elbow.quaternion.copy(relaxedTargets[index].elbow);
      arm.userData.hand.position.copy(handPosition);arm.userData.hand.quaternion.copy(relaxedTargets[index].hand);
      fingersPose(arm.userData.hand,0);
    }
    arms.forEach((arm,index)=>reachArm(arm,restTargets[index].wrist,restTargets[index].pole,restHandRotation,1-armStanding));
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
      reachArm(arms[index],wristTarget,chairElbowPole(arms[index].userData.side),handRotation,blend);
      restingFingers(arms[index].userData.hand,0,blend);
    });
    update();
  }

  function seatedHands(workAmount,chairTargets,deskTargets,time=0){
    const work=clamp(workAmount);
    body.updateWorldMatrix(true,false);
    body.getWorldQuaternion(bodyRotation).invert();
    const restOrientation=root.getWorldQuaternion(new THREE.Quaternion()).multiply(restHandRotation).premultiply(bodyRotation);
    const deskOrientation=bodyRotation.clone().multiply(deskHandRotation);
    arms.forEach((arm,index)=>{
      const transfer=work+Math.sin(Math.PI*work)*.045*(index===0?1:-1);
      const start=body.worldToLocal(chairTargets[index].clone());
      const end=body.worldToLocal(deskTargets[index].clone());
      const wrist=start.clone().lerp(end,transfer);
      // Lift clear of both surfaces before crossing between chair and desk.
      wrist.y+=.12*Math.sin(Math.PI*transfer)**2;
      // Keep the elbow behind the hand while it lowers from the armrest
      // toward the desk. Both hints point backward, avoiding a pole flip.
      const elbowHint=chairElbowPole(arm.userData.side).lerp(new THREE.Vector3(arm.userData.side*.12,-1,-.28),transfer);
      reachArm(arm,wrist,elbowHint,restOrientation.clone().slerp(deskOrientation,transfer));
      fingersPose(arm.userData.hand,1);
      restingFingers(arm.userData.hand,0,1-transfer);
      if(transfer>.95)arm.userData.hand.userData.fingers.forEach((finger,i)=>{
        finger.rotation.x=-.085-.025*Math.pow(Math.max(0,Math.sin(time*(index?3.8:2.1)+i*.8)),8)*(index===1||i===1?1:0);
      });
    });
    update();
  }

  function risePose(standing,targets){
    const {release}=chairRise(standing);
    if(release===1){update();return release;}
    body.updateWorldMatrix(true,false);
    body.getWorldQuaternion(bodyRotation).invert();
    root.getWorldQuaternion(handRotation).multiply(restHandRotation).premultiply(bodyRotation);
    arms.forEach((arm,index)=>{
      const side=arm.userData.side;
      const handRelease=interval(.42+index*.018,.86,standing);
      const lift=interval(.42+index*.018,.55+index*.018,standing);
      const carry=interval(.52+index*.012,.86,standing);
      wristTarget.copy(targets[index]);body.worldToLocal(wristTarget);
      const relaxed=relaxedTargets[index];
      wristTarget.lerp(relaxed.wrist,carry);
      // Lift off the padding before carrying the hands toward the thighs.
      // Turning the palms downward while still over the armrest cut the
      // fingertips through its front edge during the previous release.
      wristTarget.y+=.070*lift*(1-carry);
      wristTarget.z+=.018*Math.sin(Math.PI*carry)**2;
      const orientation=handRotation.clone().slerp(relaxed.orientation,interval(.62+index*.012,.86,standing));
      const elbowHint=chairElbowPole(side).lerp(relaxed.pole,carry);
      reachArm(arm,wristTarget,elbowHint,orientation);
      fingersPose(arm.userData.hand,0);
      restingFingers(arm.userData.hand,interval(.06,.35,standing)*(1-handRelease),1-carry);
    });
    update();return release;
  }

  function greetPose(amount,time=0,armIndex=0){
    const blend=clamp(amount); if(!blend)return blend;
    const arm=arms[armIndex],hand=arm.userData.hand,side=arm.userData.side,seconds=Number.isFinite(time)?time:0;
    currentArm(arm);
    const startUpper=arm.quaternion.clone(),startElbow=arm.userData.elbow.quaternion.clone();
    const motion=waveMotion(seconds),activity=interval(.65,1,blend);
    // Animate the joints, rather than rocking an isolated palm around a
    // fixed wrist. The upper arm stays close; the bent forearm carries the
    // side-to-side arc, with a small delayed rotation through the wrist.
    const upperDirection=new THREE.Vector3(side*(.43+.025*motion.shoulder*activity),-.54,.725).normalize();
    const forearmDirection=new THREE.Vector3(side*(.08+.32*motion.forearm*activity),1,-.14).normalize();
    // A shared bend axis keeps the elbow a hinge. The shortest rotation
    // from DOWN to an almost vertical forearm flips its axial twist.
    const hinge=new THREE.Vector3().crossVectors(forearmDirection,upperDirection).normalize();
    const upperY=upperDirection.clone().negate(),lowerY=forearmDirection.clone().negate();
    const endUpper=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(hinge,upperY,new THREE.Vector3().crossVectors(hinge,upperY)));
    const forearmRotation=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(hinge,lowerY,new THREE.Vector3().crossVectors(hinge,lowerY)));
    const endElbow=endUpper.clone().invert().multiply(forearmRotation);
    const fingerDirection=forearmDirection.clone().applyAxisAngle(new THREE.Vector3(0,0,1),side*.075*(motion.wrist-motion.forearm)*activity);
    const handY=fingerDirection.negate(),handZ=new THREE.Vector3(0,0,1);
    handZ.addScaledVector(handY,-handZ.dot(handY)).normalize();
    const handX=new THREE.Vector3().crossVectors(handY,handZ).normalize();
    waveHand.setFromRotationMatrix(new THREE.Matrix4().makeBasis(handX,handY,handZ));
    waveHand.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),side*(.07+.10*motion.wrist*activity)));
    const upperLift=blend**.82,elbowLift=blend**1.08,palmLift=blend**1.18;
    const orientation=localHand.clone().slerp(waveHand,palmLift);
    arm.quaternion.copy(startUpper).slerp(endUpper,upperLift);
    arm.userData.elbow.quaternion.copy(startElbow).slerp(endElbow,elbowLift);
    hand.quaternion.copy(arm.quaternion).multiply(arm.userData.elbow.quaternion).invert().multiply(orientation);
    hand.userData.fingers.forEach((finger,i)=>{
      const pinky=side>0?3-i:i,curl=pinky*.015;
      finger.rotation.x=THREE.MathUtils.lerp(finger.rotation.x,-.045-curl,palmLift);
      finger.rotation.z=THREE.MathUtils.lerp(finger.rotation.z,[-.10,-.028,.028,.10][i],palmLift);
      finger.getObjectByName(finger.name+'-middle').rotation.x=THREE.MathUtils.lerp(finger.getObjectByName(finger.name+'-middle').rotation.x,-.07-curl,palmLift);
      finger.getObjectByName(finger.name+'-tip').rotation.x=THREE.MathUtils.lerp(finger.getObjectByName(finger.name+'-tip').rotation.x,-.04-curl*.5,palmLift);
    });
    hand.userData.thumb.rotation.z=THREE.MathUtils.lerp(hand.userData.thumb.rotation.z,side*.65,palmLift);
    hand.userData.thumb.rotation.x=THREE.MathUtils.lerp(hand.userData.thumb.rotation.x,-.14,palmLift);
    hand.userData.thumbTip.rotation.x=THREE.MathUtils.lerp(hand.userData.thumbTip.rotation.x,-.15,palmLift);
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

  // Solve against a world-space contact so a moving pelvis cannot skate
  // the supporting foot along the floor.
  function reachLeg(leg,target,orientation){
    const ankleTarget=root.localToWorld(target.clone());body.worldToLocal(ankleTarget);ankleTarget.sub(leg.position);
    const distance=THREE.MathUtils.clamp(ankleTarget.length(),.071,THIGH+SHIN-.00001),axis=ankleTarget.normalize();
    const along=(THIGH*THIGH-SHIN*SHIN+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,THIGH*THIGH-along*along));
    const kneePole=new THREE.Vector3(0,0,1).addScaledVector(axis,-axis.z).normalize();
    const upper=axis.clone().multiplyScalar(along).addScaledVector(kneePole,height),lower=axis.clone().multiplyScalar(distance).sub(upper);
    const hipRotation=new THREE.Quaternion().setFromUnitVectors(DOWN,upper.normalize()),shinRotation=new THREE.Quaternion().setFromUnitVectors(DOWN,lower.normalize());
    leg.quaternion.copy(hipRotation);leg.userData.knee.quaternion.copy(hipRotation).invert().multiply(shinRotation);
    const inverseBody=body.getWorldQuaternion(new THREE.Quaternion()).invert();
    const footOrientation=inverseBody.multiply(root.getWorldQuaternion(new THREE.Quaternion())).multiply(orientation);
    leg.userData.ankle.quaternion.copy(shinRotation).invert().multiply(footOrientation);
  }

  function swivelPose(turn){
    const {footLag}=chairSwivel(turn),envelope=Math.sin(Math.PI*turn);
    body.updateWorldMatrix(true,false);
    legs.forEach((leg,index)=>{
      const angle=footLag+leg.userData.side*.035*Math.sin(2*Math.PI*turn)*envelope;
      const foot=new THREE.Vector3(leg.position.x,0,THIGH+.22).applyAxisAngle(new THREE.Vector3(0,1,0),angle);
      foot.y=.16+.025*Math.sin(2*Math.PI*turn+index*Math.PI/2)**2*envelope;
      foot.z-=.22;
      reachLeg(leg,foot,new THREE.Quaternion().setFromEuler(new THREE.Euler(0,angle,0)));
    });
    update();
  }

  function walkPose(amount, travel=1.7){
    const t=clamp(amount),envelope=Math.sin(Math.PI*t);
    const {step,raw,fraction,advance}=walkPath(t);
    const feet=legs.map(leg=>{
      const left=leg.userData.side<0;
      const active=left ? step===0 || step===2 : step===1 || step===3;
      const starts=left ? [0,1/3,1/3,1] : [0,0,2/3,2/3];
      const ends=left ? [1/3,1/3,1,1] : [0,2/3,2/3,1];
      const plant=THREE.MathUtils.lerp(starts[step],ends[step],fraction);
      const toeOff=.22*interval(.04,.16,raw)*(1-interval(.24,.48,raw));
      const heelLanding=-.12*interval(.60,.84,raw)*(1-interval(.88,1,raw));
      const roll=active ? toeOff+heelLanding : 0;
      // Rotate around the toe at push-off and around the heel at landing.
      // The ankle alone is not a ground pivot: it drove the clog sole
      // through the floor in the previous sine-wave foot rotation.
      const pivot=roll>0?.402:-.200;
      const pivotY=.16*(Math.cos(roll)-1)+pivot*Math.sin(roll);
      const pivotZ=pivot*(1-Math.cos(roll))+.16*Math.sin(roll);
      const clearance=active?.085*Math.sin(Math.PI*raw)**1.2*interval(.10,.24,raw)*(1-interval(.78,.94,raw)):0;
      return {leg,z:(plant-advance)*travel+pivotZ,lift:clearance+pivotY,roll};
    });
    const reach=Math.max(...feet.map(foot=>Math.abs(foot.z)));
    const lead=(feet[0].z-feet[1].z)/(travel/3);
    const load=Math.sin(Math.PI*raw)**2*envelope;
    body.position.y=Math.min(-.012*envelope-.018*load,Math.sqrt(Math.max(.01,(THIGH+SHIN)**2-reach*reach))-(THIGH+SHIN)-.006*envelope);
    body.position.x=(step%2===0?.021:-.021)*load;
    body.rotation.set(.018*envelope,-.025*lead*envelope,(step%2===0?-.010:.010)*load);body.scale.y=1;
    body.updateWorldMatrix(true,false);
    for(const {leg,z,lift,roll} of feet){
      reachLeg(leg,new THREE.Vector3(leg.position.x,.16+lift,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(roll,0,0)));
    }
    // The arm opposite the leading foot comes forward. A soft elbow and
    // small wrist counter-rotation keep the hands relaxed.
    const swing=THREE.MathUtils.clamp(lead,-1,1)*envelope;
    for(const [index,arm] of arms.entries()){
      arm.quaternion.copy(relaxedTargets[index].upper);
      arm.rotation.x-=arm.userData.side*.22*swing;
      arm.userData.elbow.quaternion.copy(relaxedTargets[index].elbow);arm.userData.elbow.rotation.x-=.055*Math.abs(swing);
      arm.userData.hand.quaternion.copy(relaxedTargets[index].hand);
      arm.userData.hand.rotation.x+=arm.userData.side*.025*swing;
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
  return {root,body,head,arms,legs,pose,portraitPose,greetPose,restPose,walkPose,swivelPose,deskPose,armrestPose,seatedHands,risePose,glasses,eyes,rigDimensions,getWorldWrists,faceMesh,faceBounds,faceUV:mapping,setFaceMap,headphones,blinkPose,updateFace};
}
