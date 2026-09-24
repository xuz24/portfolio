/* A slowly swirling 3D grain sphere, disturbed only by pointer movement. */
(() => {
  const canvas = document.querySelector('#sand');
  if (!canvas) return;
  const section = document.querySelector('#home');
  const intro = document.querySelector('.intro-content');
  const experience = document.querySelector('#experience');
  const firstSection = document.querySelector('#about-me') || experience;
  const scrollContent = [...document.querySelectorAll('.bio-content, .bio-photo, .experience-content, .experience-visual, .project-content, .project-visual')];
  const contentParents = [...new Set(scrollContent.map(item => item.parentElement))];
  const contentStyles = new WeakMap();
  const context = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = { x: 0, y: 0, previousX: 0, previousY: 0, active: false };
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const ease = n => n * n * (3 - 2 * n);
  let width = 0, height = 0, grains = [];
  let frame = 0, previousTime = 0, lastPaint = 0, elapsed = 0;
  let visible = true, scrollDirty = true, scrollProgress = 0;
  let targetScrollProgress = 0;
  let meshNodes = [], meshEdges = [];
  let visualScrollY = scrollY, lastScrollTime = -Infinity, lastTick = 0;
  const scrollEnergy = .35;
  const diffractionColors = Array.from({ length: 360 }, (_, hue) => `hsl(${hue}, 100%, 70%)`);

  function buildMesh() {
    const columns = width < 600 ? 14 : 20;
    const rings = width < 600 ? 8 : 11;
    meshNodes = [];
    meshEdges = [];
    const node = (latitude, longitude) => {
      meshNodes.push({ latitude, longitude, offsetX: 0, offsetY: 0, vx: 0, vy: 0,
        floatX: Math.random(), floatY: Math.random(), phase: Math.random() * Math.PI * 2 });
      return meshNodes.length - 1;
    };
    const edge = (a, b) => meshEdges.push({ a, b, broken: false, opacity: 1 });
    const north = node(0, 0);
    const rows = Array.from({ length: rings }, (_, row) =>
      Array.from({ length: columns }, (_, col) => node(
        Math.PI * (row + 1) / (rings + 1),
        (col + (row % 2) * .5) * Math.PI * 2 / columns
      ))
    );
    const south = node(Math.PI, 0);
    rows.forEach((row, r) => row.forEach((index, c) => {
      edge(index, row[(c + 1) % columns]);
      if (r === 0) edge(north, index);
      if (r === rings - 1) edge(index, south);
      else {
        edge(index, rows[r + 1][c]);
        edge(index, rows[r + 1][(c + (r % 2 ? 1 : -1) + columns) % columns]);
      }
    }));
  }

  function drawMesh(dt) {
    const presence = (1 - ease(clamp((scrollProgress - .3) / .7, 0, 1)))
      * ease(clamp((elapsed - 2) / 1.2, 0, 1));
    if (presence <= 0) return;
    const radius = Math.min(width * .43, height * .40, 365) * .97;
    const pushRadius = Math.min(90, width * .2) * .7;
    const sx = pointer.x - pointer.previousX, sy = pointer.y - pointer.previousY;
    const movement = sx * sx + sy * sy;
    const moving = pointer.active && movement > .25 && !reduced.matches;
    for (const node of meshNodes) {
      // Shared rotation preserves the closed triangular topology over time.
      const latitude = node.latitude;
      const longitude = node.longitude + elapsed * .14;
      const wave = 1 + Math.sin(latitude) * (
        .05 * Math.sin(longitude * 3 - elapsed * .85)
        + .025 * Math.sin(longitude * 5 - elapsed * .6));
      const x = Math.cos(longitude) * Math.sin(latitude) * wave;
      const y = Math.cos(latitude) * wave;
      const z = Math.sin(longitude) * Math.sin(latitude) * wave;
      const tiltedY = y * Math.cos(-.3) - z * Math.sin(-.3);
      const tiltedZ = y * Math.sin(-.3) + z * Math.cos(-.3);
      const perspective = 3.8 / (3.8 - tiltedZ);
      const homeX = width / 2 + x * radius * perspective;
      const homeY = height / 2 + tiltedY * radius * perspective;
      if (dt > 0) {
        node.vx -= node.offsetX * 2.5 * dt;
        node.vy -= node.offsetY * 2.5 * dt;
        if (moving) {
          const along = clamp(((homeX + node.offsetX - pointer.previousX) * sx
            + (homeY + node.offsetY - pointer.previousY) * sy) / movement, 0, 1);
          const dx = homeX + node.offsetX - pointer.previousX - sx * along;
          const dy = homeY + node.offsetY - pointer.previousY - sy * along;
          const distance = Math.hypot(dx, dy);
          if (distance < pushRadius) {
            const force = (1 - distance / pushRadius) ** 2 * Math.min(Math.sqrt(movement), 75) * 11;
            node.vx += dx / Math.max(distance, 1) * force;
            node.vy += dy / Math.max(distance, 1) * force;
          }
        }
        node.vx *= Math.exp(-5 * dt);
        node.vy *= Math.exp(-5 * dt);
        node.offsetX += node.vx * dt;
        node.offsetY += node.vy * dt;
      }
      node.homeX = homeX;
      node.homeY = homeY;
      // Follow the grains' outward sweep into scattered background positions.
      // Keep home coordinates on the sphere to measure the resulting strain.
      const floatX = node.floatX * width + Math.sin(elapsed * .18 + node.phase) * 24;
      const floatY = node.floatY * height + Math.cos(elapsed * .14 + node.longitude) * 20;
      const scatter = Math.sin(scrollProgress * Math.PI) * .3;
      node.x = homeX + (floatX - homeX) * scrollProgress
        + (homeX - width / 2) * scatter + node.offsetX;
      node.y = homeY + (floatY - homeY) * scrollProgress
        + (homeY - height / 2) * scatter + node.offsetY;
      node.depth = clamp((tiltedZ + 1) / 2, 0, 1);
    }
    context.strokeStyle = '#bddcff';
    context.lineWidth = .85;
    for (const edge of meshEdges) {
      const { a, b } = edge;
      const start = meshNodes[a], end = meshNodes[b];
      // Compare with the current undisturbed projection so rotation and waves
      // don't tear the mesh. A small floor protects foreshortened edge lengths.
      const restLength = Math.hypot(start.homeX - end.homeX, start.homeY - end.homeY);
      const length = Math.hypot(start.x - end.x, start.y - end.y);
      const stretch = (length - restLength) / Math.max(restLength, 12);
      if (!edge.broken && stretch > .65) edge.broken = true;
      else if (edge.broken && stretch < .2) edge.broken = false;
      // Separate break/rejoin thresholds prevent flickering near the limit.
      if (edge.broken) { edge.opacity = 0; continue; }
      edge.opacity += (1 - edge.opacity) * (reduced.matches ? 1 : 1 - Math.exp(-dt * 8));
      const depth = (start.depth + end.depth) / 2;
      context.globalAlpha = presence * edge.opacity * (.025 + depth * depth * .29);
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }
  }

  // A sparse, independent star field stays behind the blue particle shapes.
  const goldStars = Array.from({ length: 60 }, () => ({
    x: Math.random(), y: Math.random(),
    size: .45 + Math.random() * .55,
    phase: Math.random() * Math.PI * 2,
    rate: .35 + Math.random() * .35
  }));
  const goldGlow = document.createElement('canvas');
  goldGlow.width = goldGlow.height = 32;
  const goldBrush = goldGlow.getContext('2d');
  const goldGradient = goldBrush.createRadialGradient(16, 16, 0, 16, 16, 16);
  goldGradient.addColorStop(0, 'rgba(255, 222, 145, .65)');
  goldGradient.addColorStop(.15, 'rgba(244, 193, 91, .22)');
  goldGradient.addColorStop(.5, 'rgba(225, 165, 62, .045)');
  goldGradient.addColorStop(1, 'rgba(225, 165, 62, 0)');
  goldBrush.fillStyle = goldGradient;
  goldBrush.fillRect(0, 0, 32, 32);

  function drawGoldStars() {
    const count = Math.min(60, Math.max(18, Math.round(width * height / 24000)));
    for (let i = 0; i < count; i++) {
      const star = goldStars[i];
      const shimmer = .5 + .5 * Math.sin(elapsed * star.rate + star.phase);
      const alpha = .18 + .3 * shimmer * shimmer;
      const x = star.x * width, y = star.y * height;
      const halo = star.size * 12;
      context.globalAlpha = alpha;
      context.drawImage(goldGlow, x - halo / 2, y - halo / 2, halo, halo);
      context.fillStyle = '#f4d58b';
      context.beginPath();
      context.arc(x, y, star.size, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
  }

  // Precompute subtle blue variants and speed ramps to avoid building colors
  // for every particle on every frame. Faster grains shift toward clear cyan.
  const palettes = Array.from({ length: 5 }, (_, variant) =>
    Array.from({ length: 48 }, (_, step) => {
      const energy = step / 47;
      const hue = 218 + variant * 4 - energy * (24 + variant * 2);
      const saturation = 62 + variant * 3 + energy * 17;
      const lightness = 57 + variant * 2 + energy * 12;
      return `hsl(${hue.toFixed(1)}, ${saturation.toFixed(1)}%, ${lightness.toFixed(1)}%)`;
    })
  );

  // Cache small glow sprites once; avoid thousands of live shadow blurs.
  const glowSprites = palettes.map(palette => Array.from({ length: 12 }, (_, step) => {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 32;
    const brush = sprite.getContext('2d');
    const color = palette[Math.round(step / 11 * 47)];
    const translucent = alpha => color.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
    const glow = brush.createRadialGradient(16, 16, 0, 16, 16, 16);
    glow.addColorStop(0, translucent(.8));
    glow.addColorStop(.12, translucent(.45));
    glow.addColorStop(.35, translucent(.12));
    glow.addColorStop(.7, translucent(.025));
    glow.addColorStop(1, translucent(0));
    brush.fillStyle = glow;
    brush.fillRect(0, 0, 32, 32);
    return sprite;
  }));

  function resize() {
    if (!context) return;
    const scale = Math.min(devicePixelRatio || 1, 1.5);
    // ResizeObserver also fires immediately after observing the intro, and
    // again when fonts settle. Avoid rebuilding the same particle field.
    if (width === innerWidth && height === innerHeight
      && canvas.width === Math.round(width * scale)
      && canvas.height === Math.round(height * scale) && grains.length) return;
    width = innerWidth;
    height = innerHeight;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    // Fibonacci sampling fills a spherical shell evenly, with a little depth.
    const count = Math.round((width < 600 ? 9500 : 16500) * .85);
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    if (grains.length !== count) grains = Array.from({ length: count }, (_, i) => {
      const latitude = Math.acos(1 - 2 * (i + .5) / count);
      const phase = Math.random() * Math.PI * 2;
      const grain = { latitude, longitude: i * goldenAngle,
        longitudeCos: Math.cos(i * goldenAngle), longitudeSin: Math.sin(i * goldenAngle),
        arrivalDelay: phase / (Math.PI * 2) * .4,
        arrivalDuration: 2.3 + phase / (Math.PI * 2) * .4,
        phaseCos: Math.cos(phase), phaseSin: Math.sin(phase),
        rotationRate: .11 + .055 * Math.sin(latitude * 3),
        variant: Math.min(4, Math.floor(phase / (Math.PI * 2) * 5)),
        radius: .87 + Math.random() * .13, phase,
        entranceLead: i % 2 === 0,
        floatX: Math.random(), floatY: Math.random(),
        speed: 0, lastX: null, lastY: null,
        size: .55 + Math.random() * .8, offsetX: 0, offsetY: 0, vx: 0, vy: 0 };
      return grain;
    });
    buildMesh();
    if (reduced.matches) elapsed = Math.max(elapsed, 3.2);
    scrollDirty = true;
    scrollMotion();
    // Let the browser paint the page before the first animated canvas frame.
    // Reduced motion already draws its still frame in scrollMotion().
    requestTick();
  }

  function drawSand(dt, scrolling = false) {
    if (!context) return;
    context.clearRect(0, 0, width, height);
    drawGoldStars();
    const sphereRadius = Math.min(width * .43, height * .40, 365);
    const interactionRadius = Math.min(90, width * .2) * .7;
    const radiusSquared = interactionRadius * interactionRadius;
    const segmentX = pointer.x - pointer.previousX;
    const segmentY = pointer.y - pointer.previousY;
    const segmentLength = segmentX * segmentX + segmentY * segmentY;
    // Repulsion consumes actual movement once; a stationary cursor has no force.
    const moving = pointer.active && segmentLength > .25 && !reduced.matches;
    const impulse = Math.min(Math.sqrt(segmentLength), 75) * 11;
    const damping = Math.exp(-5 * dt);
    const speedBlend = 1 - Math.exp(-dt * 9);
    const scatter = Math.sin(scrollProgress * Math.PI) * .3;
    const driftTime = elapsed;
    const latitudeSin = Math.sin(driftTime * .3), latitudeCos = Math.cos(driftTime * .3);
    const floatSin = Math.sin(driftTime * .18), floatCos = Math.cos(driftTime * .18);
    const driftSin = Math.sin(driftTime * .14), driftCos = Math.cos(driftTime * .14);
    const tilt = -.3;
    const cosTilt = Math.cos(tilt), sinTilt = Math.sin(tilt);
    const experienceWeight = scrollProgress;
    const particleVisibility = 1 - scrollProgress * .8;
    const entering = elapsed < 3.2 && !reduced.matches;
    // Arrival and cursor movement must not change speed-based colors on load.
    const fixedEnergy = scrolling || entering;
    const arcScale = Math.min(width, height) * .1;
    context.globalCompositeOperation = 'lighter';
    for (const grain of grains) {
      const arrival = entering ? clamp((elapsed - grain.arrivalDelay) / grain.arrivalDuration, 0, 1) : 1;
      const entranceVisibility = grain.entranceLead ? 1 : ease(clamp((arrival - .65) / .35, 0, 1));
      const visibleGrain = particleVisibility * Math.max(entranceVisibility, scrollProgress);
      // Half the grains are hidden early in the entrance. Skip their geometry,
      // physics, color, and drawing work until they actually become visible.
      if (visibleGrain === 0) continue;
      const latitude = grain.latitude + (latitudeSin * grain.phaseCos + latitudeCos * grain.phaseSin) * .015;
      // Keep the base rotation rate constant; using the animated latitude here
      // would amplify its oscillation as elapsed time grows.
      const longitude = grain.longitude + driftTime * grain.rotationRate
        + Math.sin(latitude * 5 + driftTime * .18) * .16;
      // Traveling waves circle the rotation axis; latitude only tapers them
      // smoothly at the poles, with no top-to-bottom phase movement.
      const sinLatitude = Math.sin(latitude);
      const wave = 1 + sinLatitude * (
        .05 * Math.sin(longitude * 3 - driftTime * .85)
        + .025 * Math.sin(longitude * 5 - driftTime * .6)
      );
      const radius = grain.radius * wave;
      const ring = sinLatitude * radius;
      const worldX = Math.cos(longitude) * ring;
      const worldY = Math.cos(latitude) * radius;
      const worldZ = Math.sin(longitude) * ring;
      const rotatedY = worldY * cosTilt - worldZ * sinTilt;
      const rotatedZ = worldY * sinTilt + worldZ * cosTilt;
      const perspective = 3.8 / (3.8 - rotatedZ);
      const sphereX = width / 2 + worldX * sphereRadius * perspective;
      const sphereY = height / 2 + rotatedY * sphereRadius * perspective;
      // A staggered arrival from across the viewport, played only on initial load.
      let homeX = sphereX, homeY = sphereY;
      if (arrival < 1) {
        const gather = arrival * arrival * arrival * (arrival * (arrival * 6 - 15) + 10);
        const startX = grain.floatX * width, startY = grain.floatY * height;
        const arc = Math.sin(arrival * Math.PI) * (1 - arrival) * arcScale;
        homeX = startX + (sphereX - startX) * gather + grain.phaseCos * arc;
        homeY = startY + (sphereY - startY) * gather + grain.phaseSin * arc;
      }
      if (scrollProgress > 0) {
        const floatX = grain.floatX * width + (floatSin * grain.phaseCos + floatCos * grain.phaseSin) * 24;
        const floatY = grain.floatY * height + (driftCos * grain.longitudeCos - driftSin * grain.longitudeSin) * 20;
        homeX += (floatX - homeX) * scrollProgress + (homeX - width / 2) * scatter;
        homeY += (floatY - homeY) * scrollProgress + (homeY - height / 2) * scatter;
      }
      if (dt > 0 && (moving || grain.offsetX || grain.offsetY || grain.vx || grain.vy)) {
        grain.vx -= grain.offsetX * 2.5 * dt;
        grain.vy -= grain.offsetY * 2.5 * dt;
        if (moving) {
          const screenX = homeX + grain.offsetX, screenY = homeY + grain.offsetY;
          const along = clamp(((screenX - pointer.previousX) * segmentX +
            (screenY - pointer.previousY) * segmentY) / segmentLength, 0, 1);
          let dx = screenX - (pointer.previousX + segmentX * along);
          let dy = screenY - (pointer.previousY + segmentY * along);
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared < radiusSquared) {
            const distance = Math.sqrt(distanceSquared);
            if (distance < .01) { dx = Math.cos(grain.phase); dy = Math.sin(grain.phase); }
            const force = (1 - distance / interactionRadius) ** 2 * impulse;
            grain.vx += dx / Math.max(distance, 1) * force;
            grain.vy += dy / Math.max(distance, 1) * force;
          }
        }
        grain.vx *= damping;
        grain.vy *= damping;
        grain.offsetX += grain.vx * dt;
        grain.offsetY += grain.vy * dt;
      }
      const screenX = homeX + grain.offsetX, screenY = homeY + grain.offsetY;
      if (fixedEnergy) {
        grain.speed = scrollEnergy * 130;
      } else if (dt > 0 && grain.lastX !== null) {
        // Include both the sphere's rotation and the cursor's disturbance.
        const speed = Math.hypot(screenX - grain.lastX, screenY - grain.lastY) / dt;
        grain.speed += (speed - grain.speed) * speedBlend;
      }
      grain.lastX = screenX;
      grain.lastY = screenY;
      if (screenX < -32 || screenX > width + 32 || screenY < -32 || screenY > height + 32) continue;
      const energy = fixedEnergy ? scrollEnergy : clamp(grain.speed / 130, 0, 1);
      const variant = grain.variant;
      context.fillStyle = palettes[variant][Math.round(energy * 47)];
      // Near grains shine more strongly; distant grains recede into the blue.
      const depth = clamp((rotatedZ + 1) / 2, 0, 1);
      const size = grain.size * perspective;
      const shimmer = .85 + .15 * Math.sin(driftTime * 1.1 + longitude * 2 + latitude * 3);
      const glowSize = size * (9 + energy * 9);
      context.globalAlpha = (.2 + depth * .35 + energy * .35) * shimmer * .50 * visibleGrain * (1 - experienceWeight * .65);
      context.drawImage(glowSprites[variant][Math.round(energy * 11)],
        screenX + size / 2 - glowSize / 2, screenY + size / 2 - glowSize / 2, glowSize, glowSize);
      context.globalAlpha = (.26 + depth * .5 + energy * .2) * visibleGrain;
      context.fillRect(screenX, screenY, size, size);

      // A subtle diffraction fringe gives the brightest grains a prismatic edge.
      // Its phase follows the sphere's rotation, so the color glints travel
      // around the surface instead of staying painted in place.
      const diffraction = .5 + .5 * Math.sin(longitude * 7 + rotatedZ * 5 - elapsed * .45);
      // Diffraction belongs to the silhouette: it appears where the sphere
      // turns away from the viewer, rather than washing over its center.
      const edgeBand = clamp(1 - Math.abs(rotatedZ) / .62, 0, 1);
      const diffractionStrength = edgeBand * diffraction * diffraction
        * (0.42 + depth * .45 + energy * .45) * 2;
      if (diffractionStrength > .035) {
        const diffractionHue = (diffraction * 360 + 20) % 360;
        context.fillStyle = diffractionColors[Math.floor(diffractionHue)];
        context.globalAlpha *= Math.min(1, diffractionStrength);
        const fringe = Math.max(.8, size * (.7 + diffraction * .55));
        context.fillRect(screenX + fringe * 1.05, screenY - fringe * .55, fringe, fringe);
      }
    }
    drawMesh(dt);
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
    pointer.previousX = pointer.x;
    pointer.previousY = pointer.y;
  }

  function scrollMotion() {
    scrollDirty = false;
    // Read section geometry together before changing any styles. Images and
    // copy in the same experience share a single layout read.
    const rects = new Map();
    const scrollOffset = scrollY - visualScrollY;
    for (const parent of contentParents) {
      const rect = parent.getBoundingClientRect();
      rects.set(parent, { top: rect.top + scrollOffset, height: rect.height });
    }
    // Disperse while Experience enters, so the sphere is already gone when
    // the research entries become the focus of the viewport.
    const experienceTop = (firstSection || section).getBoundingClientRect()[firstSection ? 'top' : 'bottom'] + scrollOffset;
    // Hold the sphere through the first third of the scroll, then disperse
    // the grains and mesh together as About Me reaches the viewport.
    targetScrollProgress = ease(clamp((height * .65 - experienceTop) / (height * .65), 0, 1));
    // Dispersal follows the existing scroll timing. Reassembly catches up
    // gradually, even after the browser has finished scrolling to Home.
    if (reduced.matches || targetScrollProgress >= scrollProgress) {
      scrollProgress = targetScrollProgress;
    }
    if (reduced.matches) { drawSand(0); return; }
    const viewport = innerHeight;
    const progress = clamp(visualScrollY / height, 0, 1);
    intro.style.transform = `translate3d(0, ${-progress * 60}px, 0)`;
    intro.style.opacity = 1 - progress;
    for (const item of scrollContent) {
      const rect = rects.get(item.parentElement);
      const distance = (rect.top + rect.height / 2 - viewport / 2) / viewport;
      const transform = `translate3d(0, ${clamp(distance * 70, -65, 65).toFixed(2)}px, 0)`;
      const opacity = clamp((viewport - rect.top) / (viewport * .48), 0, 1).toFixed(3);
      const previous = contentStyles.get(item);
      if (previous?.transform !== transform) item.style.transform = transform;
      if (previous?.opacity !== opacity) item.style.opacity = opacity;
      contentStyles.set(item, { transform, opacity });
    }
  }

  function requestTick() {
    if (!frame && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function tick(now) {
    frame = 0;
    if (document.hidden) return;
    const frameDt = lastTick ? Math.min((now - lastTick) / 1000, .1) : 1 / 60;
    lastTick = now;
    const distance = scrollY - visualScrollY;
    const settling = Math.abs(distance) > .25;
    if (reduced.matches || !settling) visualScrollY = scrollY;
    else {
      const introTransition = Math.min(scrollY, visualScrollY) < height;
      visualScrollY += distance * (1 - Math.exp(-frameDt * (introTransition ? 6 : 14)));
    }
    if (scrollDirty || settling) scrollMotion();
    const reassembling = scrollProgress - targetScrollProgress > .0005;
    const scrolling = settling || reassembling || now - lastScrollTime < 180;
    if (reduced.matches || !visible) { previousTime = 0; return; }
    // Follow the browser's snap animation at up to 60 fps; idle rendering
    // keeps its lower cadence. Color energy stays fixed through settling.
    if (now - lastPaint >= (scrolling ? 15 : scrollProgress === 1 ? 50 : 30)) {
      const dt = previousTime ? Math.min((now - previousTime) / 1000, .05) : 1 / 30;
      previousTime = lastPaint = now;
      elapsed += dt;
      if (reassembling) {
        scrollProgress += (targetScrollProgress - scrollProgress) * (1 - Math.exp(-dt * 2.8));
      } else scrollProgress = targetScrollProgress;
      drawSand(dt, scrolling);
    }
    requestTick();
  }

  section.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || reduced.matches) return;
    const rect = section.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    if (!pointer.active) { pointer.previousX = x; pointer.previousY = y; }
    pointer.x = x; pointer.y = y; pointer.active = true;
  }, { passive: true });
  section.addEventListener('pointerleave', () => { pointer.active = false; });
  section.addEventListener('pointercancel', () => { pointer.active = false; });
  addEventListener('scroll', () => {
    pointer.active = false;
    lastScrollTime = performance.now();
    scrollDirty = true;
    requestTick();
  }, { passive: true });
  const stage = document.querySelector('#main');
  if (stage) new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    previousTime = 0;
    if (!visible) pointer.active = false;
    requestTick();
  }).observe(stage);
  new ResizeObserver(resize).observe(section);
  if (experience) new ResizeObserver(() => { scrollDirty = true; requestTick(); }).observe(experience);
  addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    previousTime = 0;
    lastTick = 0;
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; pointer.active = false; }
    else requestTick();
  });
  reduced.addEventListener('change', () => {
    pointer.active = false;
    previousTime = 0;
    if (reduced.matches) {
      elapsed = Math.max(elapsed, 3.2);
      drawSand(0);
      [intro, ...scrollContent].forEach(item => {
        item.style.transform = ''; item.style.opacity = ''; contentStyles.delete(item);
      });
    }
    scrollDirty = true;
    requestTick();
  });
  resize();
})();
