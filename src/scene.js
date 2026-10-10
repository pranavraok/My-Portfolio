import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const C = {
  cream: "#f5efe4",
  white: "#fffaf1",
  blue: "#9ebed3",
  ink: "#292e34",
  navy: "#18336c",
  skin: "#ba825d",
  hair: "#25211f",
  orange: "#ff930d",
  cyan: "#41e5ff",
};

export function createScene(host, mode, getProgress) {
  const hologram = mode === "hologram";
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = !hologram;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = hologram ? 1.15 : 1.3;
  renderer.localClippingEnabled = true;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
  const materials = new Map();
  const textures = [];
  const objects = new THREE.Group();
  scene.add(objects);
  const mat = (color, options = {}) => {
    const key = color + JSON.stringify(options);
    if (!materials.has(key))
      materials.set(
        key,
        new THREE.MeshStandardMaterial({ color, roughness: 0.67, ...options }),
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
  function character(seated = false) {
    const root = new THREE.Group();
    const body = new THREE.Group();
    root.add(body);
    const head = new THREE.Group();
    head.position.set(0, 2.67, 0);
    body.add(head);
    ball([0.64, 0.68, 0.58], C.skin, head, [0, 0, 0]);
    ball([0.13, 0.2, 0.11], C.skin, head, [-0.63, -0.05, -0.01]);
    ball([0.13, 0.2, 0.11], C.skin, head, [0.63, -0.05, -0.01]);
    ball([0.65, 0.4, 0.57], C.hair, head, [0, 0.45, -0.09]);
    ball([0.48, 0.28, 0.48], C.hair, head, [-0.25, 0.49, 0.12]).rotation.z =
      0.25;
    ball([0.49, 0.26, 0.4], C.hair, head, [0.18, 0.53, 0.02]).rotation.z =
      -0.25;
    ball([0.16, 0.36, 0.39], C.hair, head, [-0.52, 0.21, -0.12]);
    ball([0.13, 0.31, 0.38], C.hair, head, [0.54, 0.19, -0.12]);
    for (const x of [-0.25, 0.25]) {
      ball([0.155, 0.175, 0.055], "#fefbf4", head, [x, 0.035, 0.51]);
      ball([0.073, 0.095, 0.032], "#29211c", head, [x + 0.02, 0.01, 0.563]);
      ball([0.025, 0.029, 0.015], "#ffffff", head, [x + 0.045, 0.05, 0.585]);
      const glasses = mesh(
        new THREE.TorusGeometry(0.215, 0.018, 8, 40),
        mat("#34302d", { metalness: 0.5 }),
        head,
        [x, 0.045, 0.59],
        [1.17, 0.88, 1],
      );
      glasses.rotation.z = x < 0 ? -0.06 : 0.06;
      const brow = box(
        [0.17, 0.038, 0.025],
        C.hair,
        head,
        [x, 0.27, 0.48],
        0.016,
      );
      brow.rotation.z = x < 0 ? 0.1 : -0.1;
    }
    rod([-0.035, 0.08, 0.595], [0.035, 0.08, 0.595], 0.016, "#34302d", head);
    rod([-0.51, 0.1, 0.58], [-0.64, 0.09, 0.04], 0.016, "#34302d", head);
    rod([0.51, 0.1, 0.58], [0.64, 0.09, 0.04], 0.016, "#34302d", head);
    ball([0.088, 0.1, 0.1], C.skin, head, [0, -0.12, 0.565]);
    const moustache = ball(
      [0.15, 0.032, 0.024],
      C.hair,
      head,
      [0, -0.27, 0.55],
    );
    moustache.rotation.z = -0.02;
    ball([0.115, 0.022, 0.028], "#8c4f3f", head, [0, -0.335, 0.53]);
    cylinder(0.15, 0.17, 0.24, C.skin, body, [0, 1.99, 0]);
    box([0.94, 0.99, 0.55], C.blue, body, [0, 1.58, 0], 0.2);
    const collar1 = box(
      [0.22, 0.14, 0.06],
      "#c2d9e5",
      body,
      [-0.14, 2.0, 0.27],
      0.04,
    );
    collar1.rotation.z = -0.45;
    const collar2 = box(
      [0.22, 0.14, 0.06],
      "#c2d9e5",
      body,
      [0.14, 2.0, 0.27],
      0.04,
    );
    collar2.rotation.z = 0.45;
    box([0.035, 0.22, 0.025], "#7595a9", body, [0, 1.88, 0.3], 0.01);
    ball([0.03, 0.03, 0.018], "#dbe4e6", body, [0, 1.88, 0.32]);
    panel(
      [0.13, 0.15],
      texture((ctx) => {
        ctx.fillStyle = "#173b64";
        ctx.font = "bold 80px sans-serif";
        ctx.fillText("P", 140, 210);
      }),
      body,
      [0.27, 1.71, 0.29],
    );
    const arms = [];
    for (const side of [-1, 1]) {
      const arm = new THREE.Group();
      arm.position.set(side * 0.51, 1.89, 0);
      body.add(arm);
      arms.push(arm);
      ball([0.19, 0.29, 0.23], C.blue, arm, [side * 0.025, -0.16, 0]);
      ball([0.12, 0.37, 0.13], C.skin, arm, [side * 0.06, -0.59, 0]);
      ball([0.13, 0.18, 0.1], C.skin, arm, [side * 0.065, -0.93, 0.02]);
      arm.rotation.z = side * 0.1;
      if (seated) {
        arm.rotation.x = -1.0;
        arm.rotation.z = side * 0.16;
      }
      const leg = new THREE.Group();
      leg.position.set(side * 0.24, 1.06, 0);
      body.add(leg);
      box([0.38, 0.83, 0.42], "#303b4c", leg, [0, -0.4, 0], 0.12);
      box([0.37, 0.5, 0.39], "#303b4c", leg, [0, -0.96, 0], 0.1);
      box([0.41, 0.12, 0.64], "#ede9df", leg, [0, -1.25, 0.14], 0.06);
      box([0.39, 0.25, 0.61], "#26323f", leg, [0, -1.14, 0.16], 0.09);
      box([0.24, 0.025, 0.22], "#f5f2e8", leg, [0, -1.012, 0.21], 0.01);
      if (seated) {
        leg.rotation.x = -Math.PI / 2.8;
        leg.children.slice(1).forEach((child) => {
          child.position.z += 0.48;
          child.position.y += 0.18;
        });
      }
    }
    return { root, head, body, arms };
  }

  scene.add(
    new THREE.HemisphereLight(
      hologram ? "#8ebfff" : "#fff3d8",
      hologram ? "#052762" : "#a89173",
      2.4,
    ),
  );
  const keyLight = new THREE.DirectionalLight("#fff8e8", hologram ? 2 : 4.3);
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
  scene.add(new THREE.DirectionalLight("#9bbfff", 1.1));

  const person = character(!hologram);
  let scan, solidPlane, wirePlane, ring, holo;
  if (!hologram) {
    // A self-contained clay workspace, modeled from original geometry.
    box([7, 0.12, 4.8], "#edb038", objects, [0, -0.26, 0], 0.12);
    box([6.35, 0.025, 4.1], "#eade82", objects, [0, -0.19, 0], 0.01);
    box([5.65, 0.026, 3.4], "#f4c362", objects, [0, -0.17, 0], 0.01);
    box([4.9, 0.027, 2.7], "#e9d47d", objects, [0, -0.15, 0], 0.01);
    box([4.8, 0.19, 1.7], C.white, objects, [0, 1.6, -0.45], 0.095);
    for (const x of [-2.03, 2.03])
      for (const z of [-1.08, 0.18])
        cylinder(0.105, 0.095, 1.55, "#bc9768", objects, [x, 0.72, z]);
    const screenMaps = [
      texture((ctx, w, h) => {
        ctx.fillStyle = "#242c39";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#333f50";
        ctx.fillRect(0, 0, 116, h);
        for (let i = 0; i < 11; i++) {
          ctx.fillStyle = i === 2 ? "#809ecc" : "#607089";
          ctx.fillRect(22, 26 + i * 23, 65 - (i % 3) * 8, 5);
        }
        ctx.fillStyle = "#edb545";
        ctx.font = "bold 25px monospace";
        ctx.fillText("PRANAV.DEV", 143, 43);
        ctx.fillStyle = "#dfe8f0";
        ctx.font = "18px monospace";
        ctx.fillText("A little curiosity.", 143, 89);
        ctx.fillText("A lot of code.", 143, 119);
        for (let i = 0; i < 7; i++) {
          ctx.fillStyle = ["#87c6af", "#d6a1ce", "#dda770"][i % 3];
          ctx.fillRect(145 + (i % 3) * 12, 163 + i * 18, 90 + (i % 4) * 31, 5);
        }
      }),
      texture((ctx, w, h) => {
        ctx.fillStyle = "#262b37";
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#1e2330";
        ctx.fillRect(0, 0, w, 24);
        for (let i = 0; i < 18; i++) {
          ctx.fillStyle = "#697185";
          ctx.font = "10px monospace";
          ctx.fillText(String(i + 1), 12, 45 + i * 14);
          ctx.fillStyle = ["#bc83ce", "#79b8c2", "#cba167", "#95b975"][i % 4];
          ctx.fillRect(
            48 + (i % 4) * 12,
            39 + i * 14,
            55 + ((i * 31) % 220),
            4,
          );
          if (i % 3 === 0) {
            ctx.fillStyle = "#ced9ed";
            ctx.fillRect(110, 46 + i * 14, 100, 3);
          }
        }
      }),
    ];
    for (let i = 0; i < 2; i++) {
      const monitor = new THREE.Group();
      monitor.position.set(i === 0 ? -1.05 : 1.01, 2.36, -0.87);
      monitor.rotation.y = i === 0 ? 0.1 : -0.15;
      objects.add(monitor);
      box([1.92, 1.3, 0.15], "#353747", monitor, [0, 0, 0], 0.075);
      panel([1.73, 1.1], screenMaps[i], monitor, [0, 0, 0.081]);
      rod([0, -0.65, 0], [0, -0.86, -0.01], 0.065, "#424452", monitor);
      box([0.66, 0.07, 0.35], "#454451", monitor, [0, -0.79, 0.12], 0.025);
    }
    box([1.32, 0.075, 0.42], "#c8cfd0", objects, [0.18, 1.74, 0.01], 0.035);
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 11; col++)
        box(
          [0.075, 0.03, 0.067],
          C.white,
          objects,
          [-0.36 + col * 0.1, 1.785, -0.12 + row * 0.105],
          0.005,
        );
    ball([0.12, 0.045, 0.19], "#dae0df", objects, [1.02, 1.745, 0.12]);
    person.root.position.set(0, 0.56, 1.06);
    person.root.rotation.y = Math.PI;
    person.root.scale.setScalar(0.83);
    objects.add(person.root);
    const chair = new THREE.Group();
    objects.add(chair);
    box([1.12, 0.22, 0.93], C.white, chair, [0, 0.97, 1.24], 0.1);
    box([1.16, 1.1, 0.22], C.white, chair, [0, 1.54, 1.65], 0.1);
    cylinder(0.09, 0.09, 0.72, "#73787b", chair, [0, 0.5, 1.28]);
    for (const side of [-1, 1]) {
      rod([0, 0.12, 1.3], [side * 0.62, 0.1, 0.91], 0.055, "#73787b", chair);
      rod([0, 0.12, 1.3], [side * 0.62, 0.1, 1.79], 0.055, "#73787b", chair);
    }
    cylinder(0.13, 0.13, 0.35, "#466b93", objects, [-1.8, 1.85, -0.2]);
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
    box([2.8, 1.5, 0.12], "#d8c090", board, [0, 0, 0], 0.11);
    box([2.61, 1.29, 0.045], "#a68d77", board, [0, 0, 0.075], 0.075);
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
    box([1.45, 0.1, 0.4], "#d3b88b", objects, [-2.46, 2.96, -1.39], 0.04);
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
      const leaf = ball(
        [0.14, 0.76, 0.08],
        i % 2 ? "#84ae25" : "#aad437",
        plant,
        [Math.sin(angle) * 0.28, 1.25 + (i % 2) * 0.12, Math.cos(angle) * 0.28],
      );
      leaf.rotation.set(Math.cos(angle) * 0.48, angle, -Math.sin(angle) * 0.48);
    }
    box([0.41, 0.58, 0.32], "#e2b03e", objects, [2.05, 1.94, -0.75], 0.05);
    const speaker = mesh(
      new THREE.CircleGeometry(0.14, 32),
      mat("#455167"),
      objects,
      [2.05, 1.95, -0.584],
    );
    mesh(
      new THREE.CircleGeometry(0.09, 32),
      mat("#86939d"),
      objects,
      [2.05, 1.95, -0.58],
    );
    const floor = mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.ShadowMaterial({ opacity: 0.12 }),
      scene,
      [0, -0.325, 0],
    );
    floor.rotation.x = -Math.PI / 2;
  } else {
    person.root.position.y = 0.34;
    objects.add(person.root);
    cylinder(0.95, 1.05, 0.24, "#123971", objects, [0, 0.02, 0]);
    cylinder(0.89, 0.94, 0.14, "#175185", objects, [0, 0.19, 0]);
    const light = new THREE.PointLight("#00d4ff", 14, 7, 1.8);
    light.position.set(0, 1, 1.5);
    scene.add(light);
    for (const y of [0.03, 0.19, 0.27]) {
      const torus = mesh(
        new THREE.TorusGeometry(0.96, 0.013, 8, 100),
        new THREE.MeshBasicMaterial({ color: C.cyan }),
        objects,
        [0, y, 0],
      );
      torus.rotation.x = Math.PI / 2;
    }
    const grid = new THREE.GridHelper(25, 50, "#0d8cba", "#0b477d");
    grid.position.y = -0.13;
    grid.material.transparent = true;
    grid.material.opacity = 0.27;
    scene.add(grid);
    solidPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    wirePlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
    person.root.traverse((o) => {
      if (o.isMesh) {
        o.material = o.material.clone();
        o.material.clippingPlanes = [solidPlane];
      }
    });
    holo = person.root.clone(true);
    holo.traverse((o) => {
      if (o.isMesh) {
        o.material = new THREE.MeshBasicMaterial({
          color: "#1fe5ff",
          wireframe: true,
          transparent: true,
          opacity: 0.35,
          clippingPlanes: [wirePlane],
        });
        o.castShadow = false;
      }
    });
    objects.add(holo);
    scan = mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.021, 64),
      new THREE.MeshBasicMaterial({
        color: "#34e6ff",
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
      objects,
      [0, 0, 0],
    );
    ring = mesh(
      new THREE.TorusGeometry(0.8, 0.009, 6, 100),
      new THREE.MeshBasicMaterial({ color: "#80f7ff" }),
      objects,
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
        grad.addColorStop(0, "rgba(20,217,255,.7)");
        grad.addColorStop(1, "rgba(0,80,150,0)");
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
      objects,
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
    scene.add(
      new THREE.Points(
        geo,
        new THREE.PointsMaterial({
          color: "#67c7ff",
          size: 0.023,
          transparent: true,
          opacity: 0.43,
        }),
      ),
    );
  }
  let width = 0,
    height = 0;
  const target = new THREE.Vector3();
  function resize() {
    const rect = host.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    const mobile = width < 600;
    if (hologram) {
      camera.position.set(0, 2.95, mobile ? 10.8 : 9.0);
      target.set(0, 2.0, 0);
    } else {
      camera.position.set(6.4, 4.65, 8.3);
      target.set(0, 1.55, 0);
      if (mobile) camera.position.multiplyScalar(1.04);
    }
    camera.lookAt(target);
    camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();
  let visible = false;
  const visibleObserver = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { threshold: 0 },
  );
  visibleObserver.observe(host);
  let pointer = { x: 0, y: 0 };
  const move = (event) => {
    const r = host.getBoundingClientRect();
    pointer.x = ((event.clientX - r.left) / r.width - 0.5) * 2;
    pointer.y = ((event.clientY - r.top) / r.height - 0.5) * 2;
  };
  host.addEventListener("pointermove", move, { passive: true });
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame,
    lastTime = 0;
  const tick = (time) => {
    frame = requestAnimationFrame(tick);
    if (!visible || document.hidden || time - lastTime < 30) return;
    lastTime = time;
    const t = time * 0.001;
    const reduced = motionQuery.matches;
    const progress = getProgress();
    if (!reduced) {
      if (hologram) {
        person.root.rotation.y = Math.sin(t * 0.4) * 0.12 + pointer.x * 0.15;
        holo.rotation.copy(person.root.rotation);
        person.head.rotation.y = pointer.x * 0.11;
        holo.children[0].children[0].rotation.copy(person.head.rotation);
      } else {
        objects.rotation.y = THREE.MathUtils.lerp(
          objects.rotation.y,
          pointer.x * 0.045,
          0.06,
        );
        person.head.rotation.y =
          Math.sin(t * 0.4) * 0.22 + Math.max(0, Math.sin(t * 0.24)) * 0.8;
        person.arms[0].rotation.x = -1.02 + Math.sin(t * 5) * 0.015;
      }
    }
    if (hologram) {
      const scanHeight = THREE.MathUtils.lerp(0.3, 3.85, progress);
      solidPlane.constant = -scanHeight;
      wirePlane.constant = scanHeight;
      scan.position.y = scanHeight;
      ring.position.y = scanHeight;
    }
    renderer.render(scene, camera);
  };
  frame = requestAnimationFrame(tick);
  const lost = (event) => {
    event.preventDefault();
    host.dataset.ready = "false";
  };
  renderer.domElement.addEventListener("webglcontextlost", lost);
  return {
    dispose() {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibleObserver.disconnect();
      host.removeEventListener("pointermove", move);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      const geometries = new Set(),
        allMaterials = new Set();
      scene.traverse((o) => {
        if (o.geometry) geometries.add(o.geometry);
        if (o.material)
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            allMaterials.add(m),
          );
      });
      geometries.forEach((g) => g.dispose());
      allMaterials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
