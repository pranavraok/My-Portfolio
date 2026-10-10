import * as THREE from "three";

const COLORS = {
  skin: "#b98161",
  skinShade: "#a96f54",
  hair: "#24201e",
  hairLight: "#302b27",
  shirt: "#98bacf",
  collar: "#bfd5e0",
  seam: "#7e9fb3",
  jeans: "#2a3848",
  shoe: "#263341",
  sole: "#f2eee4",
  frame: "#292b2e",
  eye: "#f7f1e7",
  iris: "#47352b",
  lip: "#895342",
};

// An original clay character. The floor and joint dimensions are kept in model
// space so one rig can sit, stand, and walk without swapping meshes.
export function createCharacter(
  { mesh, mat, box, ball, cylinder, rod, texture, panel },
  seated = false,
) {
  const root = new THREE.Group();
  root.name = "Pranav";
  const body = new THREE.Group();
  body.name = "character-body";
  root.add(body);
  const head = new THREE.Group();
  head.name = "character-head";
  head.position.y = 2.75;
  body.add(head);
  const arms = [];
  const legs = [];
  const skeletons = [];

  const soft = (size, color, parent, position, options = {}) =>
    mesh(
      new THREE.SphereGeometry(1, 28, 20),
      mat(color, { roughness: 0.86, ...options }),
      parent,
      position,
      size,
    );

  function curve(points, radius, color, parent, options = {}) {
    const path = new THREE.CatmullRomCurve3(
      points.map((point) => new THREE.Vector3(...point)),
    );
    return mesh(
      new THREE.TubeGeometry(path, 32, radius, 8, false),
      mat(color, { roughness: 0.86, ...options }),
      parent,
    );
  }

  // Smooth elliptical rings make a continuous silhouette instead of stacked
  // boxes. Profile coordinates are [horizontal radius, height, depth radius].
  function loft(profile, rings = 32, sides = 36) {
    const spline = new THREE.CatmullRomCurve3(
      profile.map((point) => new THREE.Vector3(...point)),
      false,
      "centripetal",
    );
    const positions = [];
    const indices = [];
    const uvs = [];
    for (let ring = 0; ring <= rings; ring++) {
      const p = spline.getPoint(ring / rings);
      for (let side = 0; side <= sides; side++) {
        const angle = (side / sides) * Math.PI * 2;
        positions.push(
          Math.max(0, p.x) * Math.cos(angle),
          p.y,
          Math.max(0, p.z) * Math.sin(angle),
        );
        uvs.push(side / sides, ring / rings);
        if (ring < rings && side < sides) {
          const a = ring * (sides + 1) + side;
          const b = a + sides + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  const faceGeometry = new THREE.SphereGeometry(1, 48, 32);
  const facePositions = faceGeometry.attributes.position;
  for (let i = 0; i < facePositions.count; i++) {
    const y = facePositions.getY(i);
    const jaw = 1 - Math.max(0, -y) * 0.16;
    facePositions.setXYZ(
      i,
      facePositions.getX(i) * 0.535 * jaw,
      y * 0.605,
      facePositions.getZ(i) * 0.445,
    );
  }
  faceGeometry.computeVertexNormals();
  mesh(faceGeometry, mat(COLORS.skin, { roughness: 0.9 }), head);

  for (const side of [-1, 1]) {
    soft([0.095, 0.15, 0.09], COLORS.skin, head, [
      side * 0.515,
      -0.015,
      -0.025,
    ]);
    soft([0.035, 0.08, 0.025], COLORS.skinShade, head, [
      side * 0.558,
      -0.027,
      0.042,
    ]);
  }

  // The hair is one asymmetric cap, with a high front hairline and lower back.
  // Its swept crown stays below y=3.45 in the standing pose.
  const hairPositions = [];
  const hairIndices = [];
  const hairSides = 48;
  const hairRings = 26;
  for (let ring = 0; ring <= hairRings; ring++) {
    for (let side = 0; side <= hairSides; side++) {
      const phi = (side / hairSides) * Math.PI * 2;
      const front = Math.max(0, Math.sin(phi));
      const back = Math.max(0, -Math.sin(phi));
      const limit = 1.52 - 0.4 * front * front + 0.25 * back;
      const theta = (ring / hairRings) * limit;
      const x = 0.552 * Math.sin(theta) * Math.cos(phi);
      const z = 0.462 * Math.sin(theta) * Math.sin(phi) - 0.018;
      const sweep =
        Math.exp(-((x + 0.17) ** 2 / 0.07 + (z - 0.16) ** 2 / 0.08)) * 0.072;
      hairPositions.push(x, 0.63 * Math.cos(theta) + sweep + 0.018, z);
      if (ring < hairRings && side < hairSides) {
        const a = ring * (hairSides + 1) + side;
        const b = a + hairSides + 1;
        hairIndices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  const hairGeometry = new THREE.BufferGeometry();
  hairGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(hairPositions, 3),
  );
  hairGeometry.setIndex(hairIndices);
  hairGeometry.computeVertexNormals();
  mesh(hairGeometry, mat(COLORS.hair, { roughness: 0.98 }), head);
  const quiff = soft(
    [0.44, 0.22, 0.34],
    COLORS.hair,
    head,
    [-0.12, 0.45, 0.14],
    { roughness: 0.78 },
  );
  quiff.rotation.z = -0.12;
  // Narrow relaxed eyes, eyelids, and restrained highlights avoid a shocked
  // expression. The glasses are rounded rectangles rather than round goggles.
  function glassesPath(centerX) {
    const w = 0.421;
    const h = 0.267;
    const r = 0.055;
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo(w / 2 - r, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    shape.lineTo(-w / 2 + r, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const path = new THREE.CatmullRomCurve3(
      shape
        .getPoints(8)
        .map((p) => new THREE.Vector3(p.x + centerX, p.y + 0.063, 0.475)),
      true,
    );
    return mesh(
      new THREE.TubeGeometry(path, 72, 0.012, 8, true),
      mat(COLORS.frame, { roughness: 0.38, metalness: 0.45 }),
      head,
    );
  }

  for (const side of [-1, 1]) {
    const x = side * 0.226;
    soft([0.101, 0.119, 0.033], COLORS.eye, head, [x, 0.047, 0.411], {
      roughness: 0.56,
    });
    soft([0.05, 0.073, 0.012], COLORS.iris, head, [x + 0.007, 0.03, 0.446], {
      roughness: 0.62,
    });
    soft([0.031, 0.047, 0.008], "#231e1b", head, [x + 0.008, 0.03, 0.457]);
    soft([0.013, 0.017, 0.004], "#fffaf1", head, [x - 0.005, 0.052, 0.465]);
    curve(
      [
        [x - 0.098, 0.07, 0.425],
        [x - 0.061, 0.147, 0.437],
        [x + 0.006, 0.161, 0.441],
        [x + 0.078, 0.131, 0.434],
        [x + 0.101, 0.07, 0.422],
      ],
      0.007,
      COLORS.skin,
      head,
    );
    curve(
      [
        [x - 0.1, 0.024, 0.423],
        [x, -0.071, 0.434],
        [x + 0.1, 0.024, 0.423],
      ],
      0.009,
      COLORS.skinShade,
      head,
    );
    curve(
      [
        [x - 0.13, 0.207, 0.392],
        [x - 0.034, 0.223, 0.416],
        [x + 0.096, 0.206, 0.405],
      ],
      0.024,
      COLORS.hair,
      head,
    );
    glassesPath(side * 0.232);
    rod(
      [side * 0.446, 0.1, 0.475],
      [side * 0.548, 0.08, -0.018],
      0.011,
      COLORS.frame,
      head,
    );
  }
  curve(
    [
      [-0.034, 0.082, 0.48],
      [0, 0.098, 0.492],
      [0.034, 0.082, 0.48],
    ],
    0.012,
    COLORS.frame,
    head,
  );
  soft([0.049, 0.096, 0.04], COLORS.skin, head, [0, -0.025, 0.44]);
  soft([0.075, 0.064, 0.077], COLORS.skin, head, [0, -0.085, 0.455]);
  for (const side of [-1, 1]) {
    curve(
      [
        [side * 0.012, -0.185, 0.433],
        [side * 0.077, -0.185, 0.43],
        [side * 0.127, -0.198, 0.414],
      ],
      0.013,
      "#46342b",
      head,
    );
  }
  curve(
    [
      [-0.113, -0.245, 0.403],
      [0, -0.26, 0.422],
      [0.113, -0.243, 0.403],
    ],
    0.01,
    COLORS.lip,
    head,
  );
  soft([0.081, 0.015, 0.018], "#b2735b", head, [0, -0.28, 0.402]);

  soft([0.164, 0.22, 0.16], COLORS.skin, body, [0, 2.16, -0.025]).name =
    "character-neck";
  mesh(
    loft([
      [0, 1.07, 0],
      [0.325, 1.075, 0.19],
      [0.395, 1.16, 0.237],
      [0.394, 1.45, 0.248],
      [0.46, 1.8, 0.279],
      [0.473, 1.96, 0.257],
      [0.389, 2.066, 0.215],
      [0.215, 2.105, 0.151],
      [0, 2.12, 0],
    ]),
    mat(COLORS.shirt, { roughness: 0.96 }),
    body,
  );
  soft([0.34, 0.14, 0.21], COLORS.jeans, body, [0, 1.08, -0.018]).name =
    "character-hips";

  for (const side of [-1, 1]) {
    const collarShape = new THREE.Shape();
    collarShape.moveTo(side * 0.025, 0.025);
    collarShape.quadraticCurveTo(side * 0.087, 0.06, side * 0.205, 0.037);
    collarShape.lineTo(side * 0.153, -0.135);
    collarShape.quadraticCurveTo(side * 0.07, -0.104, side * 0.025, 0.025);
    mesh(
      new THREE.ExtrudeGeometry(collarShape, {
        depth: 0.023,
        steps: 1,
        bevelEnabled: true,
        bevelSize: 0.011,
        bevelThickness: 0.011,
        bevelSegments: 3,
      }),
      mat(COLORS.collar, { roughness: 0.96, side: THREE.DoubleSide }),
      body,
      [0, 2.071, 0.19],
    );
  }
  box([0.048, 0.27, 0.019], COLORS.seam, body, [0, 1.915, 0.273], 0.013);
  for (const y of [1.995, 1.903, 1.815])
    soft([0.017, 0.017, 0.009], COLORS.sole, body, [0, y, 0.29]);
  panel(
    [0.093, 0.1],
    texture(
      (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#2a4e6c";
        ctx.font = "bold 155px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("P", w / 2, h * 0.73);
      },
      256,
      256,
    ),
    body,
    [0.246, 1.852, 0.257],
  );

  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.name = side < 0 ? "left-arm" : "right-arm";
    arm.position.set(side * 0.485, 2.04, -0.008);
    body.add(arm);
    arms.push(arm);
    mesh(
      loft(
        [
          [0, -0.325, 0],
          [0.14, -0.282, 0.147],
          [0.171, -0.156, 0.17],
          [0.176, -0.015, 0.17],
          [0.115, 0.075, 0.117],
          [0, 0.09, 0],
        ],
        22,
        28,
      ),
      mat(COLORS.shirt, { roughness: 0.96 }),
      arm,
    );
    soft([0.108, 0.16, 0.11], COLORS.skin, arm, [0, -0.316, 0]);
    const elbow = new THREE.Group();
    elbow.name = `${arm.name}-elbow`;
    elbow.position.y = -0.43;
    arm.add(elbow);
    soft([0.104, 0.104, 0.108], COLORS.skin, elbow, [0, 0, 0]);
    mesh(
      loft(
        [
          [0, -0.365, 0],
          [0.078, -0.347, 0.081],
          [0.087, -0.263, 0.089],
          [0.108, -0.082, 0.106],
          [0.1, 0.013, 0.099],
          [0, 0.04, 0],
        ],
        24,
        28,
      ),
      mat(COLORS.skin, { roughness: 0.9 }),
      elbow,
    );
    const hand = new THREE.Group();
    hand.name = `${arm.name}-hand`;
    hand.position.y = -0.34;
    elbow.add(hand);
    soft([0.088, 0.115, 0.064], COLORS.skin, hand, [0, -0.103, 0.009]);
    for (let finger = 0; finger < 4; finger++) {
      const length = finger === 0 || finger === 3 ? 0.047 : 0.058;
      soft([0.021, length, 0.036], COLORS.skin, hand, [
        -0.058 + finger * 0.037,
        -0.199 - length * 0.13,
        0.015,
      ]);
    }
    const thumb = soft([0.043, 0.077, 0.047], COLORS.skin, hand, [
      -side * 0.078,
      -0.11,
      0.025,
    ]);
    thumb.rotation.z = side * 0.43;
    arm.userData = { elbow, hand, side };

    const leg = new THREE.Group();
    leg.name = side < 0 ? "left-leg" : "right-leg";
    leg.position.set(side * 0.206, 1.06, 0);
    body.add(leg);
    legs.push(leg);
    const hip = new THREE.Bone();
    hip.name = `${leg.name}-hip`;
    const knee = new THREE.Bone();
    knee.name = `${leg.name}-knee`;
    knee.position.y = -0.48;
    const ankle = new THREE.Bone();
    ankle.name = `${leg.name}-ankle`;
    ankle.position.y = -0.42;
    hip.add(knee);
    knee.add(ankle);
    const trouserGeometry = loft(
      [
        [0, -0.95, 0],
        [0.128, -0.921, 0.132],
        [0.135, -0.82, 0.143],
        [0.161, -0.66, 0.16],
        [0.176, -0.48, 0.176],
        [0.192, -0.325, 0.197],
        [0.218, -0.11, 0.213],
        [0.205, 0.001, 0.202],
        [0, 0.039, 0],
      ],
      42,
      32,
    );
    const skinIndices = [];
    const skinWeights = [];
    const positions = trouserGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const weight = THREE.MathUtils.smoothstep(-positions.getY(i), 0.35, 0.61);
      skinIndices.push(0, 1, 0, 0);
      skinWeights.push(1 - weight, weight, 0, 0);
    }
    trouserGeometry.setAttribute(
      "skinIndex",
      new THREE.Uint16BufferAttribute(skinIndices, 4),
    );
    trouserGeometry.setAttribute(
      "skinWeight",
      new THREE.Float32BufferAttribute(skinWeights, 4),
    );
    const trousers = new THREE.SkinnedMesh(
      trouserGeometry,
      mat(COLORS.jeans, { roughness: 0.98 }),
    );
    trousers.name = `${leg.name}-continuous-trousers`;
    trousers.castShadow = true;
    trousers.receiveShadow = true;
    trousers.frustumCulled = false;
    leg.add(trousers);
    trousers.add(hip);
    const skeleton = new THREE.Skeleton([hip, knee, ankle]);
    trousers.bind(skeleton);
    skeletons.push(skeleton);

    const foot = new THREE.Group();
    foot.name = `${leg.name}-shoe`;
    ankle.add(foot);
    box([0.35, 0.06, 0.57], COLORS.sole, foot, [0, -0.13, 0.118], 0.027);
    box([0.327, 0.19, 0.535], COLORS.shoe, foot, [0, -0.044, 0.113], 0.081);
    box([0.25, 0.037, 0.042], COLORS.sole, foot, [0, -0.031, -0.155], 0.017);
    for (let lace = 0; lace < 3; lace++)
      rod(
        [-0.071, 0.054, 0.12 + lace * 0.041],
        [0.071, 0.054, 0.132 + lace * 0.041],
        0.008,
        COLORS.sole,
        foot,
      );
    leg.userData = { hip, knee, ankle, foot, trousers, side };
  }

  function pose(amount) {
    const standing = THREE.MathUtils.clamp(
      Number.isFinite(amount) ? amount : 1,
      0,
      1,
    );
    const sitting = 1 - standing;
    const hipAngle = (sitting * Math.PI) / 2;
    // Counter-rotate the knee so shins and soles remain vertical/horizontal.
    // Lowering by lost thigh height is the exact floor correction, not a hack
    // on individual shoe vertices. Both poses keep the sole bottom at y=0.
    body.position.y = -0.48 * (1 - Math.cos(hipAngle));
    for (const leg of legs) {
      leg.rotation.x = -hipAngle;
      leg.userData.knee.rotation.x = hipAngle;
      leg.userData.ankle.rotation.x = 0;
    }
    for (const arm of arms) {
      arm.rotation.x = THREE.MathUtils.lerp(-1, -0.015, standing);
      arm.rotation.z =
        arm.userData.side * THREE.MathUtils.lerp(0.16, 0.085, standing);
      arm.userData.elbow.rotation.x = THREE.MathUtils.lerp(
        -0.55,
        -0.09,
        standing,
      );
      arm.userData.hand.rotation.x = THREE.MathUtils.lerp(0.08, 0.02, standing);
    }
    root.updateMatrixWorld(true);
    for (const skeleton of skeletons) skeleton.update();
    return standing;
  }

  pose(seated ? 0 : 1);
  return { root, body, head, arms, legs, pose };
}
