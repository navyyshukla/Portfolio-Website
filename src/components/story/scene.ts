import * as THREE from "three";

/**
 * Procedural low-poly isometric scene for the life-story path.
 *
 * Modelled on the Clash of Clans look: 3D isometric cartoon, low poly, low
 * detail, warm saturated palette, flat-ish lighting. Everything is built from
 * primitives at runtime — there are no model files to download, which keeps the
 * whole thing to the Three.js core and nothing else.
 *
 * Kept out of React deliberately: this module is imported only by Story3D,
 * which is itself behind next/dynamic, so none of it can reach "/".
 */

export interface Stage {
  year: string;
  title: string;
  detail?: string;
}

const PALETTE = {
  grass: 0x6ab04c,
  grassAlt: 0x5d9c43,
  dirt: 0xc98a4b,
  path: 0xd9b382,
  stone: 0x8d99ae,
  roof: 0xd94f3d,
  wall: 0xf2e3c6,
  wood: 0x8b5a2b,
  water: 0x3fa9c9,
  skin: 0xf0c088,
  shirt: 0xff8c42,
  shirtGrown: 0x2e5fa3,
  trousers: 0x3a4a63,
  hair: 0x2b2118,
  tree: 0x3f7d3a,
  trunk: 0x6b4423,
};

const STEP = 9; // world units between stages

/**
 * A softened box. Real bevels need BufferGeometryUtils; instead the corners are
 * knocked off by scaling a slightly-subdivided box, which reads as "moulded
 * plastic toy" rather than "Minecraft cube" at this camera distance.
 */
function box(
  w: number,
  h: number,
  d: number,
  color: number,
  smooth = false,
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d, 2, 2, 2);
  const pos = geo.attributes.position;
  const r = Math.min(w, h, d) * 0.16;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 1) {
    v.fromBufferAttribute(pos, i);
    // pull corner vertices inward along each axis
    v.x -= Math.sign(v.x) * (Math.abs(v.x) > w / 4 ? r : 0) * 0.5;
    v.y -= Math.sign(v.y) * (Math.abs(v.y) > h / 4 ? r : 0) * 0.5;
    v.z -= Math.sign(v.z) * (Math.abs(v.z) > d / 4 ? r : 0) * 0.5;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82,
    metalness: 0.02,
    flatShading: !smooth,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Smooth capsule — used for limbs and torso so the boy is not a stack of cubes. */
function capsule(radius: number, length: number, color: number): THREE.Mesh {
  const geo = new THREE.CapsuleGeometry(radius, length, 4, 12);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.02 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

/** Smooth sphere — head. */
function ball(radius: number, color: number): THREE.Mesh {
  const geo = new THREE.SphereGeometry(radius, 20, 16);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.02 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

function cyl(rt: number, rb: number, h: number, seg: number, color: number): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(rt, rb, h, seg);
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.8,
    metalness: 0.02,
    flatShading: seg <= 8,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** A blocky low-poly boy. Limbs are named so the walk cycle can swing them. */
export function makeBoy() {
  const group = new THREE.Group();

  const legL = capsule(0.15, 0.62, PALETTE.trousers);
  const legR = capsule(0.15, 0.62, PALETTE.trousers);
  legL.position.set(-0.2, 0.5, 0);
  legR.position.set(0.2, 0.5, 0);

  const torso = capsule(0.32, 0.6, PALETTE.shirt);
  torso.position.y = 1.42;
  torso.scale.set(1.15, 1, 0.85);

  const armL = capsule(0.105, 0.58, PALETTE.skin);
  const armR = capsule(0.105, 0.58, PALETTE.skin);
  armL.position.set(-0.46, 1.48, 0);
  armR.position.set(0.46, 1.48, 0);

  const head = ball(0.34, PALETTE.skin);
  head.position.y = 2.12;
  head.scale.set(1, 1.06, 0.96);

  const hair = ball(0.35, PALETTE.hair);
  hair.position.y = 2.2;
  hair.scale.set(1.02, 0.62, 1.02);

  const shoeL = capsule(0.11, 0.14, PALETTE.hair);
  const shoeR = capsule(0.11, 0.14, PALETTE.hair);
  shoeL.rotation.z = Math.PI / 2;
  shoeR.rotation.z = Math.PI / 2;
  shoeL.position.set(-0.2, 0.11, 0.05);
  shoeR.position.set(0.2, 0.11, 0.05);

  group.add(legL, legR, torso, armL, armR, head, hair, shoeL, shoeR);
  group.userData = { legL, legR, armL, armR, torso };
  return group;
}

/** A little hut per stage — the goblin-base cue. */
function makeHut(scale: number) {
  const g = new THREE.Group();
  const base = box(2.2 * scale, 1.4 * scale, 2.2 * scale, PALETTE.wall);
  base.position.y = 0.7 * scale;
  const roof = cyl(0.02, 1.9 * scale, 1.2 * scale, 4, PALETTE.roof);
  roof.position.y = 2.0 * scale;
  roof.rotation.y = Math.PI / 4;
  const door = box(0.5 * scale, 0.8 * scale, 0.08, PALETTE.wood);
  door.position.set(0, 0.4 * scale, 1.12 * scale);
  g.add(base, roof, door);
  return g;
}

function makeTree() {
  const g = new THREE.Group();
  const trunk = cyl(0.16, 0.22, 0.9, 6, PALETTE.trunk);
  trunk.position.y = 0.45;
  const leaves = cyl(0.02, 1.0, 1.6, 6, PALETTE.tree);
  leaves.position.y = 1.6;
  g.add(trunk, leaves);
  return g;
}

/** Milestone card, drawn to a canvas and hung in the scene beside the boy. */
function makeCard(stage: Stage, index: number, total: number) {
  const c = document.createElement("canvas");
  c.width = 560;
  c.height = 300;
  const x = c.getContext("2d");
  if (x) {
    x.fillStyle = "rgba(9, 15, 28, 0.94)";
    x.strokeStyle = "#ffb072";
    x.lineWidth = 5;
    const r = 22;
    x.beginPath();
    x.roundRect(4, 4, c.width - 8, c.height - 8, r);
    x.fill();
    x.stroke();

    x.fillStyle = "#ffb072";
    x.font = "600 30px ui-monospace, monospace";
    x.fillText(`STAGE ${String(index + 1).padStart(2, "0")} / ${total}`, 34, 62);

    x.font = "700 62px ui-monospace, monospace";
    x.fillText(stage.year, 34, 132);

    x.fillStyle = "#f4f7fc";
    x.font = "600 34px ui-sans-serif, system-ui, sans-serif";
    // naive wrap
    const words = stage.title.split(" ");
    let line = "";
    let y = 190;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (x.measureText(test).width > c.width - 70) {
        x.fillText(line, 34, y);
        line = word;
        y += 42;
      } else {
        line = test;
      }
    }
    x.fillText(line, 34, y);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }),
  );
  sprite.scale.set(5.6, 3.0, 1);
  return sprite;
}

