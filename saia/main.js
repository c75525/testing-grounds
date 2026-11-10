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
  const meshes = [];

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
        (isCenterCylinder ? centerGroup : spinGroup).add(mesh);
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
    }
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
    camera.aspect = width / height;
    yawGroup.position.y = mobileViewport.matches ? -1.05 : -0.72;
    camera.position.y = 0;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  new ResizeObserver(resize).observe(wordmark);
  resize();
  document.fonts.ready.then(resize);

  reduceMotion.addEventListener('change', (event) => {
    isPlaying = !event.matches;
  });

  const clock = new THREE.Clock();
  const render = () => {
    const delta = Math.min(clock.getDelta(), 0.05);
    if (isPlaying) spinGroup.rotation.z += rotationSpeed * delta;
    renderer.render(scene, camera);
    for (const mesh of meshes) mesh.material = wordmarkMaterials;
    wordmarkRenderer.render(scene, camera);
    for (const mesh of meshes) mesh.material = baseMaterials;
    requestAnimationFrame(render);
  };
  render();
} catch (error) {
  console.error(error);
  fallback.hidden = false;
}
