(() => {
  'use strict';

  document.body.classList.add('is-loading');

  const RED = 0xa8030f;
  const RED_DARK = 0x650006;
  const INK = 0x171717;
  const WHITE = 0xffffff;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const loader = document.getElementById('loader');
  const fallback = document.getElementById('webglFallback');
  const progressEl = document.documentElement;

  if (!window.THREE || !document.getElementById('world')) {
    showFallback();
    return;
  }

  const THREE = window.THREE;
  const canvas = document.getElementById('world');
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xfffbf8, 0.018);

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 140);
  camera.position.set(0, 0.3, 12);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = !prefersReduced;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const ambient = new THREE.HemisphereLight(0xffffff, 0xf0ced0, 1.8);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, 3.8);
  key.position.set(5, 7, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const redRim = new THREE.PointLight(RED, 2.8, 22);
  redRim.position.set(-5, 2, 3);
  scene.add(redRim);

  const world = new THREE.Group();
  scene.add(world);

  const groups = {
    logo: new THREE.Group(),
    certificates: new THREE.Group(),
    cubes: new THREE.Group(),
    process: new THREE.Group(),
    scale: new THREE.Group(),
    ecosystem: new THREE.Group(),
    platform: new THREE.Group(),
    future: new THREE.Group(),
    particles: new THREE.Group()
  };
  Object.values(groups).forEach(g => world.add(g));

  const state = {
    scroll: 0,
    targetScroll: 0,
    stage: 0,
    mouse: new THREE.Vector2(0, 0),
    mouseTarget: new THREE.Vector2(0, 0),
    time: 0,
    last: performance.now(),
    ready: false
  };

  const clock = new THREE.Clock();
  const physicsItems = [];
  const certificateItems = [];
  const processLabels = [];
  const ecosystemLabels = [];
  const platformLabels = [];

  const materials = {
    red: new THREE.MeshStandardMaterial({ color: RED, metalness: 0.2, roughness: 0.42 }),
    redDark: new THREE.MeshStandardMaterial({ color: RED_DARK, metalness: 0.32, roughness: 0.38 }),
    white: new THREE.MeshStandardMaterial({ color: WHITE, metalness: 0.04, roughness: 0.55 }),
    black: new THREE.MeshStandardMaterial({ color: INK, metalness: 0.05, roughness: 0.65 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.38, roughness: 0.12, metalness: 0, transmission: 0.22, thickness: 0.4, clearcoat: 1 }),
    line: new THREE.LineBasicMaterial({ color: RED, transparent: true, opacity: 0.22 })
  };

  init();

  function init() {
    createLogo();
    createCertificates();
    createProofCubes();
    createProcessTrack();
    createScaleScene();
    createEcosystem();
    createPlatformTeaser();
    createFutureNetwork();
    createParticles();
    bindEvents();
    updateScrollTarget();
    revealLoaded();
    animate();
  }

  function revealLoaded() {
    window.setTimeout(() => {
      state.ready = true;
      loader?.classList.add('is-hidden');
      document.body.classList.remove('is-loading');
    }, 650);
  }

  function showFallback() {
    if (fallback) fallback.hidden = false;
    loader?.classList.add('is-hidden');
    document.body.classList.remove('is-loading');
  }

  function createLogo() {
    const tex = new THREE.TextureLoader().load('assets/redruff-logo-transparent.png');
    if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;

    const mark = new THREE.Mesh(
      new THREE.PlaneGeometry(4.15, 4.38, 4, 4),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 1, depthWrite: false })
    );
    mark.position.z = 0.08;
    groups.logo.add(mark);

    const back = new THREE.Mesh(
      new THREE.CylinderGeometry(1.93, 1.93, 0.22, 96),
      new THREE.MeshStandardMaterial({ color: RED, metalness: .24, roughness: .35, transparent: true, opacity: .1 })
    );
    back.rotation.x = Math.PI / 2;
    back.position.z = -0.08;
    back.castShadow = true;
    back.receiveShadow = true;
    groups.logo.add(back);

    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(2.16, 0.028, 12, 128),
      new THREE.MeshStandardMaterial({ color: RED, metalness: .42, roughness: .3, transparent: true, opacity: .28 })
    );
    torus.position.z = -0.12;
    groups.logo.add(torus);

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.18, 1),
      new THREE.MeshStandardMaterial({ color: RED, emissive: RED, emissiveIntensity: .12, metalness: .3, roughness: .32 })
    );
    core.position.set(0, -0.2, .26);
    groups.logo.add(core);

    groups.logo.position.set(0, 0.25, 0);
  }

  function createCertificates() {
    const geo = new THREE.PlaneGeometry(1.55, 0.98);
    for (let i = 0; i < 22; i++) {
      const tex = makeCardTexture({
        title: i % 3 === 0 ? 'CERTIFICATE' : i % 3 === 1 ? 'COURSE DONE' : 'BADGE',
        line1: 'Completed',
        line2: 'No proof attached',
        accent: i % 2 === 0 ? '#a8030f' : '#222222'
      });
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
      const card = new THREE.Mesh(geo, mat);
      const x = randomRange(-5.8, 5.8, i);
      const y = randomRange(-2.3, 2.8, i + 33);
      const z = randomRange(-3.5, 1.2, i + 77);
      card.position.set(x, y, z);
      card.rotation.set(randomRange(-.38, .42, i + 3), randomRange(-.58, .58, i + 9), randomRange(-.18, .18, i + 18));
      card.userData.base = card.position.clone();
      card.userData.velocity = new THREE.Vector3(0, 0, 0);
      card.userData.seed = i * 9.31;
      groups.certificates.add(card);
      certificateItems.push(card);
    }
  }

  function createProofCubes() {
    const geo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
    for (let i = 0; i < 110; i++) {
      const mat = (i % 6 === 0 ? materials.white : i % 7 === 0 ? materials.redDark : materials.red).clone();
      mat.transparent = true;
      mat.opacity = 0;
      const cube = new THREE.Mesh(geo, mat);
      cube.castShadow = true;
      cube.receiveShadow = true;
      cube.position.set(randomRange(-6, 6, i), randomRange(-3, 3, i + 10), randomRange(-3, 4, i + 22));
      cube.rotation.set(randomRange(-1, 1, i), randomRange(-1, 1, i + 2), randomRange(-1, 1, i + 5));
      cube.userData.velocity = new THREE.Vector3();
      cube.userData.target = cube.position.clone();
      cube.userData.seed = i;
      cube.userData.scaleBase = randomRange(.74, 1.28, i + 14);
      cube.scale.setScalar(cube.userData.scaleBase);
      groups.cubes.add(cube);
      physicsItems.push(cube);
    }
  }

  function createProcessTrack() {
    const steps = ['Learn', 'Build', 'Debug', 'Solve', 'Deploy', 'Prove'];
    const tubeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.6, -.2, 0),
      new THREE.Vector3(-2.8, .75, -.85),
      new THREE.Vector3(-1, -.65, .65),
      new THREE.Vector3(1, .65, -.65),
      new THREE.Vector3(2.8, -.25, .8),
      new THREE.Vector3(4.6, .35, 0)
    ]);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(tubeCurve, 120, .035, 10, false),
      new THREE.MeshStandardMaterial({ color: RED, metalness: .4, roughness: .28, transparent: true, opacity: 0 })
    );
    groups.process.add(tube);
    groups.process.userData.tube = tube;

    steps.forEach((step, i) => {
      const t = i / (steps.length - 1);
      const pos = tubeCurve.getPoint(t);
      const node = new THREE.Mesh(
        new THREE.IcosahedronGeometry(.28, 2),
        new THREE.MeshStandardMaterial({ color: i === steps.length - 1 ? RED_DARK : RED, metalness: .22, roughness: .38, transparent: true, opacity: 0 })
      );
      node.position.copy(pos);
      node.castShadow = true;
      groups.process.add(node);
      const label = makeTextPlane(step, `${String(i + 1).padStart(2, '0')}`, 1.3, .52, { titleSize: 58, subtitleSize: 30, align: 'center' });
      label.position.set(pos.x, pos.y + .72, pos.z + .05);
      label.material.opacity = 0;
      groups.process.add(label);
      processLabels.push(label, node);
    });
  }

  function createScaleScene() {
    const specs = [
      { main: '1M', sub: 'AI-capable builders', pos: [-3.65, .55, 0] },
      { main: '50,000', sub: 'solution proofs', pos: [0, -.35, .2] },
      { main: '2 years', sub: 'mission duration', pos: [3.7, .55, 0] }
    ];
    specs.forEach((s, index) => {
      const label = makeBigNumberTexture(s.main, s.sub);
      const mat = new THREE.MeshBasicMaterial({ map: label, transparent: true, opacity: 0, depthWrite: false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(index === 1 ? 3.4 : 2.65, 1.5), mat);
      mesh.position.set(...s.pos);
      groups.scale.add(mesh);
    });

    const ringGeo = new THREE.TorusGeometry(2.9, .022, 10, 180);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({ color: RED, transparent: true, opacity: 0, metalness: .35, roughness: .28 }));
    ring.rotation.x = Math.PI / 2.2;
    groups.scale.add(ring);
    groups.scale.userData.ring = ring;
  }

  function createEcosystem() {
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(.74, 3),
      new THREE.MeshStandardMaterial({ color: RED, emissive: RED, emissiveIntensity: .16, metalness: .26, roughness: .34, transparent: true, opacity: 0 })
    );
    core.castShadow = true;
    groups.ecosystem.add(core);
    groups.ecosystem.userData.core = core;

    const names = [
      ['Students', 'proof profile'],
      ['Universities', 'AI proof campus'],
      ['Government', 'solution pipeline'],
      ['Industry', 'pilot + internship'],
      ['Investors', 'proof-backed bets']
    ];

    names.forEach((n, i) => {
      const angle = (i / names.length) * Math.PI * 2 - Math.PI / 2;
      const radius = 3.35;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * 1.65;
      const z = Math.sin(angle + .4) * .85;
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(.25, 32, 16),
        new THREE.MeshStandardMaterial({ color: i % 2 ? 0xffffff : RED, metalness: .16, roughness: .42, transparent: true, opacity: 0 })
      );
      node.position.set(x, y, z);
      node.castShadow = true;
      groups.ecosystem.add(node);

      const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), node.position.clone()]);
      const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: RED, transparent: true, opacity: 0 }));
      groups.ecosystem.add(line);

      const label = makeTextPlane(n[0], n[1], 1.58, .68, { titleSize: 46, subtitleSize: 24 });
      label.position.set(x * 1.12, y * 1.12, z + .05);
      label.material.opacity = 0;
      groups.ecosystem.add(label);
      ecosystemLabels.push(label, node, line);
    });
  }

  function createPlatformTeaser() {
    const cards = [
      ['Proof Profile', 'verified work timeline'],
      ['Campus View', 'faculty-visible evidence'],
      ['Review Layer', 'rubrics + feedback'],
      ['Solution Pipeline', 'showcase-ready proofs'],
      ['Evidence Timeline', 'build → deploy → prove']
    ];
    cards.forEach((card, i) => {
      const panel = makePanelMesh(card[0], card[1]);
      const col = i % 3;
      const row = Math.floor(i / 3);
      panel.position.set((col - 1) * 2.3 + (row ? 1.15 : 0), 1.0 - row * 1.35, i * -.18);
      panel.rotation.set(-.06 + row * .06, -.18 + col * .18, .035 * (i - 2));
      groups.platform.add(panel);
      platformLabels.push(panel);
    });
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(6.1, 3.15, .08),
      new THREE.MeshBasicMaterial({ color: RED, wireframe: true, transparent: true, opacity: 0 })
    );
    frame.position.z = -.55;
    groups.platform.add(frame);
    groups.platform.userData.frame = frame;
  }

  function createFutureNetwork() {
    const pts = [];
    const sphereGeo = new THREE.SphereGeometry(.045, 12, 8);
    for (let i = 0; i < 74; i++) {
      const y = randomRange(-2.45, 2.4, i + 500);
      const width = 1.15 + 1.25 * (1 - Math.abs(y) / 2.6);
      let x = randomRange(-width, width, i + 800);
      if (y < -1.2) x += .48;
      if (y > 1.3) x -= .35;
      const z = randomRange(-.55, .55, i + 900);
      pts.push(new THREE.Vector3(x * 1.25, y, z));
      const dot = new THREE.Mesh(sphereGeo, new THREE.MeshStandardMaterial({ color: i % 5 ? RED : WHITE, emissive: i % 5 ? RED : 0xffffff, emissiveIntensity: .18, transparent: true, opacity: 0 }));
      dot.position.set(x * 1.25, y, z);
      groups.future.add(dot);
    }
    for (let i = 0; i < pts.length - 1; i += 2) {
      const a = pts[i];
      const b = pts[(i + 9) % pts.length];
      if (a.distanceTo(b) < 2.25) {
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([a, b]),
          new THREE.LineBasicMaterial({ color: RED, transparent: true, opacity: 0 })
        );
        groups.future.add(line);
      }
    }
    const label = makeTextPlane('India Proof Grid', 'campuses • problems • pilots • opportunity', 3.2, .72, { titleSize: 52, subtitleSize: 24, align: 'center' });
    label.position.set(0, -3.2, .1);
    label.material.opacity = 0;
    groups.future.add(label);
  }

  function createParticles() {
    const count = prefersReduced ? 120 : 320;
    const pos = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i*3] = randomRange(-9, 9, i + 700);
      pos[i*3+1] = randomRange(-5, 5, i + 710);
      pos[i*3+2] = randomRange(-8, 4, i + 720);
      sizes[i] = randomRange(.03, .09, i + 730);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: RED, size: .035, transparent: true, opacity: .18, depthWrite: false });
    const points = new THREE.Points(geo, mat);
    groups.particles.add(points);
  }

  function bindEvents() {
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('scroll', updateScrollTarget, { passive: true });
    window.addEventListener('pointermove', (e) => {
      state.mouseTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
      state.mouseTarget.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });

    document.querySelectorAll('.button, .topbar a').forEach(el => {
      el.addEventListener('pointerenter', () => {
        redRim.intensity = 4.2;
      });
      el.addEventListener('pointerleave', () => {
        redRim.intensity = 2.8;
      });
    });
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    updateScrollTarget();
  }

  function updateScrollTarget() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    state.targetScroll = clamp(window.scrollY / max, 0, 1);
    progressEl.style.setProperty('--scroll', state.targetScroll.toFixed(4));
  }

  function animate() {
    const now = performance.now();
    const dt = Math.min(0.035, (now - state.last) / 1000 || 0.016);
    state.last = now;
    state.time += dt;

    state.scroll += (state.targetScroll - state.scroll) * (prefersReduced ? 1 : 0.085);
    state.stage = state.scroll * 7;
    state.mouse.lerp(state.mouseTarget, 0.075);

    updateWorld(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  function updateWorld(dt) {
    const stage = state.stage;
    const t = state.time;
    const m = state.mouse;

    const camX = m.x * .18 + Math.sin(stage * .8) * .08;
    const camY = .15 + m.y * .12 + Math.cos(stage * .6) * .05;
    const camZ = 11.4 - Math.sin(Math.min(stage, 6.4) / 6.4 * Math.PI) * 1.15;
    camera.position.lerp(new THREE.Vector3(camX, camY, camZ), .045);
    camera.lookAt(m.x * .28, m.y * .18, 0);

    world.rotation.y = m.x * .045;
    world.rotation.x = -m.y * .03;

    updateLogo(stage, t, m);
    updateCertificates(stage, dt, t);
    updateCubes(stage, dt, t, m);
    updateProcess(stage, t);
    updateScale(stage, t);
    updateEcosystem(stage, t);
    updatePlatform(stage, t);
    updateFuture(stage, t);
    updateParticles(stage, t);
  }

  function updateLogo(stage, t, m) {
    const intro = 1 - smooth(0.55, 1.25, stage);
    const final = smooth(6.15, 7.0, stage);
    const visible = clamp(intro + final, 0, 1);
    setGroupOpacity(groups.logo, visible);

    const z = lerp(0.2, -1.9, smooth(0.35, 1.3, stage));
    const y = lerp(.25, 1.75, smooth(0.35, 1.3, stage)) - final * 1.7;
    const scale = lerp(1.15, .46, smooth(0.35, 1.25, stage)) + final * .35;
    groups.logo.position.lerp(new THREE.Vector3(0, y, z), .07);
    groups.logo.scale.lerp(new THREE.Vector3(scale, scale, scale), .06);
    groups.logo.rotation.y = Math.sin(t * .55) * .08 + m.x * .18 + final * Math.sin(t * .9) * .04;
    groups.logo.rotation.x = Math.cos(t * .46) * .05 - m.y * .12;
    groups.logo.rotation.z = Math.sin(t * .38) * .035;
  }

  function updateCertificates(stage, dt, t) {
    const appear = smooth(.58, 1.1, stage) * (1 - smooth(1.65, 2.25, stage));
    groups.certificates.position.x = lerp(0, -1.2, smooth(1.55, 2.1, stage));
    groups.certificates.rotation.y = lerp(0, .18, smooth(.7, 1.6, stage));
    certificateItems.forEach((card, i) => {
      card.material.opacity = appear * .86;
      if (appear > .02) {
        const seed = card.userData.seed;
        const fall = smooth(1.0, 1.72, stage);
        if (fall > .02 && !prefersReduced) {
          card.userData.velocity.y -= 3.2 * dt * fall;
          card.userData.velocity.x += Math.sin(t * 1.5 + seed) * .012 * fall;
          card.position.addScaledVector(card.userData.velocity, dt);
          const floor = -3.15 + Math.sin(seed) * .22;
          if (card.position.y < floor) {
            card.position.y = floor;
            card.userData.velocity.y *= -.48;
            card.userData.velocity.x *= .82;
            card.rotation.z += card.userData.velocity.x * .6;
          }
        } else {
          const base = card.userData.base;
          card.position.x = base.x + Math.sin(t * .55 + seed) * .07;
          card.position.y = base.y + Math.cos(t * .48 + seed) * .06;
        }
        card.rotation.x += dt * (.08 + i * .001) * appear;
        card.rotation.y += dt * (.05 + i * .001) * appear;
      }
    });
  }

  function updateCubes(stage, dt, t, m) {
    const show = smooth(1.42, 2.0, stage) * (1 - smooth(5.95, 6.55, stage));
    groups.cubes.rotation.y = t * .03 + m.x * .07;
    groups.cubes.rotation.x = Math.sin(t * .25) * .035;

    physicsItems.forEach((cube, i) => {
      const target = getCubeTarget(i, stage, t);
      const pos = cube.position;
      const velocity = cube.userData.velocity;
      const spring = prefersReduced ? 1 : 8.5;
      const damp = prefersReduced ? 0 : .82;
      velocity.x += (target.x - pos.x) * spring * dt;
      velocity.y += (target.y - pos.y) * spring * dt;
      velocity.z += (target.z - pos.z) * spring * dt;

      // magnetic cursor force, subtle and physical
      const dx = pos.x - m.x * 4.5;
      const dy = pos.y - m.y * 2.4;
      const d2 = dx * dx + dy * dy + 1.4;
      velocity.x += dx / d2 * .055;
      velocity.y += dy / d2 * .035;

      velocity.multiplyScalar(damp);
      if (prefersReduced) pos.copy(target); else pos.addScaledVector(velocity, dt * 60);
      cube.rotation.x += dt * (.45 + (i % 7) * .03) * show;
      cube.rotation.y += dt * (.3 + (i % 5) * .04) * show;
      const cubeVisible = show * (1 - smooth(6.25, 6.85, stage));
      cube.material.opacity = cubeVisible * (i % 6 === 0 ? .7 : .94);
    });
  }

  function getCubeTarget(i, stage, t) {
    const s = i / Math.max(1, physicsItems.length - 1);
    const seed = i * 4.91;

    const scattered = new THREE.Vector3(
      randomRange(-5.7, 5.7, i + 4),
      randomRange(-2.6, 2.8, i + 14),
      randomRange(-3, 2.2, i + 24)
    );

    const pipelineX = lerp(-4.6, 4.6, s);
    const pipeline = new THREE.Vector3(
      pipelineX,
      Math.sin(s * Math.PI * 4 + t * .45) * .65,
      Math.cos(s * Math.PI * 4 + t * .38) * .75
    );

    const angle = s * Math.PI * 2 * 3 + t * .2;
    const radius = 1.25 + (i % 7) * .16;
    const scaleOrb = new THREE.Vector3(Math.cos(angle) * (2.5 + radius), Math.sin(angle * .7) * 1.8, Math.sin(angle) * 1.05);

    const ringAngle = s * Math.PI * 2 + t * .18;
    const eco = new THREE.Vector3(Math.cos(ringAngle) * 3.1, Math.sin(ringAngle) * 1.55, Math.sin(ringAngle + seed) * .9);

    const platform = new THREE.Vector3(
      ((i % 11) - 5) * .42,
      (Math.floor(i / 11) % 8 - 3.5) * .35,
      -1.1 + Math.sin(seed) * .25
    );

    const final = new THREE.Vector3(
      Math.cos(ringAngle) * .78 + Math.sin(seed) * .08,
      Math.sin(ringAngle) * .78 + Math.cos(seed) * .08,
      Math.sin(seed + t) * .32
    );

    let target = scattered.clone();
    target.lerp(pipeline, smooth(1.58, 2.28, stage));
    target.lerp(scaleOrb, smooth(2.72, 3.42, stage));
    target.lerp(eco, smooth(3.68, 4.5, stage));
    target.lerp(platform, smooth(4.68, 5.4, stage));
    target.lerp(final, smooth(6.16, 6.88, stage));
    target.y += Math.sin(t * .95 + seed) * .035;
    return target;
  }

  function updateProcess(stage, t) {
    const show = smooth(1.82, 2.25, stage) * (1 - smooth(2.7, 3.1, stage));
    groups.process.position.set(0, -.18, 0);
    groups.process.rotation.y = Math.sin(t * .25) * .08;
    const tube = groups.process.userData.tube;
    if (tube) tube.material.opacity = show * .7;
    processLabels.forEach((item, i) => {
      if (item.isMesh && item.material) item.material.opacity = show * (i % 2 ? .95 : .9);
      if (i % 2 === 0) item.lookAt(camera.position);
      item.position.y += Math.sin(t * 1.2 + i) * .0008;
    });
  }

  function updateScale(stage, t) {
    const show = smooth(2.72, 3.18, stage) * (1 - smooth(3.75, 4.12, stage));
    groups.scale.position.set(0, 0, 0);
    groups.scale.rotation.y = Math.sin(t * .22) * .06;
    groups.scale.children.forEach((child, i) => {
      if (child.material) child.material.opacity = show * (i === 1 ? 1 : .92);
      if (child.geometry && child.geometry.type === 'PlaneGeometry') child.lookAt(camera.position);
    });
    if (groups.scale.userData.ring) {
      groups.scale.userData.ring.rotation.z += .003 + show * .002;
      groups.scale.userData.ring.material.opacity = show * .28;
    }
  }

  function updateEcosystem(stage, t) {
    const show = smooth(3.65, 4.15, stage) * (1 - smooth(4.72, 5.1, stage));
    groups.ecosystem.rotation.y = t * .07;
    groups.ecosystem.rotation.x = Math.sin(t * .2) * .05;
    const core = groups.ecosystem.userData.core;
    if (core) {
      core.material.opacity = show;
      core.scale.setScalar(1 + Math.sin(t * 1.6) * .035);
      core.rotation.x += .005;
      core.rotation.y += .007;
    }
    ecosystemLabels.forEach((item, i) => {
      if (item.material) item.material.opacity = show * (item.type === 'Line' ? .38 : .94);
      if (item.geometry && item.geometry.type === 'PlaneGeometry') item.lookAt(camera.position);
      if (item.isMesh && item.geometry && item.geometry.type === 'SphereGeometry') {
        item.position.y += Math.sin(t * 1.4 + i) * .001;
      }
    });
  }

  function updatePlatform(stage, t) {
    const show = smooth(4.62, 5.12, stage) * (1 - smooth(5.65, 6.0, stage));
    groups.platform.position.set(0, .05, .1);
    groups.platform.rotation.y = Math.sin(t * .22) * .1;
    groups.platform.rotation.x = -.08 + Math.cos(t * .2) * .03;
    platformLabels.forEach((p, i) => {
      setGroupOpacity(p, show);
      p.position.z += Math.sin(t * 1.1 + i) * .0013;
    });
    if (groups.platform.userData.frame) groups.platform.userData.frame.material.opacity = show * .16;
  }

  function updateFuture(stage, t) {
    const show = smooth(5.62, 6.12, stage) * (1 - smooth(6.62, 6.98, stage));
    groups.future.position.set(0, .1, 0);
    groups.future.rotation.y = Math.sin(t * .3) * .16;
    groups.future.rotation.z = -.08 + Math.sin(t * .18) * .04;
    groups.future.children.forEach((child, i) => {
      if (child.material) child.material.opacity = show * (child.type === 'Line' ? .22 : i % 5 ? .8 : .92);
      if (child.geometry && child.geometry.type === 'PlaneGeometry') child.lookAt(camera.position);
      if (child.isMesh && child.geometry && child.geometry.type === 'SphereGeometry') {
        const s = 1 + Math.sin(t * 2.1 + i) * .25 * show;
        child.scale.setScalar(s);
      }
    });
  }

  function updateParticles(stage, t) {
    const pts = groups.particles.children[0];
    if (!pts) return;
    pts.rotation.y = t * .018 + stage * .015;
    pts.rotation.x = Math.sin(t * .14) * .03;
    pts.material.opacity = .12 + .08 * Math.sin(stage * Math.PI);
  }

  function makeCardTexture({ title, line1, line2, accent }) {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 460;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width, canvas.height);
    roundRect(ctx, 16, 16, 688, 428, 34, '#ffffff', 'rgba(168,3,15,.18)');
    ctx.fillStyle = accent;
    ctx.fillRect(16, 16, 688, 48);
    ctx.fillStyle = '#171717';
    ctx.font = '900 48px Inter, Arial, sans-serif';
    ctx.fillText(title, 54, 150);
    ctx.fillStyle = '#777777';
    ctx.font = '700 32px Inter, Arial, sans-serif';
    ctx.fillText(line1, 54, 214);
    ctx.fillText(line2, 54, 264);
    ctx.strokeStyle = 'rgba(168,3,15,.18)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(578, 292, 54, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(168,3,15,.08)';
    ctx.fillRect(54, 338, 300, 18);
    ctx.fillRect(54, 374, 220, 18);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function makeTextPlane(title, subtitle, w, h, opts = {}) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width, canvas.height);
    roundRect(ctx, 18, 18, 988, 384, 52, 'rgba(255,255,255,.82)', 'rgba(168,3,15,.18)');
    const align = opts.align || 'left';
    ctx.textAlign = align;
    const x = align === 'center' ? canvas.width / 2 : 78;
    ctx.fillStyle = '#a8030f';
    ctx.font = `950 ${opts.titleSize || 56}px Inter, Arial, sans-serif`;
    ctx.fillText(title, x, 160);
    ctx.fillStyle = 'rgba(23,23,23,.68)';
    ctx.font = `800 ${opts.subtitleSize || 28}px Inter, Arial, sans-serif`;
    ctx.fillText(subtitle, x, 226);
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 1, depthWrite: false }));
    return mesh;
  }

  function makeBigNumberTexture(main, sub) {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 620;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a8030f';
    ctx.font = '950 220px Inter, Arial, sans-serif';
    ctx.fillText(main, 600, 315);
    ctx.fillStyle = 'rgba(23,23,23,.7)';
    ctx.font = '900 50px Inter, Arial, sans-serif';
    ctx.fillText(sub.toUpperCase(), 600, 410);
    ctx.strokeStyle = 'rgba(168,3,15,.18)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.roundRect?.(86, 82, 1028, 422, 64);
    if (!ctx.roundRect) roundRectPath(ctx, 86, 82, 1028, 422, 64);
    ctx.stroke();
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    if ('colorSpace' in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function makePanelMesh(title, subtitle) {
    const plane = makeTextPlane(title, subtitle, 2.05, .86, { titleSize: 46, subtitleSize: 25 });
    const glass = new THREE.Mesh(new THREE.BoxGeometry(2.08, .88, .035), materials.glass.clone());
    glass.castShadow = true;
    glass.receiveShadow = true;
    const group = new THREE.Group();
    glass.material.opacity = .36;
    plane.position.z = .026;
    group.add(glass, plane);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(glass.geometry),
      new THREE.LineBasicMaterial({ color: RED, transparent: true, opacity: .18 })
    );
    group.add(edges);
    return group;
  }

  function setGroupOpacity(group, opacity) {
    group.traverse(obj => {
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => setMaterialOpacity(m, opacity));
        else setMaterialOpacity(obj.material, opacity);
      }
    });
  }

  function setMaterialOpacity(mat, opacity) {
    mat.transparent = true;
    const base = mat.userData.baseOpacity ?? mat.opacity ?? 1;
    if (mat.userData.baseOpacity === undefined) mat.userData.baseOpacity = base;
    mat.opacity = clamp(opacity * base, 0, 1);
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    roundRectPath(ctx, x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 4; ctx.stroke(); }
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function randomRange(min, max, seed) {
    const x = Math.sin(seed * 999.137 + 12.9898) * 43758.5453;
    const f = x - Math.floor(x);
    return min + f * (max - min);
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(a, b, x) {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }
})();