export interface SceneHandle {
  /** Move the boy toward a stage index. */
  goTo(index: number, instant: boolean): void;
  resize(): void;
  dispose(): void;
  /** Advance one frame. Returns true while still walking. */
  frame(dt: number): boolean;
}

export function createScene(
  canvas: HTMLCanvasElement,
  stages: Stage[],
  reduced: boolean,
): SceneHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  // Higher cap than the dot field: this is a deliberate showpiece, and the
  // brief was that it can afford to be expensive.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Tone mapping + sRGB output is what stops flat-lit primitives looking like
  // untextured Minecraft blocks.
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fd8f0);
  scene.fog = new THREE.Fog(0x9fd8f0, 46, 96);

  // True isometric: orthographic camera on a 45/35.264 degree axis.
  const camera = new THREE.OrthographicCamera(-12, 12, 7, -7, 0.1, 200);
  const camOffset = new THREE.Vector3(16, 16, 16);

  // Sky/ground bounce gives the shadowed sides colour instead of flat grey.
  scene.add(new THREE.HemisphereLight(0xbfe4ff, 0x4e7a3a, 1.15));
  const sun = new THREE.DirectionalLight(0xfff2dc, 2.1);
  sun.position.set(18, 30, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  // Cool rim from behind separates silhouettes from the sky.
  const rim = new THREE.DirectionalLight(0x9dc6ff, 0.5);
  rim.position.set(-16, 12, -18);
  scene.add(rim);
  const d = 40;
  sun.shadow.camera.left = -d;
  sun.shadow.camera.right = d;
  sun.shadow.camera.top = d;
  sun.shadow.camera.bottom = -d;
  scene.add(sun);

  const span = (stages.length - 1) * STEP;

  // --- ground: chunky grass tiles ---
  const ground = new THREE.Group();
  for (let x = -2; x <= stages.length + 1; x += 1) {
    for (let z = -3; z <= 3; z += 1) {
      const tile = box(STEP, 0.6, 6, (x + z) % 2 === 0 ? PALETTE.grass : PALETTE.grassAlt);
      tile.position.set(x * STEP - STEP, -0.3, z * 6);
      tile.receiveShadow = true;
      ground.add(tile);
    }
  }
  scene.add(ground);

  // --- the path itself ---
  for (let i = 0; i < stages.length - 1; i += 1) {
    for (let s = 0; s < 6; s += 1) {
      const slab = box(1.3, 0.18, 1.9, PALETTE.path);
      slab.position.set(i * STEP + s * (STEP / 6) + 0.7, 0.09, 0);
      scene.add(slab);
    }
  }

  // --- one platform + hut + trees per stage ---
  stages.forEach((_, i) => {
    const grow = 0.55 + (i / Math.max(1, stages.length - 1)) * 0.75;
    const pad = cyl(2.6, 2.9, 0.5, 6, PALETTE.dirt);
    pad.position.set(i * STEP, 0.25, 0);
    pad.receiveShadow = true;
    scene.add(pad);

    const hut = makeHut(grow);
    hut.position.set(i * STEP - 0.3, 0.5, -3.4);
    scene.add(hut);

    const t1 = makeTree();
    t1.position.set(i * STEP + 3.4, 0.2, 3.1);
    const t2 = makeTree();
    t2.position.set(i * STEP - 3.1, 0.2, 3.6);
    t2.scale.setScalar(0.8);
    scene.add(t1, t2);
  });

  const boy = makeBoy();
  boy.position.set(0, 0.5, 0);
  scene.add(boy);

  let card: THREE.Sprite | null = null;
  const showCard = (i: number) => {
    if (card) {
      scene.remove(card);
      card.material.map?.dispose();
      card.material.dispose();
    }
    card = makeCard(stages[i], i, stages.length);
    card.position.set(i * STEP + 4.6, 3.4, 0);
    scene.add(card);
  };

  let current = 0;
  let fromX = 0;
  let toX = 0;
  let progress = 1;
  let walkPhase = 0;

  const applyScale = () => {
    const t = current / Math.max(1, stages.length - 1);
    boy.scale.setScalar(0.62 + t * 0.75);
    const torso = boy.userData.torso as THREE.Mesh;
    (torso.material as THREE.MeshLambertMaterial).color.setHex(
      t > 0.55 ? PALETTE.shirtGrown : PALETTE.shirt,
    );
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    renderer.setSize(w, h, false);
    const viewH = 9;
    const aspect = w / h;
    camera.left = -viewH * aspect;
    camera.right = viewH * aspect;
    camera.top = viewH;
    camera.bottom = -viewH;
    camera.updateProjectionMatrix();
  };

  const frame = (dt: number): boolean => {
    const walking = progress < 1;
    if (walking) {
      progress = Math.min(1, progress + dt * 0.55);
      boy.position.x = fromX + (toX - fromX) * easeInOut(progress);
      walkPhase += dt * 11;
      const swing = Math.sin(walkPhase) * 0.55;
      (boy.userData.legL as THREE.Mesh).rotation.x = swing;
      (boy.userData.legR as THREE.Mesh).rotation.x = -swing;
      (boy.userData.armL as THREE.Mesh).rotation.x = -swing * 0.8;
      (boy.userData.armR as THREE.Mesh).rotation.x = swing * 0.8;
      boy.position.y = 0.5 + Math.abs(Math.sin(walkPhase)) * 0.09;
      boy.rotation.y = toX >= fromX ? Math.PI / 2 : -Math.PI / 2;
    } else {
      (boy.userData.legL as THREE.Mesh).rotation.x = 0;
      (boy.userData.legR as THREE.Mesh).rotation.x = 0;
      (boy.userData.armL as THREE.Mesh).rotation.x = 0;
      (boy.userData.armR as THREE.Mesh).rotation.x = 0;
      boy.position.y = 0.5;
      boy.rotation.y = 0;
    }

    const target = new THREE.Vector3(boy.position.x, 0, 0);
    camera.position.copy(target).add(camOffset);
    camera.lookAt(target);

    renderer.render(scene, camera);
    return walking;
  };

  const goTo = (index: number, instant: boolean) => {
    const clamped = Math.max(0, Math.min(stages.length - 1, index));
    fromX = boy.position.x;
    toX = clamped * STEP;
    progress = instant || reduced ? 1 : 0;
    if (progress === 1) boy.position.x = toX;
    current = clamped;
    applyScale();
    showCard(clamped);
  };

  const dispose = () => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
    if (card) {
      card.material.map?.dispose();
      card.material.dispose();
    }
    renderer.dispose();
  };

  resize();
  goTo(0, true);
  void span;

  return { goTo, resize, dispose, frame };
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
