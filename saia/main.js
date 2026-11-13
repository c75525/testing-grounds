import * as THREE from 'https://unpkg.com/three@0.181.1/build/three.module.js';
import { SVGLoader } from 'https://unpkg.com/three@0.181.1/examples/jsm/loaders/SVGLoader.js';
const canvas = document.querySelector('#logo-canvas');
const wordmarkCanvas = document.querySelector('#wordmark-logo-canvas');
const wordmark = document.querySelector('.wordmark');
const wordmarkText = wordmark.querySelector('h1');
const fallback = document.querySelector('#fallback');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileViewport = window.matchMedia('(max-width: 640px)');
const rotationSpeed = 0.06;
let isPlaying = !reduceMotion.matches;
// Session storage survives page navigation/reloads without suppressing future visits forever.
const entranceKey = 'saia-logo-entrance-played';
let skipEntrance = false;
try { skipEntrance = sessionStorage.getItem(entranceKey) === '1'; } catch { /* Storage may be disabled. */ }

try {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const wordmarkRenderer = new THREE.WebGLRenderer({ canvas: wordmarkCanvas, antialias: true, alpha: true });
  wordmarkRenderer.setPixelRatio(1);
  wordmarkRenderer.outputColorSpace = THREE.SRGBColorSpace;
  wordmarkRenderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.background = null;
  // Maximum prototype perspective: 70° FOV, moved closer to retain the composition.
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 100);
  camera.position.set(0, 0, 8.29);

  // Fixed −45° yaw; screen-right stays nearer while the mark spins locally.
  const yawGroup = new THREE.Group();
  yawGroup.rotation.y = THREE.MathUtils.degToRad(-45);
  // Desktop anchor; mobile is moved lower in resize() to clear the subtitle fill.
  yawGroup.position.y = -0.72;
  scene.add(yawGroup);

  // The arrows spin counterclockwise; the four center cylinders remain fixed.
  const spinGroup = new THREE.Group();
  const centerGroup = new THREE.Group();
  yawGroup.add(spinGroup, centerGroup);

  const baseMaterials = [
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
    new THREE.MeshBasicMaterial({ color: 0xe1dee8 }),
  ];
  const wordmarkMaterials = [
    new THREE.MeshBasicMaterial({ color: 0x4d4d4d }),
    new THREE.MeshBasicMaterial({ color: 0x3e3e3e }),
  ];
  const baseColors = baseMaterials.map(material => material.color.clone());
  const wordmarkColors = wordmarkMaterials.map(material => material.color.clone());
  const canvasColor = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim() || '#848484');
  const headingColor = new THREE.Color(0xffffff);
  const meshes = [];
  const outlines = [];
  const depthOutlines = [];
  const allOutlines = [];
  // Wireframe strokes are an overlay, not coplanar depth-tested surfaces.
  const outlineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, depthTest: false, depthWrite: false });
  const maskedOutlineMaterial = new THREE.LineBasicMaterial({ color: 0x4d4d4d, transparent: true, depthTest: false, depthWrite: false });
  let entranceStarted = null;
  let entranceFinished = false;
  const traceDuration = 1.5;
  const edgeDuration = 4.5;
  const fillDuration = 1.5;
  const ease = t => t * t * (3 - 2 * t);
  const unit = t => Math.max(0, Math.min(1, t));

  const loader = new SVGLoader();
  loader.load('./saia-logo.svg', (data) => {
    for (const path of data.paths) {
      if (Number(path.userData?.style?.opacity ?? 1) < 1) continue;
      for (const shape of SVGLoader.createShapes(path)) {
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: 105,
          bevelEnabled: false,
          curveSegments: 96,
        });
        const mesh = new THREE.Mesh(geometry, baseMaterials);
        meshes.push(mesh);
        // The source's four center circles are much smaller than the arrow form.
        geometry.computeBoundingBox();
        const size = geometry.boundingBox.getSize(new THREE.Vector3());
        const isCenterCylinder = Math.max(size.x, size.y) < 100;
        const group = isCenterCylinder ? centerGroup : spinGroup;
        group.add(mesh);
        // Trace only SVG contours, never triangulation edges across the face.
        for (const contour of [shape, ...shape.holes]) {
          const points = contour.getSpacedPoints(320);
          points.push(points[0].clone());
          const lineGeometry = new THREE.BufferGeometry().setFromPoints(
            points.map(point => new THREE.Vector3(point.x, point.y, 0))
          );
          lineGeometry.setDrawRange(0, 0);
          const line = new THREE.Line(lineGeometry, outlineMaterial);
          outlines.push(line);
          group.add(line);
        }
        mesh.visible = false;
      }
    }

    // SVG space has its origin at top-left; center and scale the assembled mark.
    const bounds = new THREE.Box3();
    for (const mesh of meshes) {
      mesh.geometry.computeBoundingBox();
      bounds.union(mesh.geometry.boundingBox);
    }
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 14.25 / (bounds.max.x - bounds.min.x);
    for (const mesh of meshes) {
      mesh.geometry.translate(-center.x, -center.y, -center.z);
      mesh.geometry.rotateX(Math.PI);
      mesh.geometry.scale(scale, scale, scale);
      mesh.geometry.computeBoundingBox();
      // Keep only longitudinal sharp edges, excluding face triangulation.
      const edges = new THREE.EdgesGeometry(mesh.geometry, 25);
      const positions = edges.attributes.position;
      const segments = [];
      for (let i = 0; i < positions.count; i += 2) {
        const a = new THREE.Vector3().fromBufferAttribute(positions, i);
        const b = new THREE.Vector3().fromBufferAttribute(positions, i + 1);
        if (Math.abs(a.z - b.z) < .01) continue;
        // Subdivide so the connecting stroke draws rather than appearing at once.
        for (let step = 0; step < 32; step += 1) {
          segments.push(a.clone().lerp(b, step / 32), a.clone().lerp(b, (step + 1) / 32));
        }
      }
      edges.dispose();
      if (segments.length) {
        const geometry = new THREE.BufferGeometry().setFromPoints(segments);
        geometry.setDrawRange(0, 0);
        const ribs = new THREE.LineSegments(geometry, outlineMaterial);
        ribs.renderOrder = 2;
        mesh.parent.add(ribs);
        depthOutlines.push(ribs);
      }
    }
    for (const line of outlines) {
      line.geometry.translate(-center.x, -center.y, -center.z);
      line.geometry.rotateX(Math.PI);
      line.geometry.scale(scale, scale, scale);
      line.renderOrder = 2;
      const rear = new THREE.Line(line.geometry.clone(), outlineMaterial);
      rear.geometry.translate(0, 0, -105 * scale);
      rear.geometry.setDrawRange(0, 0);
      rear.renderOrder = 2;
      line.parent.add(rear);
      depthOutlines.push(rear);
    }
    allOutlines.push(...outlines, ...depthOutlines);
    // Fade color, not transparency: opaque depth testing stays identical from
    // the first fill frame through completion, including overlapping surfaces.
    for (const material of baseMaterials) material.color.copy(canvasColor);
    for (const material of wordmarkMaterials) material.color.copy(headingColor);
    entranceStarted = performance.now();
    try { sessionStorage.setItem(entranceKey, '1'); } catch { /* Keep rendering if storage is unavailable. */ }
  }, undefined, (error) => {
    console.error('Unable to load the SVG.', error);
    fallback.hidden = false;
  });

  const updateWordmarkMask = (sceneRect) => {
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    const mask = document.createElement('canvas');
    mask.width = Math.ceil(sceneRect.width * pixelRatio);
    mask.height = Math.ceil(sceneRect.height * pixelRatio);
    const context = mask.getContext('2d');
    context.scale(pixelRatio, pixelRatio);
    context.fillStyle = '#fff';
    context.textBaseline = 'alphabetic';

    const textRect = wordmarkText.getBoundingClientRect();
    const style = getComputedStyle(wordmarkText);
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    context.letterSpacing = style.letterSpacing;
    const metrics = context.measureText(wordmarkText.textContent);
    const lineHeight = Number.parseFloat(style.lineHeight);
    const baseline = textRect.top - sceneRect.top
      + (lineHeight - metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2
      + metrics.actualBoundingBoxAscent;
    context.fillText(wordmarkText.textContent, textRect.left - sceneRect.left, baseline);
    const maskUrl = `url("${mask.toDataURL('image/png')}")`;
    wordmarkCanvas.style.webkitMaskImage = maskUrl;
    wordmarkCanvas.style.maskImage = maskUrl;
  };

  const resize = () => {
    const sceneRect = canvas.getBoundingClientRect();
    const wordmarkRect = wordmark.getBoundingClientRect();
    const { width, height } = sceneRect;
    renderer.setSize(width, height, false);
    wordmarkRenderer.setSize(width, height, false);
    wordmarkCanvas.style.width = `${width}px`;
    wordmarkCanvas.style.height = `${height}px`;
    wordmarkCanvas.style.left = `${sceneRect.left - wordmarkRect.left}px`;
    wordmarkCanvas.style.top = `${sceneRect.top - wordmarkRect.top}px`;
    updateWordmarkMask(sceneRect);
    // This render is visible only inside the heading glyphs, not the full canvas.
    const textRect = wordmarkText.getBoundingClientRect();
    const x = Math.max(0, Math.floor(textRect.left - sceneRect.left - 2));
    const y = Math.max(0, Math.floor(sceneRect.bottom - textRect.bottom - 2));
    wordmarkRenderer.setScissor(x, y,
      Math.max(0, Math.min(width - x, Math.ceil(textRect.width + 4))),
      Math.max(0, Math.min(height - y, Math.ceil(textRect.height + 4))));
    wordmarkRenderer.setScissorTest(true);
    camera.aspect = width / height;
    yawGroup.position.y = mobileViewport.matches ? -1.05 : -0.72;
    camera.position.y = 0;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  new ResizeObserver(resize).observe(wordmark);
  resize();
  document.fonts.ready.then(resize);
  addEventListener('saia:layout-fit', resize);

  reduceMotion.addEventListener('change', (event) => {
    isPlaying = !event.matches;
  });

  const clock = new THREE.Clock();
  const render = () => {
    const delta = Math.min(clock.getDelta(), 0.05);
    if (entranceStarted !== null && !entranceFinished) {
      const elapsed = (performance.now() - entranceStarted) / 1000;
      const immediate = skipEntrance || reduceMotion.matches;
      const trace = immediate ? 1 : unit(elapsed / traceDuration);
      const edgeTrace = immediate ? 1 : unit((elapsed - traceDuration) / edgeDuration);
      const fill = immediate ? 1 : unit((elapsed - traceDuration - edgeDuration) / fillDuration);
      for (const line of outlines) {
        line.geometry.setDrawRange(0, Math.floor(trace * line.geometry.attributes.position.count));
        line.visible = fill < 1;
      }
      for (const line of depthOutlines) {
        const count = Math.floor(edgeTrace * line.geometry.attributes.position.count);
        line.geometry.setDrawRange(0, line.isLineSegments ? count - count % 2 : count);
        line.visible = fill < 1;
      }
      const opacity = ease(fill);
      outlineMaterial.opacity = maskedOutlineMaterial.opacity = 1 - opacity;
      for (const mesh of meshes) mesh.visible = fill > 0;
      baseMaterials.forEach((material, index) => material.color.lerpColors(canvasColor, baseColors[index], opacity));
      wordmarkMaterials.forEach((material, index) => material.color.lerpColors(headingColor, wordmarkColors[index], opacity));
      if (fill === 1) {
        entranceFinished = true;
        // Remove entrance-only geometry from idle scene traversal and GPU memory.
        for (const line of allOutlines) {
          line.removeFromParent();
          line.geometry.dispose();
        }
        outlines.length = depthOutlines.length = allOutlines.length = 0;
        outlineMaterial.dispose();
        maskedOutlineMaterial.dispose();
        canvas.dataset.entrance = 'complete';
      } else canvas.dataset.entrance = fill > 0 ? 'fill' : edgeTrace > 0 ? 'edges' : 'trace';
    }
    if (entranceStarted !== null && isPlaying) spinGroup.rotation.z += rotationSpeed * delta;
    renderer.render(scene, camera);
    for (const mesh of meshes) mesh.material = wordmarkMaterials;
    for (const line of allOutlines) line.material = maskedOutlineMaterial;
    wordmarkRenderer.render(scene, camera);
    for (const mesh of meshes) mesh.material = baseMaterials;
    for (const line of allOutlines) line.material = outlineMaterial;
    requestAnimationFrame(render);
  };
  render();
} catch (error) {
  console.error(error);
  fallback.hidden = false;
}
