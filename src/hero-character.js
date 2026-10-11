import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const C = {
  skin: "#d4a17c", skinShade: "#bb8666", hair: "#232326",
  shirt: "#f04e5c", neckline: "#de3e4b", jeans: "#30373f",
  shoe: "#2d363e", sole: "#f4eedf", frame: "#242a30",
};
const DOWN = new THREE.Vector3(0, -1, 0);
const UPPER_ARM=.53, FOREARM=.44, THIGH=.68, SHIN=.59, HIP_HEIGHT=1.43;
const HEAD_SCALE=.72, HEAD_HEIGHT=3.10;

// Body advance follows the midpoint of successive foot plants. The last step
// brings both shoes together rather than sliding into the final stance.
export function walkPath(amount) {
  const phase = THREE.MathUtils.clamp(amount, 0, 1) * 4;
  const step = Math.min(3, Math.floor(phase));
  const fraction = THREE.MathUtils.smoothstep(phase - step, 0, 1);
  const stations = [0, 1 / 6, 1 / 2, 5 / 6, 1];
  return { step, fraction, advance: THREE.MathUtils.lerp(stations[step], stations[step + 1], fraction) };
}

/** Original stylized human hero, with a separate adult rig and wearable accessories. */
export function createHeroCharacter({ mesh, mat, box, rod, texture }, seated = false) {
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

  const shirtMap = texture((ctx, w, h) => {
    ctx.fillStyle = C.shirt;
    ctx.fillRect(0, 0, w, h);
    // Small irregular overlapping cloud patches, with no repeating icon marks.
    // Each outline is different; edge copies keep the wrap seam continuous.
    let seed=9143;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const colors=["#d83547","#e13e50","#f56370"];
    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 12; col++) {
        const x=(col+.5+(row%2)*.25)*w/12+(random()-.5)*38;
        const y=(row+.5)*h/12+(random()-.5)*38;
        const radius=38+random()*25,aspect=.72+random()*.5;
        const outline=Array.from({length:12},(_,i)=>{
          const a=i*Math.PI/6,r=.65+random()*.5;
          return [Math.cos(a)*r,Math.sin(a)*r*aspect];
        });
        const color=colors[Math.floor(random()*colors.length)];
        for(const dx of [-w,0,w]) for(const dy of [-h,0,h]) {
          ctx.fillStyle=color;
          const last=outline[outline.length-1],first=outline[0];
          ctx.beginPath();
          ctx.moveTo(x+dx+(last[0]+first[0])*radius/2,y+dy+(last[1]+first[1])*radius/2);
          outline.forEach((p,i)=>{
            const next=outline[(i+1)%outline.length];
            ctx.quadraticCurveTo(x+dx+p[0]*radius,y+dy+p[1]*radius,x+dx+(p[0]+next[0])*radius/2,y+dy+(p[1]+next[1])*radius/2);
          });
          ctx.closePath();ctx.fill();
        }
      }
    }
  }, 1024, 1024);
  shirtMap.wrapS = shirtMap.wrapT = THREE.RepeatWrapping;
  const shirtMaterial = mat("#ffffff", { map: shirtMap, roughness: 1 });

  // An adult oval/square silhouette: a flatter mid-face and a tapered mandible
  // meet a distinct broad chin, without spherical cheek pieces.
  const faceProfile=[[-.655,0,0],[-.63,.155,.115],[-.585,.248,.208],[-.49,.336,.29],[-.34,.413,.345],[-.15,.485,.395],[.075,.526,.41],[.26,.522,.398],[.43,.484,.362],[.56,.378,.282],[.635,.22,.161],[.68,0,0]];
  function faceRadii(y){
    const index=faceProfile.findIndex(point=>point[0]>=y);
    if(index<=0)return [0,0];
    const a=faceProfile[index-1],b=faceProfile[index],span=b[0]-a[0],t=(y-a[0])/span;
    return [1,2].map(axis=>{
      const before=faceProfile[Math.max(0,index-2)],after=faceProfile[Math.min(faceProfile.length-1,index+1)];
      const ma=(b[axis]-before[axis])/(b[0]-before[0]),mb=(after[axis]-a[axis])/(after[0]-a[0]);
      return Math.max(0,(2*t*t*t-3*t*t+1)*a[axis]+(t*t*t-2*t*t+t)*span*ma+(-2*t*t*t+3*t*t)*b[axis]+(t*t*t-t*t)*span*mb);
    });
  }
  const faceSurface=(x,y)=>{
    const [rx,rz]=faceRadii(y);
    if(!rx)return 0;
    const cheek=.022*Math.exp(-(((Math.abs(x)-.29)/.13)**2)-((y+.16)/.17)**2);
    return rz*Math.pow(Math.max(0,1-(x/rx)**2),.375)+cheek;
  };
  const facePositions=[],faceIndices=[],faceRows=64,faceSides=80;
  for(let row=0;row<=faceRows;row++){
    const y=-.655+(1.335*row/faceRows),[rx,rz]=faceRadii(y);
    for(let col=0;col<=faceSides;col++){
      const angle=col/faceSides*Math.PI*2,sine=Math.sin(angle);
      const x=rx*Math.cos(angle);
      facePositions.push(x,y,sine>=0?faceSurface(x,y):rz*sine);
      if(row<faceRows&&col<faceSides){const a=row*(faceSides+1)+col,b=a+faceSides+1;faceIndices.push(a,b,a+1,b,b+1,a+1);}
    }
  }
  const face=new THREE.BufferGeometry();
  face.setAttribute("position",new THREE.Float32BufferAttribute(facePositions,3));
  face.setIndex(faceIndices);face.computeVertexNormals();
  mesh(face,mat(C.skin,{roughness:1}),head).name="adult-profile-face";
  for (const side of [-1, 1]) {
    soft([.066,.114,.061],C.skin,head,[side*.514,-.014,-.018]);
    soft([.019,.054,.014],C.skinShade,head,[side*.548,-.024,.025]);
  }

  // A close fitted scalp supports distinct tapered S-shaped locks and short sides.
  // Locks are merged into one draw call; none are toroidal rings or spheres.
  function hairLimit(phi){
    const front=Math.max(0,Math.sin(phi)),back=Math.max(0,-Math.sin(phi));
    return 1.43-.24*front*front+.20*back+.016*Math.sin(phi*7.1)+.012*Math.sin(phi*19);
  }
  function scalp(theta,phi){
    const sine=Math.sin(phi),front=Math.max(0,sine);
    const y=.699*Math.cos(theta)+.017+.012*Math.sin(phi*2.3)*Math.sin(theta)*front;
    const [faceX,faceZ]=faceRadii(y);
    const rx=Math.max(.55*Math.sin(theta),faceX>0?faceX+.019:0);
    const rz=Math.max(.435*Math.sin(theta),faceZ>0?faceZ+.033:0);
    return new THREE.Vector3(rx*Math.cos(phi),y,rz*(sine>=0?Math.pow(sine,.75):sine));
  }
  function scalpNormal(p){return new THREE.Vector3(p.x/.55**2,(p.y-.017)/.699**2,p.z/.435**2).normalize();}
  const hp=[],hi=[],hairRows=40,hairSides=96;
  for(let row=0;row<=hairRows;row++)for(let col=0;col<=hairSides;col++){
    const phi=col/hairSides*Math.PI*2,p=scalp(row/hairRows*hairLimit(phi),phi);
    hp.push(p.x,p.y,p.z);
    if(row<hairRows&&col<hairSides){const a=row*(hairSides+1)+col,b=a+hairSides+1;hi.push(a,a+1,b,a+1,b+1,b);}
  }
  const scalpGeometry=new THREE.BufferGeometry();
  scalpGeometry.setAttribute("position",new THREE.Float32BufferAttribute(hp,3));
  scalpGeometry.setIndex(hi);scalpGeometry.computeVertexNormals();
  mesh(scalpGeometry,mat("#202126",{roughness:.90}),head).name="hero-fitted-scalp";
  const locks=[];
  for(let i=0;i<88;i++){
    const phi0=i*2.399963229728653,front=Math.max(0,Math.sin(phi0));
    const limit=hairLimit(phi0);
    const start=i<60?.09+Math.sqrt((i+.5)/60)*.91:limit-.30-.04*Math.sin(i*1.3);
    const end=Math.min(limit-.015,start+.27+.09*Math.sin(i*1.9));
    const points=[];
    for(let j=0;j<=24;j++){
      const t=j/24,theta=THREE.MathUtils.lerp(start,end,t);
      const phi=phi0+.085*Math.sin(t*Math.PI*1.5+i*.79)+.024*Math.sin(t*Math.PI*3.3+i*1.3);
      const p=scalp(theta,phi),normal=scalpNormal(p);
      // Raised asymmetrical top locks and tight sides produce a tapered cut.
      const lift=(.014+.030*front+.025*(1-start))*Math.sin(Math.PI*t)**.65+.007;
      p.addScaledVector(normal,lift);points.push(p);
    }
    const path=new THREE.CatmullRomCurve3(points),frames=path.computeFrenetFrames(24,false);
    const positions=[],uvs=[],indices=[],sides=10;
    for(let row=0;row<=24;row++){
      const t=row/24,p=path.getPointAt(t);
      const taper=.12+.88*Math.sin(Math.PI*t)**.55;
      const width=(.032+.016*front+.008*Math.sin(i*1.2))*taper;
      const depth=(.011+.011*front)*taper;
      const normal=scalpNormal(p),tangent=frames.tangents[row];
      const across=new THREE.Vector3().crossVectors(tangent,normal).normalize();
      const outward=new THREE.Vector3().crossVectors(across,tangent).normalize();
      for(let col=0;col<=sides;col++){
        const angle=col/sides*Math.PI*2;
        const q=p.clone().addScaledVector(across,Math.cos(angle)*width).addScaledVector(outward,Math.sin(angle)*depth);
        positions.push(q.x,q.y,q.z);uvs.push(col/sides,t);
        if(row<24&&col<sides){const a=row*(sides+1)+col,b=a+sides+1;indices.push(a,a+1,b,a+1,b+1,b);}
      }
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();locks.push(geometry);
  }
  const lockGeometry=mergeGeometries(locks);locks.forEach(geometry=>geometry.dispose());
  mesh(lockGeometry,mat(C.hair,{roughness:.78}),head).name="hero-organic-wave-locks";

  // Rigid acetate eyewear has its own bridge, bevelled rims and temple arms.
  // Lenses sit on an independent gently bowed plane with a real air gap.
  const glasses=new THREE.Group();glasses.name="hero-sunglasses";head.add(glasses);
  function rectangle(w,h,r){
    const shape=new THREE.Shape();
    shape.moveTo(-w/2+r,-h/2);shape.lineTo(w/2-r,-h/2);
    shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);shape.lineTo(w/2,h/2-r);
    shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2);shape.lineTo(-w/2+r,h/2);
    shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);shape.lineTo(-w/2,-h/2+r);
    shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return shape;
  }
  for(const side of [-1,1]){
    const frameGroup=new THREE.Group();frameGroup.position.set(side*.228,.074,.477);frameGroup.rotation.y=side*.16;glasses.add(frameGroup);
    const outer=rectangle(.442,.292,.055),inner=rectangle(.397,.248,.039);
    const hole=new THREE.Path(inner.getPoints(16).reverse());outer.holes.push(hole);
    const rim=new THREE.ExtrudeGeometry(outer,{depth:.020,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.006,bevelThickness:.006,curveSegments:14});rim.translate(0,0,-.008);
    mesh(rim,mat("#171b20",{roughness:.30}),frameGroup).name="hero-acetate-rim";
    const lensGeometry=new THREE.ShapeGeometry(inner,20),lp=lensGeometry.attributes.position;
    for(let j=0;j<lp.count;j++)lp.setZ(j,.005-.008*(lp.getX(j)/.199)**2);
    lensGeometry.computeVertexNormals();
    mesh(lensGeometry,mat("#0d1520",{roughness:.14,metalness:.25,side:THREE.DoubleSide}),frameGroup).name="hero-sunglass-lens";
    const glint=new THREE.PlaneGeometry(.102,.008);glint.rotateZ(-.19);
    mesh(glint,new THREE.MeshBasicMaterial({color:"#becbd3",transparent:true,opacity:.18,depthWrite:false}),frameGroup,[-.035,.062,.019]);
    box([.035,.026,.027],"#414650",glasses,[side*.443,.115,.440],.006).name="hero-sunglass-hinge";
    curve([[side*.45,.116,.432],[side*.522,.109,.244],[side*.548,.084,.052],[side*.541,.047,-.065],[side*.525,.005,-.088]],.017,"#171b20",glasses,{roughness:.32});
    soft([.016,.027,.018],"#c7a58a",glasses,[side*.047,.032,.452],{roughness:.53});
    const eye=new THREE.Group(),open=new THREE.Group();eye.visible=false;eye.add(open);head.add(eye);
    const closed=mesh(new THREE.PlaneGeometry(.01,.01),new THREE.MeshBasicMaterial({transparent:true,opacity:0}),eye);closed.visible=false;eyes.push({root:eye,open,closed});
  }
  curve([[-.035,.130,.510],[0,.141,.515],[.035,.130,.510]],.018,"#171b20",glasses,{roughness:.32});

  // A shaped nasal bridge, small alae and defined lips keep the face human.
  const np=[],ni=[],noseRows=24,noseSides=28;
  const noseProfile=[[0,-.174,0],[.032,-.155,.015],[.065,-.124,.054],[.054,-.071,.060],[.032,.015,.037],[.024,.100,.016],[0,.133,0]];
  const noseSpline=new THREE.CatmullRomCurve3(noseProfile.map(v=>new THREE.Vector3(...v)));
  for(let row=0;row<=noseRows;row++){
    const p=noseSpline.getPoint(row/noseRows),rx=Math.max(0,p.x),rz=Math.max(0,p.z),base=faceSurface(0,p.y)+.005;
    for(let col=0;col<=noseSides;col++){
      const phi=col/noseSides*Math.PI*2;np.push(rx*Math.cos(phi),p.y,base+rz+rz*Math.sin(phi));
      if(row<noseRows&&col<noseSides){const a=row*(noseSides+1)+col,b=a+noseSides+1;ni.push(a,b,a+1,b,b+1,a+1);}
    }
  }
  const noseGeometry=new THREE.BufferGeometry();noseGeometry.setAttribute("position",new THREE.Float32BufferAttribute(np,3));noseGeometry.setIndex(ni);noseGeometry.computeVertexNormals();
  mesh(noseGeometry,mat(C.skin,{roughness:.93}),head).name="hero-shaped-nose";
  for(const side of [-1,1])soft([.027,.023,.025],C.skin,head,[side*.052,-.132,faceSurface(side*.052,-.132)+.024]);
  function facePatch(shape,color,centerY,offset,options={}){
    const source=new THREE.ShapeGeometry(shape,16),sp=source.attributes.position,si=source.index;
    const positions=[],normals=[];
    function triangle(a,b,c,level){
      if(level){const ab=a.clone().add(b).multiplyScalar(.5),bc=b.clone().add(c).multiplyScalar(.5),ca=c.clone().add(a).multiplyScalar(.5);triangle(a,ab,ca,level-1);triangle(ab,b,bc,level-1);triangle(ca,bc,c,level-1);triangle(ab,bc,ca,level-1);return;}
      for(const point of [a,b,c]){
        const x=point.x,y=point.y+centerY;
        positions.push(x,y,faceSurface(x,y)+offset);
        const normal=new THREE.Vector3(-(faceSurface(x+.001,y)-faceSurface(x-.001,y))/.002,-(faceSurface(x,y+.001)-faceSurface(x,y-.001))/.002,1).normalize();
        normals.push(normal.x,normal.y,normal.z);
      }
    }
    for(let i=0;i<si.count;i+=3)triangle(new THREE.Vector3().fromBufferAttribute(sp,si.getX(i)),new THREE.Vector3().fromBufferAttribute(sp,si.getX(i+1)),new THREE.Vector3().fromBufferAttribute(sp,si.getX(i+2)),2);
    source.dispose();
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute("normal",new THREE.Float32BufferAttribute(normals,3));
    const patch=mesh(geometry,mat(color,{roughness:.94,side:THREE.DoubleSide,...options}),head);
    patch.castShadow=false;return patch;
  }
  const smile=new THREE.Shape();
  smile.moveTo(-.132,.014);smile.quadraticCurveTo(0,-.003,.132,.015);
  smile.quadraticCurveTo(.122,-.031,.066,-.035);smile.quadraticCurveTo(0,-.045,-.067,-.034);smile.quadraticCurveTo(-.12,-.029,-.132,.014);
  facePatch(smile,"#815a46",-.278,.008).name="character-smile";
  const teeth=new THREE.Shape();
  teeth.moveTo(-.105,.004);teeth.quadraticCurveTo(0,-.006,.105,.004);
  teeth.quadraticCurveTo(.066,-.019,0,-.02);teeth.quadraticCurveTo(-.068,-.019,-.105,.004);
  facePatch(teeth,"#eee2cf",-.281,.012,{roughness:.86}).name="smile-teeth";
  curve([[-.105,-.29],[0,-.327],[.105,-.289]].map(([x,y])=>[x,y,faceSurface(x,y)+.007]),.0055,"#b57c64",head);
  mesh(loft([[0,2.39,0],[.155,2.40,.139],[.150,2.51,.142],[.157,2.64,.145],[.163,2.70,.151],[0,2.72,0]],24,32),mat(C.skin,{roughness:.96}),body,[0,0,-.023]).name="hero-visible-neck";
  mesh(loft([[0,1.43,0],[.294,1.434,.181],[.329,1.52,.216],[.345,1.82,.229],[.409,2.18,.249],[.435,2.30,.243],[.382,2.382,.208],[.204,2.421,.146],[0,2.432,0]],36,40),shirtMaterial,body).name="hero-fitted-shirt";
  soft([.286,.129,.190],C.jeans,body,[0,1.435,-.017]).name="character-hips";
  const neck=mesh(new THREE.TorusGeometry(.168,.019,10,40),mat(C.neckline,{roughness:1}),body,[0,2.424,-.007],[1,.87,1]);
  neck.rotation.x=Math.PI/2;neck.name="crew-neckline";

  for(const side of [-1,1]) {
    const arm=new THREE.Group(); arm.name=side<0?"left-arm":"right-arm";
    arm.position.set(side*.43,2.40,-.008); body.add(arm); arms.push(arm);
    mesh(loft([[0,-.35,0],[.113,-.337,.118],[.139,-.24,.146],[.155,-.086,.159],[.133,.018,.141],[.064,.079,.076],[0,.082,0]],28,32),shirtMaterial,arm);
    mesh(loft([[0,-.562,0],[.079,-.543,.083],[.087,-.462,.091],[.102,-.353,.107],[.107,-.254,.111],[0,-.226,0]],26,28),mat(C.skin,{roughness:.97}),arm);
    const elbow=new THREE.Group(); elbow.name=`${arm.name}-elbow`; elbow.position.y=-UPPER_ARM; arm.add(elbow);
    soft([.080,.078,.083],C.skin,elbow,[0,0,0]);
    mesh(loft([[0,-.468,0],[.061,-.443,.064],[.067,-.335,.071],[.085,-.134,.09],[.081,-.016,.084],[0,.039,0]],28,28),mat(C.skin,{roughness:.97}),elbow);
    const hand=new THREE.Group(); hand.name=`${arm.name}-hand`; hand.position.y=-FOREARM; elbow.add(hand);
    soft([0.092,0.103,0.064],C.skin,hand,[0,-0.091,0.012]);
    const fingers=[];
    for(let i=0;i<4;i++){
      const finger=new THREE.Group(); finger.name=`${arm.name}-finger-${i}`;
      finger.position.set(-0.056+i*0.0375,-0.163,0.011); hand.add(finger);
      const length=i===0||i===3?0.043:0.054;
      soft([0.022,length,0.034],C.skin,finger,[0,-length*0.63,0]); fingers.push(finger);
    }
    const thumb=new THREE.Group(); thumb.name=`${arm.name}-thumb`; thumb.position.set(-side*0.077,-0.085,0.025); hand.add(thumb);
    soft([0.037,0.067,0.041],C.skin,thumb,[0,-0.025,0]); thumb.rotation.z=side*0.45;
    hand.userData={fingers,thumb}; arm.userData={elbow,hand,side};

    const leg=new THREE.Group(); leg.name=side<0?"left-leg":"right-leg";
    leg.position.set(side*.171,HIP_HEIGHT,0); body.add(leg); legs.push(leg);
    const hip=new THREE.Bone(),knee=new THREE.Bone(),ankle=new THREE.Bone();
    hip.name=`${leg.name}-hip`; knee.name=`${leg.name}-knee`; ankle.name=`${leg.name}-ankle`;
    knee.position.y=-THIGH; ankle.position.y=-SHIN; hip.add(knee); knee.add(ankle);
    const geometry=loft([[0,-1.13,0],[.103,-1.115,.111],[.111,-1.04,.119],[.121,-.875,.128],[.137,-.68,.143],[.157,-.4,.166],[.172,-.12,.18],[.164,.012,.170],[0,.047,0]],48,36);
    const indices=[],weights=[];
    for(let i=0;i<geometry.attributes.position.count;i++){
      const weight=THREE.MathUtils.smoothstep(-geometry.attributes.position.getY(i),THIGH-.15,THIGH+.15);
      indices.push(0,1,0,0); weights.push(1-weight,weight,0,0);
    }
    geometry.setAttribute("skinIndex",new THREE.Uint16BufferAttribute(indices,4));
    geometry.setAttribute("skinWeight",new THREE.Float32BufferAttribute(weights,4));
    const trousers=new THREE.SkinnedMesh(geometry,mat(C.jeans,{roughness:1})); trousers.name=`${leg.name}-continuous-trousers`;
    trousers.castShadow=trousers.receiveShadow=true; trousers.frustumCulled=false;
    leg.add(trousers); trousers.add(hip);
    const skeleton=new THREE.Skeleton([hip,knee,ankle]); trousers.bind(skeleton); skeletons.push(skeleton);
    const foot=new THREE.Group(); foot.name=`${leg.name}-shoe`; ankle.add(foot);
    mesh(new THREE.CylinderGeometry(.100,.096,.19,24),mat(C.sole,{roughness:1}),foot,[0,.082,0]);
    box([.319,.09,.522],C.sole,foot,[0,-.115,.095],0.039);
    box([.30,.198,.489],C.shoe,foot,[0,-.026,.095],0.098);
    box([.209,.030,.038],C.sole,foot,[0,-.013,-.15],0.014);
    for(let i=0;i<3;i++)rod([-.061,.068,.102+i*.038],[.061,.068,.11+i*.038],0.009,C.sole,foot);
    leg.userData={hip,knee,ankle,foot,trousers,side};
  }

  const elbowPosition=new THREE.Vector3(0,-UPPER_ARM,0),handPosition=new THREE.Vector3(0,-FOREARM,0);
  const foldedTargets=arms.map(arm=>{
    const left=arm.userData.side<0;
    const upper=new THREE.Quaternion().setFromUnitVectors(DOWN,new THREE.Vector3(...(left?[0.045,-0.83,0.557]:[-0.035,-0.6,0.799])).normalize());
    const lower=new THREE.Quaternion().setFromUnitVectors(DOWN,new THREE.Vector3(...(left?[0.94,-0.12,0.32]:[-0.95,-0.06,0.3])).normalize());
    return {upper,elbow:upper.clone().invert().multiply(lower),hand:new THREE.Quaternion().setFromEuler(new THREE.Euler(0,arm.userData.side*0.16,arm.userData.side*0.06))};
  });
  const greetingTargets=arms.map(arm=>{
    const side=arm.userData.side;
    const upper=new THREE.Quaternion().setFromUnitVectors(DOWN,new THREE.Vector3(side*.3,.52,.8).normalize());
    const lower=new THREE.Quaternion().setFromUnitVectors(DOWN,new THREE.Vector3(side*.2,.92,.34).normalize());
    return {upper,elbow:upper.clone().invert().multiply(lower),inverseLower:lower.clone().invert()};
  });
  const waveHand=new THREE.Quaternion(),waveEuler=new THREE.Euler();
  const clamp=(value,fallback=0)=>THREE.MathUtils.clamp(Number.isFinite(value)?value:fallback,0,1);
  function update(){root.updateMatrixWorld(true);for(const skeleton of skeletons)skeleton.update();}

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

  const restTargets=arms.map(arm=>({wrist:new THREE.Vector3(arm.userData.side*.55,2.02,.20),pole:new THREE.Vector3(arm.userData.side,0,0)}));

  function pose(amount){
    const standing=clamp(amount,1),angle=(1-standing)*Math.PI/2;
    body.position.y=-THIGH*(1-Math.cos(angle));
    for(const leg of legs){leg.rotation.set(-angle,0,0);leg.userData.knee.rotation.set(angle,0,0);leg.userData.ankle.rotation.set(0,0,0);}
    for(const arm of arms){
      arm.position.set(arm.userData.side*.43,2.40,-.008);
      arm.rotation.set(THREE.MathUtils.lerp(-1,-0.015,standing),0,arm.userData.side*THREE.MathUtils.lerp(0.16,0.085,standing));
      arm.userData.elbow.position.copy(elbowPosition); arm.userData.elbow.rotation.set(THREE.MathUtils.lerp(-0.55,-0.09,standing),0,0);
      arm.userData.hand.position.copy(handPosition); arm.userData.hand.rotation.set(THREE.MathUtils.lerp(0.08,0.02,standing),0,0);
      arm.userData.hand.userData.fingers.forEach(finger=>finger.rotation.set(0,0,0));
      arm.userData.hand.userData.thumb.rotation.set(0,0,arm.userData.side*0.45);
    }
    arms.forEach((arm,index)=>reachArm(arm,restTargets[index].wrist,restTargets[index].pole,restHandRotation,1-standing));
    glasses.position.set(0,0,0); glasses.rotation.set(0,0,0); glasses.visible=true; head.rotation.x=0; head.rotation.z=0;
    eyes.forEach(eye=>{eye.open.scale.y=1;eye.open.visible=true;eye.closed.visible=false;eye.closed.material.opacity=0;});
    update(); return standing;
  }

  function portraitPose(amount){
    const blend=clamp(amount); if(!blend)return blend;
    arms.forEach((arm,i)=>{const target=foldedTargets[i];arm.quaternion.slerp(target.upper,blend);arm.userData.elbow.quaternion.slerp(target.elbow,blend);arm.userData.hand.quaternion.slerp(target.hand,blend);});
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
    mouseFingers.forEach(finger=>finger.rotation.x=-.60*blend);
    mouseFingers[1].rotation.x-=.15*Math.pow(Math.max(0,Math.sin(time*2.1)),8)*blend;
    arms[1].userData.hand.userData.fingers.forEach((finger,index)=>{
      finger.rotation.x=(-.52-.20*Math.pow(Math.max(0,Math.sin(time*3.8+index*.8)),4))*blend;
    });
    update();
  }

  function greetPose(amount,time=0,armIndex=0){
    const raw=clamp(amount),blend=raw*raw*(3-2*raw); if(!blend)return blend;
    const arm=arms[armIndex],hand=arm.userData.hand,target=greetingTargets[armIndex];
    arm.quaternion.slerp(target.upper,blend); arm.userData.elbow.quaternion.slerp(target.elbow,blend);
    // The palm faces +Z while the wrist waves gently from side to side.
    waveEuler.set(0,0,Math.PI+Math.sin((Number.isFinite(time)?time:0)*1.85)*.065);
    waveHand.setFromEuler(waveEuler).premultiply(target.inverseLower);
    hand.quaternion.slerp(waveHand,blend);
    hand.userData.fingers.forEach((finger,i)=>{finger.rotation.z=THREE.MathUtils.lerp(finger.rotation.z,[-0.23,-0.07,0.075,0.24][i],blend);});
    hand.userData.thumb.rotation.z=THREE.MathUtils.lerp(hand.userData.thumb.rotation.z,0.95,blend);
    update(); return blend;
  }

  function restPose(sleepAmount,time=0){
    const sleep=clamp(sleepAmount),seconds=Number.isFinite(time)?time:0;
    head.rotation.x=THREE.MathUtils.lerp(-0.035,0.245,sleep)+Math.sin(seconds*0.58)*0.009*sleep;
    head.rotation.z=Math.sin(seconds*0.5)*0.035*sleep;
    // The shades remain worn. Sleep/wake is expressed by the gentle head nod.
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
      return {leg,z:(plant-advance)*travel,lift:active?Math.sin(Math.PI*fraction)*.095:0};
    });
    const reach=Math.max(...feet.map(foot=>Math.abs(foot.z)));
    body.position.y=Math.min(-.025*envelope,Math.sqrt(Math.max(.01,(THIGH+SHIN)**2-reach*reach))-(THIGH+SHIN)-.005*envelope);
    for(const {leg,z,lift} of feet){
      const vertical=THIGH+SHIN+body.position.y-lift,distance=Math.min(THIGH+SHIN,Math.hypot(vertical,z));
      const knee=Math.acos(THREE.MathUtils.clamp((distance*distance-THIGH*THIGH-SHIN*SHIN)/(2*THIGH*SHIN),-1,1));
      const hip=Math.atan2(-z,vertical)-Math.atan2(SHIN*Math.sin(knee),THIGH+SHIN*Math.cos(knee));
      leg.rotation.x=hip; leg.userData.knee.rotation.x=knee; leg.userData.ankle.rotation.x=-hip-knee;
    }
    update(); return t;
  }

  pose(seated?0:1);
  const standingHeight=new THREE.Box3().setFromObject(root).max.y-body.position.y;
  const rigDimensions={seatedRootY:.06,standingHeight,upperArm:UPPER_ARM,forearm:FOREARM,thigh:THIGH,shin:SHIN,hipHeight:HIP_HEIGHT,headHeight:HEAD_HEIGHT,headScale:HEAD_SCALE,shoulderHeight:2.40,shoulderOffset:.43};
  const getWorldWrists=()=>{update();return arms.map(arm=>arm.userData.hand.getWorldPosition(new THREE.Vector3()));};
  return {root,body,head,arms,legs,pose,portraitPose,greetPose,restPose,walkPose,deskPose,glasses,eyes,rigDimensions,getWorldWrists};
}
