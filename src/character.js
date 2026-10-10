import * as THREE from "three";

const COLORS = {
  skin: "#b98161",
  skinShade: "#a96f54",
  hair: "#24201e",
  hairLight: "#302b27",
  shirt: "#ed4854",
  collar: "#d73746",
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
  const shirtPattern = texture(
    (ctx, w, h) => {
      // An original repeatable cloud camouflage, drawn rather than extracted
      // from the portrait. Three reds keep the pattern tonal in warm clay light.
      let seed = 1847;
      const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      ctx.fillStyle = COLORS.shirt;
      ctx.fillRect(0, 0, w, h);
      const shades = ["#d53544", "#df3d4b", "#f05a63"];
      for (let row = 0; row < 18; row++) {
        for (let col = 0; col < 18; col++) {
          const x = ((col + 0.5) * w) / 18 + (random() - 0.5) * 25;
          const y = ((row + 0.5) * h) / 18 + (random() - 0.5) * 25;
          const radius = 23 + random() * 15;
          const lobes = Array.from({ length: 12 }, (_, i) => {
            const angle = (i * Math.PI) / 6;
            const reach = radius * (0.45 + random() * 0.55);
            return [Math.cos(angle) * reach, Math.sin(angle) * reach * 0.78];
          });
          const color = shades[(row + col) % shades.length];
          for (const dx of [-w, 0, w]) {
            for (const dy of [-h, 0, h]) {
              ctx.fillStyle = color;
              ctx.beginPath();
              for (let i = 0; i < lobes.length; i++) {
                const p = lobes[i];
                const q = lobes[(i + 1) % lobes.length];
                const mx = x + dx + (p[0] + q[0]) / 2;
                const my = y + dy + (p[1] + q[1]) / 2;
                if (i === 0) ctx.moveTo(mx, my);
                else ctx.quadraticCurveTo(x + dx + p[0], y + dy + p[1], mx, my);
              }
              ctx.closePath();
              ctx.fill();
            }
          }
        }
      }
    },
    1024,
    1024,
  );
  shirtPattern.wrapS = THREE.RepeatWrapping;
  shirtPattern.wrapT = THREE.RepeatWrapping;
  const shirtMaterial = mat("#ffffff", { map: shirtPattern, roughness: 0.97 });

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

  // A short, wavy cap and interlocking clay curls personalize the silhouette.
  // The smaller underlying crown leaves room for curls below y=3.45.
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
        Math.exp(-((x + 0.17) ** 2 / 0.07 + (z - 0.16) ** 2 / 0.08)) * 0.046;
      const wave = Math.sin(phi * 7 + theta * 5) * 0.01 * Math.sin(theta);
      hairPositions.push(x, 0.605 * Math.cos(theta) + sweep + 0.023 + wave, z);
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
  const curlRows = [
    {
      theta: 0.21,
      count: 5,
      start: 0,
      span: Math.PI * 2,
      size: [0.091, 0.044, 0.084],
    },
    {
      theta: 0.58,
      count: 8,
      start: 0,
      span: Math.PI * 2,
      size: [0.107, 0.057, 0.09],
    },
    {
      theta: 0.96,
      count: 7,
      start: 0.24,
      span: Math.PI - 0.48,
      size: [0.09, 0.054, 0.082],
    },
  ];
  for (const row of curlRows) {
    for (let i = 0; i < row.count; i++) {
      const phi = row.start + (i / row.count) * row.span;
      const theta = row.theta + Math.sin(i * 2.1) * 0.025;
      const x = 0.543 * Math.sin(theta) * Math.cos(phi);
      const z = 0.453 * Math.sin(theta) * Math.sin(phi) - 0.018;
      const sweep =
        Math.exp(-((x + 0.17) ** 2 / 0.07 + (z - 0.16) ** 2 / 0.08)) * 0.046;
      const y = 0.605 * Math.cos(theta) + sweep + 0.012;
      const curl = soft(
        row.size,
        i % 4 === 0 ? COLORS.hairLight : COLORS.hair,
        head,
        [x, y, z],
        { roughness: 0.96 },
      );
      curl.rotation.set(0.14 * Math.sin(phi), -phi, Math.sin(i * 1.8) * 0.23);
    }
  }

  // Opaque glossy lenses, thicker rectangular frames, and modest reflections
  // match the sunglasses in the supplied red-shirt portrait.
  function sunglasses(centerX) {
    const w = 0.434;
    const h = 0.299;
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
    const lens = mesh(
      new THREE.ShapeGeometry(shape, 16),
      mat("#11141b", {
        roughness: 0.15,
        metalness: 0.32,
        side: THREE.DoubleSide,
      }),
      head,
      [centerX, 0.065, 0.481],
    );
    lens.name = "sunglass-lens";
    const path = new THREE.CatmullRomCurve3(
      shape
        .getPoints(8)
        .map((p) => new THREE.Vector3(p.x + centerX, p.y + 0.065, 0.487)),
      true,
    );
    mesh(
      new THREE.TubeGeometry(path, 72, 0.018, 8, true),
      mat("#15171a", { roughness: 0.27, metalness: 0.2 }),
      head,
    );
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: "#a4b0bd",
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    });
    const reflection = mesh(
      new THREE.PlaneGeometry(0.13, 0.011),
      highlightMaterial,
      head,
      [centerX - 0.05, 0.144, 0.49],
    );
    reflection.rotation.z = -0.23;
    mesh(new THREE.PlaneGeometry(0.07, 0.005), highlightMaterial, head, [
      centerX + 0.073,
      0.016,
      0.49,
    ]).rotation.z = -0.23;
  }

  for (const side of [-1, 1]) {
    const x = side * 0.226;
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
    sunglasses(side * 0.235);
    rod(
      [side * 0.45, 0.1, 0.487],
      [side * 0.548, 0.08, -0.018],
      0.018,
      COLORS.frame,
      head,
    );
  }
  curve(
    [
      [-0.04, 0.082, 0.491],
      [0, 0.105, 0.498],
      [0.04, 0.082, 0.491],
    ],
    0.018,
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
  function smilePatch(shape, color, front) {
    const geometry = new THREE.ShapeGeometry(shape, 20);
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const faceY = y - 0.254;
      const jawRadius = 0.535 * (1 - Math.max(0, -faceY / 0.605) * 0.16);
      const surface =
        0.445 *
        Math.sqrt(Math.max(0, 1 - (x / jawRadius) ** 2 - (faceY / 0.605) ** 2));
      positions.setZ(i, surface - 0.414);
    }
    geometry.computeVertexNormals();
    return mesh(
      geometry,
      mat(color, { roughness: 0.83, side: THREE.DoubleSide }),
      head,
      [0, -0.254, front],
    );
  }
  const smile = new THREE.Shape();
  smile.moveTo(-0.165, 0.043);
  smile.quadraticCurveTo(-0.081, -0.074, 0, -0.073);
  smile.quadraticCurveTo(0.096, -0.072, 0.166, 0.045);
  smile.quadraticCurveTo(0.076, 0.017, 0, 0.013);
  smile.quadraticCurveTo(-0.075, 0.015, -0.165, 0.043);
  smilePatch(smile, "#533127", 0.422).name = "friendly-smile";
  const teeth = new THREE.Shape();
  teeth.moveTo(-0.143, 0.029);
  teeth.quadraticCurveTo(0, -0.002, 0.142, 0.03);
  teeth.quadraticCurveTo(0.113, -0.015, 0, -0.027);
  teeth.quadraticCurveTo(-0.111, -0.017, -0.143, 0.029);
  smilePatch(teeth, "#f3e9d6", 0.428).name = "smile-teeth";
  curve(
    [
      [-0.145, -0.236, 0.399],
      [0, -0.328, 0.383],
      [0.145, -0.235, 0.399],
    ],
    0.012,
    COLORS.lip,
    head,
  );
  // A warm shadow and a few tiny strokes imply light chin stubble.
  soft([0.159, 0.028, 0.012], "#94634b", head, [0, -0.418, 0.321], {
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  for (let i = 0; i < 9; i++) {
    const x = -0.17 + i * 0.0425;
    const y = -0.397 - (1 - Math.abs(x) / 0.2) * 0.026;
    const jawRadius = 0.535 * (1 - Math.max(0, -y / 0.605) * 0.16);
    const z =
      0.445 *
        Math.sqrt(Math.max(0, 1 - (x / jawRadius) ** 2 - (y / 0.605) ** 2)) +
      0.006;
    curve(
      [
        [x, y + 0.008, z],
        [x + 0.003, y - 0.008, z],
      ],
      0.0035,
      "#85604a",
      head,
    );
  }

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
    shirtMaterial,
    body,
  );
  soft([0.34, 0.14, 0.21], COLORS.jeans, body, [0, 1.08, -0.018]).name =
    "character-hips";

  const neckline = mesh(
    new THREE.TorusGeometry(0.177, 0.026, 12, 48),
    mat(COLORS.collar, { roughness: 0.98 }),
    body,
    [0, 2.092, -0.008],
    [1, 0.88, 1],
  );
  neckline.rotation.x = Math.PI / 2;
  neckline.name = "crew-neckline";

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
      shirtMaterial,
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

  const down = new THREE.Vector3(0, -1, 0);
  const portraitTargets = arms.map((arm) => {
    const left = arm.userData.side < 0;
    const upperDirection = new THREE.Vector3(
      ...(left ? [0.045, -0.83, 0.557] : [-0.035, -0.6, 0.799]),
    ).normalize();
    const forearmDirection = new THREE.Vector3(
      ...(left ? [0.94, -0.12, 0.32] : [-0.95, -0.06, 0.3]),
    ).normalize();
    const upper = new THREE.Quaternion().setFromUnitVectors(
      down,
      upperDirection,
    );
    const lowerWorld = new THREE.Quaternion().setFromUnitVectors(
      down,
      forearmDirection,
    );
    const elbow = upper.clone().invert().multiply(lowerWorld);
    const hand = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, arm.userData.side * 0.16, arm.userData.side * 0.06),
    );
    return {
      upper,
      elbow,
      hand,
      position: new THREE.Vector3(arm.userData.side * 0.485, 2.04, -0.008),
    };
  });
  const elbowPosition = new THREE.Vector3(0, -0.43, 0);
  const handPosition = new THREE.Vector3(0, -0.34, 0);

  // Apply after the main scene's typing/walking arm updates each frame.
  // 0 leaves that motion intact; 1 folds the forearms across the red shirt.
  function portraitPose(amount) {
    const blend = THREE.MathUtils.clamp(
      Number.isFinite(amount) ? amount : 0,
      0,
      1,
    );
    if (blend === 0) return blend;
    arms.forEach((arm, index) => {
      const target = portraitTargets[index];
      arm.position.lerp(target.position, blend);
      arm.quaternion.slerp(target.upper, blend);
      arm.userData.elbow.position.lerp(elbowPosition, blend);
      arm.userData.elbow.quaternion.slerp(target.elbow, blend);
      arm.userData.hand.position.lerp(handPosition, blend);
      arm.userData.hand.quaternion.slerp(target.hand, blend);
    });
    root.updateMatrixWorld(true);
    return blend;
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
      arm.position.set(arm.userData.side * 0.485, 2.04, -0.008);
      arm.rotation.set(
        THREE.MathUtils.lerp(-1, -0.015, standing),
        0,
        arm.userData.side * THREE.MathUtils.lerp(0.16, 0.085, standing),
      );
      arm.userData.elbow.position.copy(elbowPosition);
      arm.userData.elbow.rotation.set(
        THREE.MathUtils.lerp(-0.55, -0.09, standing),
        0,
        0,
      );
      arm.userData.hand.position.copy(handPosition);
      arm.userData.hand.rotation.set(
        THREE.MathUtils.lerp(0.08, 0.02, standing),
        0,
        0,
      );
    }
    root.updateMatrixWorld(true);
    for (const skeleton of skeletons) skeleton.update();
    return standing;
  }

  pose(seated ? 0 : 1);
  return { root, body, head, arms, legs, pose, portraitPose };
}
