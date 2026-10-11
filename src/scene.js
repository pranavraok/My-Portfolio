import * as THREE from "three";
import { drawComputerRadio, speakerState } from "./music.js";
import { drawDeskCode, deskCodeState } from "./desk-display.js";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import { createHeroCharacter, walkPath } from "./hero-character.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createContactScene } from "./contact-scene.js";
import { loadApprovedHead } from "./approved-avatar.js";

const C = {
  cream: "#e6eeea",
  white: "#f3f6ee",
  blue: "#b8cab8",
  ink: "#292e34",
  navy: "#315f50",
  skin: "#ba825d",
  hair: "#25211f",
  orange: "#e75c60",
  cyan: "#84dfb9",
};

export async function createScene(host, mode, getProgress) {
  if (mode === "contact") return createContactScene(host, getProgress);
  await loadApprovedHead();
  const hologram = mode === "hologram";
  const experience = mode === "experience";
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .98;
  renderer.localClippingEnabled = true;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
  const materials = new Map();
  const textures = [];
  const objects = new THREE.Group();
  scene.add(objects);
  const scanner = new THREE.Group();
  scene.add(scanner);
  const mat = (color, options = {}) => {
    const key = color + JSON.stringify(options);
    if (!materials.has(key))
      materials.set(
        key,
        new (options.sheen ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial)({ color, roughness: 0.67, ...options }),
      );
    return materials.get(key);
  };
  function mesh(
    geometry,
    material,
    parent,
    position = [0, 0, 0],
    scale = [1, 1, 1],
  ) {
    const result = new THREE.Mesh(geometry, material);
    result.position.set(...position);
    result.scale.set(...scale);
    result.castShadow = true;
    result.receiveShadow = true;
    parent.add(result);
    return result;
  }
  const box = (size, color, parent, pos, radius = 0.09) =>
    mesh(
      new RoundedBoxGeometry(
        ...size,
        3,
        Math.min(radius, Math.min(...size) / 2),
      ),
      mat(color),
      parent,
      pos,
    );
  const ball = (size, color, parent, pos) =>
    mesh(new THREE.SphereGeometry(1, 28, 20), mat(color), parent, pos, size);
  const cylinder = (rt, rb, h, color, parent, pos) =>
    mesh(new THREE.CylinderGeometry(rt, rb, h, 40), mat(color), parent, pos);
  const rod = (a, b, radius, color, parent) => {
    const start = new THREE.Vector3(...a),
      end = new THREE.Vector3(...b);
    const result = cylinder(
      radius,
      radius,
      start.distanceTo(end),
      color,
      parent,
      start.clone().add(end).multiplyScalar(0.5).toArray(),
    );
    result.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      end.sub(start).normalize(),
    );
    return result;
  };
  function texture(draw, w = 512, h = 320) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    draw(canvas.getContext("2d"), w, h);
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    textures.push(result);
    return result;
  }
  function panel(size, map, parent, pos) {
    return mesh(
      new THREE.PlaneGeometry(...size),
      new THREE.MeshBasicMaterial({ map, transparent: true }),
      parent,
      pos,
    );
  }
  scene.add(
    new THREE.HemisphereLight(
      hologram ? "#bfead0" : "#f1f4df",
      hologram ? "#163d2e" : "#76917c",
      1.35,
    ),
  );
  const keyLight = new THREE.DirectionalLight("#fff8e8", 1.8);
  keyLight.position.set(-4, 8, 6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  Object.assign(keyLight.shadow.camera, {
    left: -8,
    right: 8,
    top: 8,
    bottom: -8,
  });
  keyLight.shadow.normalBias = 0.035;
  scene.add(keyLight);
  scene.add(new THREE.DirectionalLight("#c1ddd0", 1.1));

  const person = await createHeroCharacter(
    { mesh, mat, box, ball, cylinder, rod, texture, panel },
    !hologram,
  );
  scene.add(person.root);
  person.root.traverse((o) => {
    if (o.isMesh) o.receiveShadow = false;
  });
  const contactShadow=new THREE.Mesh(new THREE.PlaneGeometry(12,12),new THREE.ShadowMaterial({opacity:0,depthWrite:false}));
  contactShadow.rotation.x=-Math.PI/2;contactShadow.position.set(0,-.137,2.5);contactShadow.receiveShadow=true;scene.add(contactShadow);
  let scan, solidPlane, wirePlane, ring, holo, scanMaterial;
  let speakerMap = null,
    speakerLed = null,
    lastSpeakerDraw = -1;
  let chair = null, chairSeat = null, websiteMap = null, codeScreen = null, lastWebsiteDraw = -1, websiteFrame = 0, codeTime = 0;
  let speakerCabinet = null, speakerFace = null, speakerRig = null;
  const speakerButton=host.parentElement.querySelector('.speaker-toggle');
  const screenFrustum=new THREE.Frustum(),screenProjection=new THREE.Matrix4(),screenBounds=new THREE.Box3(),speakerBounds=new THREE.Box3();
  const armrestWrists=[new THREE.Vector3(),new THREE.Vector3()];
  let speakerCone = null;
  let mouse = null;
  const mouseWrist = new THREE.Vector3(), keyboardWrist = new THREE.Vector3(), actualWrist = new THREE.Vector3();
  const soundRipples = [];
  let lastSpeakerPlaying = false,
    lastSpeakerTitle = "";
  if (!hologram) {
    // A self-contained clay workspace, modeled from original geometry.
    box([7, 0.12, 4.8], "#698d72", objects, [0, -0.26, 0], 0.12);
    box([6.35, 0.025, 4.1], "#c8d9c0", objects, [0, -0.19, 0], 0.01);
    box([5.65, 0.026, 3.4], "#dfb7a1", objects, [0, -0.17, 0], 0.01);
    box([4.9, 0.027, 2.7], "#c4d6b7", objects, [0, -0.15, 0], 0.01);
    box([4.8, 0.19, 1.7], C.white, objects, [0, 1.6, -0.45], 0.095);
    for (const x of [-2.03, 2.03])
      for (const z of [-1.08, 0.18])
        cylinder(0.105, 0.095, 1.55, "#78947b", objects, [x, 0.72, z]).name='desk-support';
    const screenMaps = [
      texture((ctx, w, h) => drawComputerRadio(ctx, w, h)),
      texture((ctx, w, h) => drawDeskCode(ctx,w,h)),
    ];
    speakerMap = screenMaps[0];
    websiteMap = screenMaps[1];
    for (let i = 0; i < 2; i++) {
      const monitor = new THREE.Group();
      monitor.position.set(i === 0 ? -1.05 : 1.01, 2.36, -0.87);
      monitor.rotation.y = i === 0 ? 0.1 : -0.15;
      objects.add(monitor);
      box([1.92, 1.3, 0.15], "#353747", monitor, [0, 0, 0], 0.075);
      const display=panel([1.73, 1.1], screenMaps[i], monitor, [0, 0, 0.081]);
      if(i===1){codeScreen=display;display.name='code-monitor';}
      rod([0, -0.65, 0], [0, -0.86, -0.01], 0.065, "#424452", monitor);
      box([0.66, 0.07, 0.35], "#454451", monitor, [0, -0.79, 0.12], 0.025);
    }
    box([1.32, 0.075, 0.42], "#c8cfd0", objects, [-.16, 1.74, .18], 0.035);
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 11; col++)
        box(
          [0.075, 0.03, 0.067],
          C.white,
          objects,
          [-0.70 + col * 0.1, 1.785, .05 + row * 0.105],
          0.005,
        );
    mouse = ball([0.12, 0.045, 0.19], "#dae0df", objects, [.79, 1.745, .22]);
    person.root.position.set(0, person.rigDimensions.seatedRootY, .86);
    person.root.rotation.y = Math.PI;
    person.root.scale.setScalar(1);

    chair = new THREE.Group();
    chair.name = "swivel-chair";
    chair.position.z = 1.08;
    objects.add(chair);
    chairSeat = new THREE.Group(); chairSeat.position.y=-.18; chair.add(chairSeat);
    box([1.12, 0.22, 0.93], C.white, chairSeat, [0, 0.7, -.04], 0.1);
    const back = box([1.16, 1.1, 0.2], C.white, chairSeat, [0, 1.28, .37], 0.1);
    back.rotation.x = -.08;
    for(const side of [-1,1]) {
      rod([side*.48,.77,-.16],[side*.55,1.25,-.35],.033,'#a1b3a8',chairSeat);
      box([.18,.075,.56],'#466352',chairSeat,[side*.55,1.285,-.4],.036);
    }
    cylinder(.055,.07,.30,"#bac7c3",chair,[0,.29,0]);
    cylinder(.1,.1,.14,"#3c4f45",chair,[0,.15,0]);
    for(let i=0;i<5;i++) {
      const angle=i*Math.PI*2/5, x=Math.cos(angle)*.54,z=Math.sin(angle)*.54;
      rod([0,.15,0],[x,.015,z],.041,"#9cafa5",chair);
      const caster=new THREE.Group();caster.name=`chair-caster-${i}`;caster.position.set(x,-.038,z);caster.rotation.y=angle+Math.PI/2;chair.add(caster);
      cylinder(.033,.033,.10,"#83978b",caster,[0,.065,0]);
      for(const side of [-1,1]) {
        const wheel=cylinder(.098,.098,.052,"#35483d",caster,[side*.047,0,0]);wheel.rotation.z=Math.PI/2;
      }
    }
    cylinder(0.13, 0.13, 0.35, "#466b56", objects, [-1.8, 1.85, -0.2]);
    for (let i = 0; i < 4; i++)
      rod(
        [-1.88 + i * 0.05, 1.85, -0.2],
        [-1.94 + i * 0.1, 2.25 + Math.sin(i) * 0.08, -0.17],
        0.018,
        ["#d8646c", "#d7a246", "#71949c", "#dfe0c6"][i],
        objects,
      );
    cylinder(0.11, 0.09, 0.22, C.white, objects, [1.72, 1.82, -0.15]);
    const handle = mesh(
      new THREE.TorusGeometry(0.075, 0.018, 10, 20),
      mat(C.white),
      objects,
      [1.86, 1.86, -0.15],
    );
    handle.rotation.y = Math.PI / 2;
    const board = new THREE.Group();
    board.position.set(0.12, 3.52, -1.55);
    objects.add(board);
    box([2.8, 1.5, 0.12], "#bed0b7", board, [0, 0, 0], 0.11);
    box([2.61, 1.29, 0.045], "#8fa589", board, [0, 0, 0.075], 0.075);
    for (const [x, y, rotation, color, word] of [
      [-0.75, 0.1, -0.12, "#b8d4e4", "BUILD"],
      [0.53, -0.17, 0.14, "#f4e8c2", "CREATE"],
    ]) {
      const note = new THREE.Group();
      note.position.set(x, y, 0.12);
      note.rotation.z = rotation;
      board.add(note);
      box([0.66, 0.8, 0.012], color, note, [0, 0, 0], 0.006);
      panel(
        [0.59, 0.7],
        texture((ctx) => {
          ctx.fillStyle = "#5b7481";
          ctx.font = "bold 42px sans-serif";
          ctx.fillText(word, 36, 160);
          ctx.fillStyle = "#86a3ad";
          for (let i = 0; i < 4; i++)
            ctx.fillRect(40, 190 + i * 25, 280 - i * 30, 8);
        }),
        note,
        [0, 0, 0.012],
      );
      ball([0.07, 0.07, 0.05], "#e67778", note, [0, 0.34, 0.08]);
    }
    box([1.45, 0.1, 0.4], "#afc5a7", objects, [-2.46, 2.96, -1.39], 0.04);
    for (let i = 0; i < 3; i++) {
      const book = box(
        [0.19, 0.6 + i * 0.045, 0.26],
        ["#446787", "#d59339", "#d8c8a6"][i],
        objects,
        [-2.83 + i * 0.21, 3.3, -1.43],
        0.025,
      );
      book.rotation.z = (i - 1) * 0.025;
    }
    cylinder(0.13, 0.11, 0.23, C.white, objects, [-2.13, 3.11, -1.4]);
    ball([0.075, 0.23, 0.07], "#7dab3d", objects, [-2.13, 3.4, -1.4]);
    ball(
      [0.065, 0.12, 0.06],
      "#7dab3d",
      objects,
      [-2.03, 3.4, -1.4],
    ).rotation.z = -0.6;
    const plant = new THREE.Group();
    plant.position.set(3.03, -0.09, 0.17);
    objects.add(plant);
    cylinder(0.43, 0.31, 0.63, "#d3c6b6", plant, [0, 0.3, 0]);
    cylinder(0.48, 0.47, 0.14, C.white, plant, [0, 0.63, 0]);
    cylinder(0.39, 0.39, 0.04, "#665147", plant, [0, 0.69, 0]);
    for (let i = 0; i < 7; i++) {
      const angle = (i * Math.PI * 2) / 7;
      const positions = [],
        indices = [];
      const length = 1.1 + (i % 3) * 0.18;
      for (let j = 0; j <= 16; j++) {
        const t = j / 16,
          w = 0.2 * Math.pow(Math.sin(Math.PI * t), 0.7);
        const y = t * length,
          z = Math.sin(t * Math.PI) * 0.11;
        positions.push(
          -w,
          y,
          z,
          0,
          y,
          z + 0.065 * Math.sin(t * Math.PI),
          w,
          y,
          z,
        );
        if (j < 16) {
          const n = j * 3;
          indices.push(
            n,
            n + 3,
            n + 1,
            n + 1,
            n + 3,
            n + 4,
            n + 1,
            n + 4,
            n + 2,
            n + 2,
            n + 4,
            n + 5,
          );
        }
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
      );
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      const leaf = mesh(
        geometry,
        mat(i % 2 ? "#84bc24" : "#b0d62d", { side: THREE.DoubleSide }),
        plant,
        [0, 0.67, 0],
      );
      leaf.rotation.set(Math.cos(angle) * 0.55, angle, -Math.sin(angle) * 0.65);
    }
    speakerCabinet=box([0.41, 0.58, 0.32], "#e38584", objects, [2.05, 1.94, -0.75], 0.05);
    speakerFace = mesh(
      new THREE.CircleGeometry(0.14, 32),
      mat("#455167"),
      objects,
      [2.05, 1.95, -0.584],
    );
    speakerCone = mesh(
      new THREE.CircleGeometry(0.09, 32),
      mat("#86939d"),
      objects,
      [2.05, 1.95, -0.58],
    );
    for(let i=0;i<3;i++) {
      const ripple=mesh(new THREE.TorusGeometry(.15,.005,6,40),new THREE.MeshBasicMaterial({color:'#b5e6cb',transparent:true,opacity:0,depthWrite:false}),objects,[2.05,1.95,-.56]);
      ripple.castShadow=false;ripple.receiveShadow=false;ripple.visible=false;soundRipples.push(ripple);
    }
    speakerLed = mesh(
      new THREE.CircleGeometry(0.025, 16),
      new THREE.MeshBasicMaterial({ color: "#b36a66", toneMapped: false }),
      objects,
      [2.05, 1.74, -0.578],
    );
    const puzzle = new THREE.Group();
    puzzle.position.set(1.45, 1.77, -0.55);
    puzzle.rotation.y = -0.1;
    objects.add(puzzle);
    box([0.3, 0.3, 0.3], "#4b5364", puzzle, [0, 0, 0], 0.008);
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 3; col++) {
        box(
          [0.082, 0.082, 0.012],
          ["#74bfea", "#e6d447", "#f5f3e2"][(row + col) % 3],
          puzzle,
          [-0.094 + col * 0.094, -0.094 + row * 0.094, 0.157],
          0.004,
        );
        box(
          [0.012, 0.082, 0.082],
          ["#f6b348", "#e6eaee", "#70a6d7"][(row + col) % 3],
          puzzle,
          [0.157, -0.094 + row * 0.094, -0.094 + col * 0.094],
          0.004,
        );
      }
    const penguin = new THREE.Group();
    penguin.position.set(-1.51, 1.78, -0.07);
    objects.add(penguin);
    ball([0.11, 0.16, 0.095], "#29303c", penguin, [0, 0.02, 0]);
    ball([0.075, 0.11, 0.035], "#fff9eb", penguin, [0, 0, 0.075]);
    for (const x of [-0.039, 0.039]) {
      ball([0.026, 0.034, 0.015], "#f9f7e9", penguin, [x, 0.1, 0.078]);
      ball([0.011, 0.015, 0.009], "#25232a", penguin, [x, 0.1, 0.092]);
    }
    box([0.05, 0.025, 0.045], "#e3a232", penguin, [0, 0.051, 0.107], 0.012);
    const frame = new THREE.Group();
    frame.position.set(3.15, 2.92, -1.45);
    frame.rotation.z = -0.09;
    objects.add(frame);
    box([1.35, 1.0, 0.12], "#85b89c", frame, [0, 0, 0], 0.11);
    box([1.13, 0.78, 0.04], "#bad7c2", frame, [0, 0, 0.076], 0.04);
    panel(
      [1.02, 0.7],
      texture((ctx, w, h) => {
        ctx.fillStyle = "#abc4d8";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#fafaf3";
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(w * 0.4, h * 0.2);
        ctx.lineTo(w * 0.8, h);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(w * 0.55, h);
        ctx.lineTo(w * 0.8, h * 0.5);
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w * 0.79, h * 0.21, h * 0.09, 0, Math.PI * 2);
        ctx.fill();
      }),
      frame,
      [0, 0, 0.104],
    );
    const floor = mesh(
      new THREE.PlaneGeometry(8.3, 6),
      new THREE.ShadowMaterial({ opacity: 0.12 }),
      objects,
      [0, -0.325, 0],
    );
    floor.rotation.x = -Math.PI / 2;
    objects.children.slice(4).forEach((o) => {
      if (o.position.y > 0.2) o.position.y -= 0.2;
    });
    // Fit the work surface to the approved avatar's shorter torso.
    objects.children.slice(4).forEach(object=>{
      if(object.position.y>.2&&object.position.y<2.5)object.position.y-=.22;
      if(object.name==='desk-support'){object.position.y=.475;object.scale.y=1.23/1.55;}
    });
    puzzle.position.y=1.425;penguin.position.y=1.415;
    speakerRig=new THREE.Group();objects.add(speakerRig);
    for(const part of [speakerCabinet,speakerFace,speakerCone,speakerLed,...soundRipples]){
      part.position.sub(new THREE.Vector3(2.05,1.52,-.75));speakerRig.add(part);
      part.userData.speakerRestZ=part.position.z;
    }
    speakerRig.position.set(2.05,1.565,-.75);
  }
  if (hologram || experience) {
    scanner.position.z = 3.2;
    // The rug, walking floor and platform top share one contact height.
    scanner.position.y=-.412;
    cylinder(0.92, 0.97, 0.14, "#184d38", scanner, [0, 0.02, 0]);
    cylinder(0.94, 0.94, 0.08, "#1b5740", scanner, [0, 0.12, 0]);
    cylinder(0.89, 0.92, 0.12, "#245f46", scanner, [0, 0.22, 0]);
    const light = new THREE.PointLight("#8ee5b5", 2.5, 7, 1.8);
    light.name = "scan-light";
    light.position.set(0, 1, 1.5);
    scanner.add(light);
    for (const y of [0.03, 0.19, 0.27]) {
      const torus = mesh(
        new THREE.TorusGeometry(0.96, 0.013, 8, 100),
        new THREE.MeshBasicMaterial({ color: C.cyan }),
        scanner,
        [0, y, 0],
      );
      torus.rotation.x = Math.PI / 2;
    }
    const beam = mesh(
      new THREE.CylinderGeometry(0.46, 0.83, 3.35, 40, 1, true),
      new THREE.MeshBasicMaterial({
        color: "#7ad6aa",
        transparent: true,
        opacity: 0.045,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
      scanner,
      [0, 1.9, 0],
    );
    beam.name = "scan-beam";
    const grid = new THREE.GridHelper(25, 50, "#4e9873", "#32644b");
    grid.position.y = .28;
    grid.material.transparent = true;
    grid.material.opacity = 0.27;
    scanner.add(grid);
    solidPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    wirePlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    person.root.traverse((o) => {
      if (o.isMesh) {
        o.material = o.material.clone();
        o.material.clippingPlanes = [solidPlane];
      }
    });
    // Rig references are runtime objects, not serializable clone metadata.
    const rigData = [];
    person.root.traverse((o) => {
      rigData.push([o, o.userData]);
      o.userData = {};
    });
    holo = cloneSkeleton(person.root);
    rigData.forEach(([object, data]) => {
      object.userData = data;
    });
    const hologramMaterial = new THREE.MeshBasicMaterial({
      color: "#96efbb",
      transparent: true,
      opacity: 1,
      depthWrite: true,
      blending: THREE.AdditiveBlending,
      clippingPlanes: [wirePlane],
      toneMapped: false,
    });
    hologramMaterial.name = "hologram-material";
    scanMaterial=hologramMaterial;
    const scanUniforms = { uTime: { value: 0 }, uOpacity: { value: 0 } };
    hologramMaterial.userData.scanUniforms = scanUniforms;
    hologramMaterial.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, scanUniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 vHoloPosition;\nvarying vec3 vHoloNormal;",
        )
        .replace(
          "#include <project_vertex>",
          "#include <project_vertex>\nvHoloPosition=(modelMatrix*vec4(transformed,1.0)).xyz;\nvHoloNormal=normalize(mat3(modelMatrix)*normal);",
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying vec3 vHoloPosition;\nvarying vec3 vHoloNormal;\nuniform float uTime;\nuniform float uOpacity;",
        )
        .replace(
          "#include <color_fragment>",
          "#include <color_fragment>\nfloat stripe=pow(0.5+0.5*sin(vHoloPosition.y*145.0-uTime*1.2),5.0);\nfloat edge=pow(1.0-abs(dot(normalize(vHoloNormal),normalize(cameraPosition-vHoloPosition))),2.4);\ndiffuseColor.rgb=vec3(0.23,1.0,0.58)*(0.28+edge*1.15+stripe*0.55);\ndiffuseColor.a=uOpacity*(0.16+edge*0.60+stripe*0.22);",
        );
    };
    hologramMaterial.customProgramCacheKey = () => "pranav-hologram-v2";
    holo.traverse((o) => {
      if (o.isMesh) {
        o.material = hologramMaterial;
        o.castShadow = false;
        o.receiveShadow = false;
        if (o.name === "character-neck" || o.name === "character-hips")
          o.visible = false;
      }
    });
    scene.add(holo);

    scan = mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.021, 64),
      new THREE.MeshBasicMaterial({
        color: "#b3f4c8",
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
      scanner,
      [0, 0, 0],
    );
    ring = mesh(
      new THREE.TorusGeometry(0.8, 0.009, 6, 100),
      new THREE.MeshBasicMaterial({ color: "#d2fadd" }),
      scanner,
      [0, 0, 0],
    );
    ring.rotation.x = Math.PI / 2;
    const glowMap = texture(
      (ctx, w, h) => {
        const grad = ctx.createRadialGradient(
          w / 2,
          h / 2,
          0,
          w / 2,
          h / 2,
          w / 2,
        );
        grad.addColorStop(0, "rgba(132,223,185,.25)");
        grad.addColorStop(1, "rgba(22,73,45,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      },
      256,
      256,
    );
    const glow = mesh(
      new THREE.PlaneGeometry(4, 4),
      new THREE.MeshBasicMaterial({
        map: glowMap,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
      scanner,
      [0, 0.28, 0],
    );
    glow.rotation.x = -Math.PI / 2;
    const random = (i) => (Math.sin(i * 128.37) * 43758.5453) % 1;
    const pts = [];
    for (let i = 0; i < 110; i++)
      pts.push(
        random(i) * 10,
        Math.abs(random(i + 100)) * 7,
        random(i + 200) * 6 - 3,
      );
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    scanner.add(
      new THREE.Points(
        geo,
        new THREE.PointsMaterial({
          color: "#a9ddb8",
          size: 0.023,
          transparent: true,
          opacity: 0.43,
        }),
      ),
    );
  }
  let width = 0,
    height = 0,
    mobile = false;
  const target = new THREE.Vector3();
  const clamp = (value) => Math.min(1, Math.max(0, value));
  const smooth = (a, b, value) => {
    const t = clamp((value - a) / (b - a));
    return t*t*t*(t*(t*6-15)+10);
  };
  const mix = THREE.MathUtils.lerp;
  const originalRig = [],
    hologramRig = [];
  // The scanner occupies the revealed area below the moving room card.
  const roomClip = {value:0};
  scanner.traverse(object => {
    if(!object.material) return;
    object.material = object.material.clone();
    object.material.onBeforeCompile = shader => {
      shader.uniforms.uRoomClipY=roomClip;
      shader.fragmentShader="uniform float uRoomClipY;\n"+shader.fragmentShader.replace("void main() {","void main() {\n if(gl_FragCoord.y > uRoomClipY) discard;");
    };
    object.material.customProgramCacheKey=()=>"scanner-room-clip-v1";
  });
  person.root.traverse((o) => originalRig.push(o));
  holo?.traverse((o) => hologramRig.push(o));
  const copyPose = () => {
    for (let i = 0; i < originalRig.length; i++) {
      const source = originalRig[i],
        dest = hologramRig[i];
      if (!dest) continue;
      dest.position.copy(source.position);
      dest.quaternion.copy(source.quaternion);
      dest.scale.copy(source.scale);
    }
    holo?.updateMatrixWorld(true);
  };
  function resize() {
    const rect = host.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    // Match the page layout, even when the music dock shortens the 3D stage.
    mobile = window.matchMedia('(max-width: 600px), (max-width: 900px) and (max-aspect-ratio: 6/5)').matches;
    if(speakerRig)speakerRig.position.set(mobile?.88:2.05,1.565,mobile?-.30:-.75);
    if (!width || !height) return;
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, mobile ? 1.35 : 1.75),
    );
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();
  let visible = false;
  const visibleObserver = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if(!visible)host.dataset.codeMotion='paused';
    },
    { threshold: 0 },
  );
  visibleObserver.observe(host);
  const pointer = { x: 0, y: 0 },
    smoothedPointer = { x: 0, y: 0 };
  const move = (event) => {
    if (mobile) return;
    const r = host.getBoundingClientRect();
    pointer.x = clamp((event.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = clamp((event.clientY - r.top) / r.height) * 2 - 1;
  };
  window.addEventListener("pointermove", move, { passive: true });
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const gazePoint=new THREE.Vector3(),headPoint=new THREE.Vector3(),gazeDirection=new THREE.Vector3(),bodyInverse=new THREE.Quaternion();
  let gazeYaw=0,gazePitch=0;
  let frame,
    lastTime = 0,
    introStart = null;
  const tick = (time) => {
    frame = requestAnimationFrame(tick);
    if (!visible || document.hidden || time - lastTime < 14) return;
    const delta = Math.min(.05,(time-lastTime)/1000 || 1/60);
    lastTime = time;
    if (introStart === null) introStart = time;
    const t = time * 0.001,
      reduced = motionQuery.matches;
    const data = getProgress();
    const page = typeof data === "object" ? data.page : 0;
    const walk =
      typeof data === "object" ? data.walk : smooth(0.035, 0.86, page);
    const scanProgress =
      typeof data === "object" ? data.scan : Number(data) || 0;
    roomClip.value=height*renderer.getPixelRatio()*(experience ? 1-(data.roomBottom ?? 1) : 1);
    const cameraWalk = smooth(0.08, 0.96, page);
    const chairTurn = smooth(0.015, 0.19, page);
    const standing = smooth(0.20, 0.44, page);
    const stepping = smooth(0.43, 0.90, page);
    contactShadow.material.opacity=.19*smooth(.35,.48,page);
    const intro = (time-Math.max(introStart,data.greetAt || 0))/1000;
    const helloWeight = 1-smooth(data.greetAt > introStart ? .12 : 0,data.greetAt > introStart ? .2 : .07,page);
    const helloTurn = reduced ? 0 : smooth(.2,.8,intro)*(1-smooth(3.4,4.2,intro))*helloWeight;
    const helloWave = reduced ? 0 : smooth(.6,1,intro)*(1-smooth(2.8,3.3,intro))*helloWeight;
    person.pose(standing);
    person.root.scale.setScalar(1);
    const stride =
      Math.sin(stepping * Math.PI * 4) *
      smooth(0.32, 0.43, page) *
      (1 - smooth(0.76, 0.87, page));
    if (!reduced) {
      const follow = 1-Math.exp(-delta*4.2);
      smoothedPointer.x = mix(smoothedPointer.x, pointer.x, follow);
      smoothedPointer.y = mix(smoothedPointer.y, pointer.y, follow);
      const idle = 1-smooth(.14,.5,page);
      person.body.rotation.z = Math.sin(t*.52)*.008*(1-smooth(.08,.3,page));
      person.body.rotation.x = Math.sin(Math.PI*standing)*.18*(1-stepping);
      person.body.scale.y = 1+Math.sin(t*1.25)*.0025*idle;
      person.arms[0].rotation.x += stride * 0.34;
      person.arms[1].rotation.x -= stride * 0.34;
      if (standing > .98 && page < .94) person.walkPose?.(stepping,1.24);
    }
    const roomLift = Math.max(0,page-.08)*4.4;
    const carry = roomLift*(1-standing);
    const facing = mix(Math.PI, .04, chairTurn) + helloTurn*(.5-Math.PI);
    const seatTurn = facing-Math.PI;
    const kneeBend=(1-standing)*Math.PI/2;
    const seatRootZ=1.08-.22*Math.cos(seatTurn);
    const risenRootZ=seatRootZ+person.rigDimensions.thigh*(1-Math.sin(kneeBend));
    person.root.position.set(
      -.22*Math.sin(seatTurn)*(1-stepping),
      -.132+carry,
      mix(risenRootZ,3.2,walkPath(stepping).advance),
    );
    person.root.rotation.y = facing + smooth(.94,1.12,page)*scanProgress*Math.PI*2;
    if(standing>0&&standing<1&&stepping<.01){
      person.root.updateMatrixWorld(true);
      for(const leg of person.legs){
        const planted=new THREE.Vector3(leg.position.x,.16,person.rigDimensions.thigh*Math.sin(kneeBend));
        person.root.localToWorld(planted);person.body.worldToLocal(planted);planted.sub(leg.position);
        const vertical=-planted.y,z=planted.z,{thigh,shin}=person.rigDimensions,distance=Math.min(thigh+shin,Math.hypot(vertical,z));
        const knee=Math.acos(THREE.MathUtils.clamp((distance*distance-thigh*thigh-shin*shin)/(2*thigh*shin),-1,1));
        const hip=Math.atan2(-z,vertical)-Math.atan2(shin*Math.sin(knee),thigh+shin*Math.cos(knee));
        leg.rotation.x=hip;leg.userData.knee.rotation.x=knee;leg.userData.ankle.rotation.x=-hip-knee-person.body.rotation.x;
      }
    }
    if (chair) {
      chairSeat.rotation.y = seatTurn;
      chair.scale.setScalar(1);
    }
    objects.position.y = roomLift;
    objects.rotation.z = -walk * 0.035;
    objects.scale.setScalar(1 - walk * 0.055);
    const workBlend=(1-smooth(.05,.07,page))*(1-smooth(0,.2,helloTurn));
    if(mouse) {
      mouse.position.x=.79+(reduced ? 0 : Math.sin(t*.82)*.014+Math.sin(t*1.7)*.004)*workBlend;
      mouse.position.z=.22+(reduced ? 0 : Math.sin(t*.61)*.012)*workBlend;
      objects.updateMatrixWorld(true);
      objects.localToWorld(mouseWrist.set(mouse.position.x,mouse.position.y+.087,mouse.position.z+.110));
      objects.localToWorld(keyboardWrist.set(-.26,1.422,.33));
      person.deskPose?.(workBlend,mouseWrist,keyboardWrist,reduced ? 0 : t);
    }
    if(chairSeat){
      chairSeat.updateWorldMatrix(true,false);
      person.arms.forEach((arm,index)=>chairSeat.localToWorld(armrestWrists[index].set(-arm.userData.side*.55,1.358,-.24)));
      const restBlend=(1-standing)*(1-workBlend);
      person.armrestPose?.(restBlend,armrestWrists);
      if(restBlend>.98){const wrists=person.getWorldWrists();host.dataset.armrestContact=Math.max(...wrists.map((w,index)=>w.distanceTo(armrestWrists[index]))).toFixed(4);}
      else host.dataset.armrestContact='released';
    }
    person.greetPose?.(helloWave,intro,1);
    if(workBlend>.98) {
      person.root.updateMatrixWorld(true);
      person.arms[0].userData.hand.getWorldPosition(actualWrist);
      host.dataset.mouseContact=actualWrist.distanceTo(mouseWrist).toFixed(4);
    } else host.dataset.mouseContact='released';
    const cameraX = mobile ? mix(2.2, 0, cameraWalk) : mix(4.7, 0, cameraWalk);
    const cameraY = mobile
      ? mix(3.4, 2.37, cameraWalk)
      : mix(3.8, 2.62, cameraWalk);
    const cameraZ = mobile
      ? mix(12.0, 12.7, cameraWalk)
      : mix(9.6, 11.8, cameraWalk);
    camera.position.set(
      cameraX + (reduced ? 0 : smoothedPointer.x * 0.1),
      cameraY,
      cameraZ,
    );
    target.set(
      0,
      mobile ? mix(2.85, 1.21, smooth(.28,1.1,page)) : mix(1.55, 1.25, cameraWalk),
      mix(0.2, 3.2, cameraWalk),
    );
    camera.lookAt(target);
    camera.setViewOffset(
      width,
      height,
      -width * (mobile ? 0.11 : 0.175) * (1 - cameraWalk),
      0,
      width,
      height,
    );
    camera.updateMatrixWorld();
    if(speakerButton&&speakerCabinet){
      const canToggle=page<(mobile?1.10:1.16)&&objects.visible;
      speakerButton.hidden=!canToggle;
      if(canToggle){
        speakerBounds.setFromObject(speakerCabinet);
        let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
        for(const x of [speakerBounds.min.x,speakerBounds.max.x])for(const y of [speakerBounds.min.y,speakerBounds.max.y])for(const z of [speakerBounds.min.z,speakerBounds.max.z]){
          const point=new THREE.Vector3(x,y,z).project(camera),px=(point.x+1)*width/2,py=(1-point.y)*height/2;
          minX=Math.min(minX,px);maxX=Math.max(maxX,px);minY=Math.min(minY,py);maxY=Math.max(maxY,py);
        }
        const hitWidth=Math.max(44,maxX-minX+8),hitHeight=Math.max(44,maxY-minY+8),left=(minX+maxX-hitWidth)/2,top=(minY+maxY-hitHeight)/2;
        speakerButton.hidden=left>=width||left+hitWidth<=0||top>=height||top+hitHeight<=70;
        Object.assign(speakerButton.style,{left:`${left}px`,top:`${top}px`,width:`${hitWidth}px`,height:`${hitHeight}px`});
      }
    }
    if(!reduced) {
      // World-space targets make the gaze land on each monitor, not drift.
      const cycle=((time-introStart)/1000)%18;
      const right=cycle<5?0:cycle<8?smooth(5,8,cycle):cycle<13?1:1-smooth(13,17,cycle);
      objects.localToWorld(gazePoint.set(mix(-1.05,1.01,right),1.94,-.79));
      gazePoint.lerp(camera.position,1-workBlend);
      person.root.updateMatrixWorld(true);
      person.head.getWorldPosition(headPoint);
      person.body.getWorldQuaternion(bodyInverse).invert();
      gazeDirection.copy(gazePoint).sub(headPoint).applyQuaternion(bodyInverse);
      const yaw=THREE.MathUtils.clamp(Math.atan2(gazeDirection.x,gazeDirection.z),-.62,.62);
      const pitch=THREE.MathUtils.clamp(Math.atan2(-gazeDirection.y,Math.hypot(gazeDirection.x,gazeDirection.z)),-.12,.23);
      const settle=1-Math.exp(-delta*3.2);
      gazeYaw=mix(gazeYaw,yaw,settle);gazePitch=mix(gazePitch,pitch,settle);
      person.head.rotation.set(gazePitch+Math.sin(t*.7)*.008,gazeYaw,Math.sin(t*.63)*.009);
      host.dataset.gaze=workBlend>.9?(right<.2?'left-monitor':right>.8?'right-monitor':'between-monitors'):'visitor';
    } else {person.head.rotation.set(0,0,0);host.dataset.gaze='still';}
    person.updateFace?.(t);
    objects.position.y = roomLift;
    objects.rotation.z = -walk * 0.035;
    objects.scale.setScalar(1 - walk * 0.055);
    objects.visible = page < (mobile ? 1.10 : 1.16);
    const reveal = smooth(0.2, 0.78, page);
    scanner.visible = reveal > 0.001;
    scanner.traverse((o) => {
      if (o.isLight) o.intensity = 2.5 * reveal;
      else if (o.material) {
        const list = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of list) {
          if (m.userData.baseOpacity === undefined)
            m.userData.baseOpacity = m.opacity;
          m.opacity = m.userData.baseOpacity * reveal;
        }
      }
    });
    if (holo) {
      copyPose();
      holo.visible = reveal > 0.001;
      const material = scanMaterial;
      if (material?.userData.scanUniforms) {
        material.userData.scanUniforms.uTime.value = t;
        material.userData.scanUniforms.uOpacity.value = reveal;
      }
      const scanHeight = mix(0.28, person.rigDimensions.standingHeight+.30, scanProgress);
      const worldScanHeight=scanHeight+scanner.position.y;
      const beam = scanner.getObjectByName("scan-beam");
      const beamHeight = Math.max(0.02, scanHeight - 0.28);
      beam.scale.y = beamHeight / 3.35;
      beam.position.y = 0.28 + beamHeight / 2;
      solidPlane.constant = reveal > 0.95 ? -worldScanHeight : 100;
      wirePlane.constant = worldScanHeight;
      scan.position.y = scanHeight;
      ring.position.y = scanHeight;
    }
    host.dataset.page = page.toFixed(3);
    host.dataset.pose = page < .20 ? "swivel" : page < .44 ? "stand" : page < .90 ? "step" : "scan";
    host.dataset.greeting = helloWave.toFixed(2);
    host.dataset.chair = (chairSeat?.rotation.y || 0).toFixed(2);
    host.dataset.scan = scanProgress.toFixed(3);
    host.dataset.camera = camera.position
      .toArray()
      .map((v) => v.toFixed(2))
      .join(",");
    let codeVisible=false;
    if(codeScreen&&objects.visible&&page<.14&&workBlend>.9){
      screenProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);screenFrustum.setFromProjectionMatrix(screenProjection);
      screenBounds.setFromObject(codeScreen);codeVisible=screenFrustum.intersectsBox(screenBounds);
    }
    if(codeVisible&&!reduced)codeTime+=delta;
    host.dataset.codeMotion=codeVisible&&!reduced?'slow-scroll':'paused';host.dataset.codeTime=codeTime.toFixed(3);
    if(websiteMap && codeVisible && (lastWebsiteDraw < 0 || (!reduced && time-lastWebsiteDraw>125))) {
      const canvas=websiteMap.image;
      drawDeskCode(canvas.getContext('2d'),canvas.width,canvas.height,reduced ? 0 : codeTime);
      host.dataset.codeScroll=deskCodeState(codeTime,canvas.height).scroll.toFixed(2);
      websiteMap.needsUpdate=true;lastWebsiteDraw=time;host.dataset.websiteFrame=String(++websiteFrame);
    }
    if(speakerCone) {
      const activity = speakerState.playing && !reduced ? speakerState.level : 0;
      speakerCone.scale.setScalar(1+activity*.09);
      soundRipples.forEach((ripple,i)=>{
        const phase=(t*.75+i/3)%1;
        ripple.visible=activity>.005;
        ripple.scale.setScalar(1+phase*1.7);ripple.position.z=ripple.userData.speakerRestZ+phase*.32;
        ripple.material.opacity=(1-phase)*activity*.55;
      });
      host.dataset.speaker=activity>.005 ? 'playing' : 'quiet';
    }
    if (
      speakerMap &&
      objects.visible &&
      ((speakerState.playing && time - lastSpeakerDraw > 90) ||
        lastSpeakerPlaying !== speakerState.playing ||
        lastSpeakerTitle !== speakerState.title)
    ) {
      const canvas = speakerMap.image;
      drawComputerRadio(
        canvas.getContext("2d"),
        canvas.width,
        canvas.height,
        t,
      );
      speakerMap.needsUpdate = true;
      lastSpeakerDraw = time;
      lastSpeakerPlaying = speakerState.playing;
      lastSpeakerTitle = speakerState.title;
      speakerLed.material.color.set(
        speakerState.playing ? "#8ee5b5" : "#b36a66",
      );
    }
    if(objects.visible && page > .18) {
      // Composite the departing room behind the continuous character without
      // disabling self-occlusion on the head, glasses, clothes, or skeleton.
      const holoVisible=holo?.visible,scannerVisible=scanner.visible;
      person.root.visible=false;
      if(holo) holo.visible=false;
      renderer.render(scene,camera);
      renderer.autoClear=false;
      renderer.clearDepth();
      objects.visible=false;scanner.visible=false;person.root.visible=true;
      if(holo) holo.visible=holoVisible;
      renderer.render(scene,camera);
      renderer.autoClear=true;
      objects.visible=true;scanner.visible=scannerVisible;
    } else renderer.render(scene, camera);
  };
  frame = requestAnimationFrame(tick);
  const lost = (event) => {
    event.preventDefault();
    host.dataset.ready = "false";
    if(speakerButton)speakerButton.hidden=true;
  };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  return {
    dispose() {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibleObserver.disconnect();
      window.removeEventListener("pointermove", move);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      const skeletons = new Set();
      const geometries = new Set(),
        allMaterials = new Set();
      scene.traverse((o) => {
        if (o.geometry) geometries.add(o.geometry);
        if (o.isSkinnedMesh) skeletons.add(o.skeleton);
        if (o.material)
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            allMaterials.add(m),
          );
      });
      materials.forEach(material=>allMaterials.add(material));
      skeletons.forEach((s) => s.dispose());
      geometries.forEach((g) => g.dispose());
      allMaterials.forEach((m) => m.dispose());
      const modelTextures=new Set();allMaterials.forEach(material=>{for(const value of Object.values(material))if(value?.isTexture)modelTextures.add(value);});modelTextures.forEach(texture=>texture.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
