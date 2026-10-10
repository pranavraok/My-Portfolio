import * as THREE from "three";

const C = {
  skin: "#d4a17c", skinShade: "#bb8666", hair: "#232326",
  shirt: "#f04e5c", neckline: "#de3e4b", jeans: "#30373f",
  shoe: "#2d363e", sole: "#f4eedf", frame: "#242a30",
};
const DOWN = new THREE.Vector3(0, -1, 0);

// Body advance follows the midpoint of successive foot plants. The last step
// brings both shoes together rather than sliding into the final stance.
export function walkPath(amount) {
  const phase = THREE.MathUtils.clamp(amount, 0, 1) * 4;
  const step = Math.min(3, Math.floor(phase));
  const fraction = THREE.MathUtils.smoothstep(phase - step, 0, 1);
  const stations = [0, 1 / 6, 1 / 2, 5 / 6, 1];
  return { step, fraction, advance: THREE.MathUtils.lerp(stations[step], stations[step + 1], fraction) };
}

/** Original soft clay model. Pose helpers are applied after pose() each frame. */
export function createCharacter({ mesh, mat, box, rod, texture }, seated = false) {
  const root = new THREE.Group();
  root.name = "Pranav";
  const body = new THREE.Group();
  body.name = "character-body";
  root.add(body);
  const head = new THREE.Group();
  head.name = "character-head";
  head.position.y = 2.72;
  body.add(head);
  const arms = [], legs = [], skeletons = [], eyes = [];

  const soft = (size, color, parent, position, options = {}) =>
    mesh(new THREE.SphereGeometry(1, 28, 20), mat(color, { roughness: 0.95, ...options }), parent, position, size);

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
  const facePositions=[],faceIndices=[],faceRows=64,faceSides=80;
  for(let row=0;row<=faceRows;row++){
    const y=-.655+(1.335*row/faceRows),[rx,rz]=faceRadii(y);
    for(let col=0;col<=faceSides;col++){
      const angle=col/faceSides*Math.PI*2,sine=Math.sin(angle);
      facePositions.push(rx*Math.cos(angle),y,rz*(sine>=0?Math.pow(sine,.75):sine));
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

  // Fuller tousled top with open asymmetric swept waves. No concentric curl
  // loops or negative ring grooves: the sides taper into one cohesive groom.
  function scalp(theta,phi) {
    const sine=Math.sin(phi),front=Math.max(0,sine);
    const crownX=.552*Math.sin(theta)*Math.cos(phi),crownZ=.438*Math.sin(theta)*sine-.017;
    const sweep=Math.exp(-((crownX+.13)**2/.1+(crownZ-.16)**2/.1))*.043;
    const y=.681*Math.cos(theta)+.016+sweep+.006*Math.sin(phi*3.7+theta*4.1)*Math.sin(theta)*front;
    const [faceX,faceZ]=faceRadii(y);
    // The adult skull is a shaped profile, not an ellipse. Match its radii and
    // flattened front at EVERY row, while retaining the extended upper crown.
    const rx=Math.max(.552*Math.sin(theta),faceX>0?faceX+.028:0);
    const rz=Math.max(.438*Math.sin(theta),faceZ>0?faceZ+.042:0);
    return [rx*Math.cos(phi),y,rz*(sine>=0?Math.pow(sine,.75):sine)-.006];
  }
  const curlRidges=[];
  for(let i=0;i<13;i++) {
    const front=i<9,centerPhi=front?.22+(i/8)*(Math.PI-.44):Math.PI+.38+(i-9)*.56;
    const start=.15+(Math.sin(i*2.1)+1)*.11,end=front?1.02+Math.sin(i*1.8)*.085:1.24+Math.sin(i)*.06;
    const points=[];
    for(let j=0;j<=24;j++) {
      const t=j/24,theta=THREE.MathUtils.lerp(start,end,t);
      const phi=centerPhi+.22*(1-t)+Math.sin(t*Math.PI*1.35+i*1.97)*.15*Math.sqrt(t)+Math.sin(t*Math.PI*2.4+i)*.04*t;
      points.push(scalp(theta,phi));
    }
    const segments=[];
    for(let j=0;j<points.length-1;j++) {
      const a=points[j],b=points[j+1],dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2];
      segments.push({x:a[0],y:a[1],z:a[2],dx,dy,dz,inverse:1/(dx*dx+dy*dy+dz*dz)});
    }
    curlRidges.push({segments,height:front?.023:.014,widthSquared:(.038+.007*Math.sin(i*1.4))**2});
  }
  function curlRelief(x,y,z) {
    let relief=0;
    for(const ridge of curlRidges) {
      let distance=Infinity;
      for(const s of ridge.segments) {
        const t=THREE.MathUtils.clamp(((x-s.x)*s.dx+(y-s.y)*s.dy+(z-s.z)*s.dz)*s.inverse,0,1);
        const px=x-s.x-s.dx*t,py=y-s.y-s.dy*t,pz=z-s.z-s.dz*t;
        distance=Math.min(distance,px*px+py*py+pz*pz);
      }
      const raised=ridge.height*Math.exp(-distance/ridge.widthSquared);
      const bed=.006*Math.exp(-distance/(ridge.widthSquared*5));
      relief=Math.max(relief,raised+bed);
    }
    return relief;
  }
  const hp = [], hi = [], hairRows = 64, hairSides = 144;
  for (let row = 0; row <= hairRows; row++) {
    for (let col = 0; col <= hairSides; col++) {
      const phi = col / hairSides * Math.PI * 2;
      const front = Math.max(0, Math.sin(phi)), back = Math.max(0, -Math.sin(phi));
      const limit = 1.39 - 0.26 * front * front + 0.32 * back+.026*Math.sin(phi*7.3)*front;
      const theta = row / hairRows * limit;
      let [x,y,z]=scalp(theta,phi);
      const edge=THREE.MathUtils.smoothstep(row/hairRows,.88,1);
      const relief=curlRelief(x,y,z)*(1-edge*.66);
      const nx=x/(.552*.552),ny=(y-.016)/(.681*.681),nz=(z+.006)/(.438*.438);
      const length=Math.hypot(nx,ny,nz);
      x+=nx/length*relief;y+=ny/length*relief;z+=nz/length*relief;
      const templeTaper=edge*.016*(1-front*.6);
      hp.push(x*(1-templeTaper),y,z*(1-templeTaper));
      if (row < hairRows && col < hairSides) {
        const a = row * (hairSides + 1) + col, b = a + hairSides + 1;
        hi.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  const hair = new THREE.BufferGeometry();
  hair.setAttribute("position", new THREE.Float32BufferAttribute(hp, 3));
  hair.setIndex(hi); hair.computeVertexNormals();
  mesh(hair, mat(C.hair, { roughness: 0.87 }), head).name="sculpted-curly-hair";

  const glasses = new THREE.Group();
  glasses.name = "character-sunglasses";
  head.add(glasses);
  const faceSurface=(x,y)=>{
    const [rx,rz]=faceRadii(y);
    return rx>0?rz*Math.pow(Math.max(0,1-(x/rx)**2),.375):0;
  };
  function rectangle(w, h, r) {
    const s = new THREE.Shape();
    s.moveTo(-w/2+r,-h/2); s.lineTo(w/2-r,-h/2);
    s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r); s.lineTo(w/2,h/2-r);
    s.quadraticCurveTo(w/2,h/2,w/2-r,h/2); s.lineTo(-w/2+r,h/2);
    s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r); s.lineTo(-w/2,-h/2+r);
    s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
    return s;
  }
  function curvedLens(shape,centerX) {
    // Perimeter-only triangulation cuts through a convex face. Radial rings and
    // evenly spaced perimeter samples keep every interior triangle on the lens.
    const outline=shape.getSpacedPoints(96);
    outline.pop();
    const sides=outline.length,rings=16,positions=[],indices=[];
    positions.push(centerX,.064,faceSurface(centerX,.064)+.033);
    for(let ring=1;ring<=rings;ring++){
      const radius=ring/rings;
      for(const point of outline){
        const x=centerX+point.x*radius,y=.064+point.y*radius;
        positions.push(x,y,faceSurface(x,y)+.033);
      }
    }
    for(let side=0;side<sides;side++)indices.push(0,1+side,1+(side+1)%sides);
    for(let ring=1;ring<rings;ring++)for(let side=0;side<sides;side++){
      const next=(side+1)%sides;
      const a=1+(ring-1)*sides+side,b=1+ring*sides+side;
      const c=1+(ring-1)*sides+next,d=1+ring*sides+next;
      indices.push(a,b,c,b,d,c);
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    geometry.setIndex(indices);geometry.computeVertexNormals();
    return geometry;
  }
  for (const side of [-1, 1]) {
    const x = side * 0.211, eye = new THREE.Group();
    eye.name = side < 0 ? "left-eye" : "right-eye";
    eye.position.set(x,0.064,faceSurface(x,.064)); eye.visible=false; head.add(eye);
    const open = new THREE.Group(); eye.add(open);
    soft([0.12,0.1,0.034],"#fff8e9",open,[0,0,0],{roughness:0.73});
    soft([0.054,0.068,0.016],"#494138",open,[0.006,-0.005,0.036]);
    soft([0.03,0.042,0.008],"#282726",open,[0.008,-0.005,0.051]);
    soft([0.012,0.014,0.006],"#ffffff",open,[-0.008,0.021,0.06]);
    const closed = curve([[-0.106,0,0.026],[0,-0.027,0.041],[0.106,0,0.026]],0.013,C.hair,eye,{transparent:true,opacity:0,depthWrite:false});
    closed.visible=false; eyes.push({root:eye,open,closed});

    const shape=rectangle(.391,.265,.045);
    const lensGeometry=curvedLens(shape,x);
    const lens=mesh(lensGeometry,mat("#10151c",{roughness:0.18,metalness:0.22,side:THREE.DoubleSide}),glasses);
    lens.name="sunglass-lens";
    const path=new THREE.CatmullRomCurve3(shape.getPoints(10).map(p=>new THREE.Vector3(p.x+x,p.y+.064,faceSurface(p.x+x,p.y+.064)+.034)),true);
    mesh(new THREE.TubeGeometry(path,80,.014,8,true),mat("#181c21",{roughness:0.32}),glasses);
    const glareGeometry=new THREE.PlaneGeometry(.065,.007);glareGeometry.rotateZ(-.23);
    const gp=glareGeometry.attributes.position;
    for(let i=0;i<gp.count;i++){const px=gp.getX(i)+x-.04,py=gp.getY(i)+.125;gp.setXYZ(i,px,py,faceSurface(px,py)+.038);}
    mesh(glareGeometry,new THREE.MeshBasicMaterial({color:"#b8c4cc",transparent:true,opacity:0.17,depthWrite:false}),glasses);
    curve([[side*.406,.103,faceSurface(.406,.103)+.027],[side*.508,.094,.135],[side*.557,.073,-.02]],.014,"#181c21",glasses,{roughness:.32});
  }
  curve([[-.026,.101,.441],[0,.114,.448],[.026,.101,.441]],.014,"#181c21",glasses,{roughness:.32});
  soft([.041,.097,.037],C.skin,head,[0,-.014,faceSurface(0,-.014)+.005]);
  soft([.06,.056,.058],C.skin,head,[0,-.118,faceSurface(0,-.118)+.034]);
  for(const side of [-1,1]){
    const points=[[side*.008,-.227],[side*.062,-.223],[side*.111,-.237]].map(([x,y])=>[x,y,faceSurface(x,y)+.009]);
    curve(points,.0065,"#795841",head);
  }
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
  const beard=new THREE.Shape();
  beard.moveTo(-.162,.032);beard.quadraticCurveTo(0,-.011,.162,.032);
  beard.quadraticCurveTo(.084,-.014,0,-.029);beard.quadraticCurveTo(-.084,-.014,-.162,.032);
  facePatch(beard,"#76543e",-.533,.005,{transparent:true,opacity:.19,depthWrite:false}).name="subtle-chin-stubble";

  soft([.145,.15,.139],C.skin,body,[0,2.11,-.028]).name="character-neck";
  mesh(loft([[0,1.07,0],[0.338,1.075,0.205],[0.4,1.15,0.249],[0.405,1.48,0.261],[0.465,1.85,0.285],[0.474,1.97,0.263],[0.377,2.063,0.205],[0.204,2.105,0.144],[0,2.119,0]]),shirtMaterial,body);
  soft([0.34,0.125,0.215],C.jeans,body,[0,1.078,-0.018]).name="character-hips";
  const neck=mesh(new THREE.TorusGeometry(0.176,0.022,10,40),mat(C.neckline,{roughness:1}),body,[0,2.093,-0.007],[1,0.87,1]);
  neck.rotation.x=Math.PI/2; neck.name="crew-neckline";

  for(const side of [-1,1]) {
    const arm=new THREE.Group(); arm.name=side<0?"left-arm":"right-arm";
    arm.position.set(side*0.485,2.04,-0.008); body.add(arm); arms.push(arm);
    mesh(loft([[0,-0.31,0],[0.14,-0.274,0.148],[0.173,-0.14,0.173],[0.174,-0.012,0.174],[0.108,0.076,0.112],[0,0.091,0]],22,28),shirtMaterial,arm);
    soft([0.11,0.15,0.112],C.skin,arm,[0,-0.319,0]);
    const elbow=new THREE.Group(); elbow.name=`${arm.name}-elbow`; elbow.position.y=-0.43; arm.add(elbow);
    soft([0.108,0.106,0.109],C.skin,elbow,[0,0,0]);
    mesh(loft([[0,-0.366,0],[0.079,-0.343,0.082],[0.088,-0.257,0.091],[0.109,-0.079,0.111],[0.101,0.012,0.102],[0,0.04,0]],22,28),mat(C.skin,{roughness:1}),elbow);
    const hand=new THREE.Group(); hand.name=`${arm.name}-hand`; hand.position.y=-0.34; elbow.add(hand);
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
    leg.position.set(side*0.206,1.06,0); body.add(leg); legs.push(leg);
    const hip=new THREE.Bone(),knee=new THREE.Bone(),ankle=new THREE.Bone();
    hip.name=`${leg.name}-hip`; knee.name=`${leg.name}-knee`; ankle.name=`${leg.name}-ankle`;
    knee.position.y=-0.48; ankle.position.y=-0.42; hip.add(knee); knee.add(ankle);
    const geometry=loft([[0,-0.745,0],[0.149,-0.727,0.151],[0.157,-0.699,0.164],[0.172,-0.64,0.174],[0.183,-0.48,0.182],[0.2,-0.3,0.205],[0.223,-0.09,0.216],[0.209,0.004,0.202],[0,0.037,0]],40,32);
    const indices=[],weights=[];
    for(let i=0;i<geometry.attributes.position.count;i++){
      const weight=THREE.MathUtils.smoothstep(-geometry.attributes.position.getY(i),0.35,0.61);
      indices.push(0,1,0,0); weights.push(1-weight,weight,0,0);
    }
    geometry.setAttribute("skinIndex",new THREE.Uint16BufferAttribute(indices,4));
    geometry.setAttribute("skinWeight",new THREE.Float32BufferAttribute(weights,4));
    const trousers=new THREE.SkinnedMesh(geometry,mat(C.jeans,{roughness:1})); trousers.name=`${leg.name}-continuous-trousers`;
    trousers.castShadow=trousers.receiveShadow=true; trousers.frustumCulled=false;
    leg.add(trousers); trousers.add(hip);
    const skeleton=new THREE.Skeleton([hip,knee,ankle]); trousers.bind(skeleton); skeletons.push(skeleton);
    const foot=new THREE.Group(); foot.name=`${leg.name}-shoe`; ankle.add(foot);
    mesh(new THREE.CylinderGeometry(.132,.129,.22,24),mat(C.sole,{roughness:1}),foot,[0,.09,0]);
    box([0.406,0.09,0.61],C.sole,foot,[0,-0.115,0.123],0.039);
    box([0.379,0.219,0.569],C.shoe,foot,[0,-0.025,0.123],0.098);
    box([0.265,0.033,0.045],C.sole,foot,[0,-0.01,-0.161],0.014);
    for(let i=0;i<3;i++)rod([-0.077,0.081,0.139+i*0.041],[0.077,0.081,0.147+i*0.041],0.009,C.sole,foot);
    leg.userData={hip,knee,ankle,foot,trousers,side};
  }

  const elbowPosition=new THREE.Vector3(0,-0.43,0),handPosition=new THREE.Vector3(0,-0.34,0);
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
    const distance=THREE.MathUtils.clamp(direction.length(),.09001,.76999);
    direction.normalize();
    const along=(.43*.43-.34*.34+distance*distance)/(2*distance);
    const height=Math.sqrt(Math.max(0,.43*.43-along*along));
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

  const restTargets=arms.map(arm=>({wrist:new THREE.Vector3(arm.userData.side*.55,1.66,.20),pole:new THREE.Vector3(arm.userData.side,0,0)}));

  function pose(amount){
    const standing=clamp(amount,1),angle=(1-standing)*Math.PI/2;
    body.position.y=-0.48*(1-Math.cos(angle));
    for(const leg of legs){leg.rotation.set(-angle,0,0);leg.userData.knee.rotation.set(angle,0,0);leg.userData.ankle.rotation.set(0,0,0);}
    for(const arm of arms){
      arm.position.set(arm.userData.side*0.485,2.04,-0.008);
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
    waveEuler.set(0,0,Math.PI+Math.sin((Number.isFinite(time)?time:0)*2.3)*0.085);
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
    body.position.y=Math.min(-.025*envelope,Math.sqrt(Math.max(.01,.9*.9-reach*reach))-.9-.005*envelope);
    for(const {leg,z,lift} of feet){
      const vertical=0.9+body.position.y-lift,distance=Math.min(0.9,Math.hypot(vertical,z));
      const knee=Math.acos(THREE.MathUtils.clamp((distance*distance-0.48*0.48-0.42*0.42)/(2*0.48*0.42),-1,1));
      const hip=Math.atan2(-z,vertical)-Math.atan2(0.42*Math.sin(knee),0.48+0.42*Math.cos(knee));
      leg.rotation.x=hip; leg.userData.knee.rotation.x=knee; leg.userData.ankle.rotation.x=-hip-knee;
    }
    update(); return t;
  }

  pose(seated?0:1);
  return {root,body,head,arms,legs,pose,portraitPose,greetPose,restPose,walkPose,deskPose,glasses,eyes};
}
