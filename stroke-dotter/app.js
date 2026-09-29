const controls = {
  file: document.querySelector('#svg-file'),
  import: document.querySelector('#import-button'),
  direction: document.querySelector('#direction-button'),
  play: document.querySelector('#play-button'),
  reset: document.querySelector('#reset-button'),
  dash: document.querySelector('#dash-length'),
  gap: document.querySelector('#gap-length'),
  speed: document.querySelector('#speed'),
  dashValue: document.querySelector('#dash-value'),
  gapValue: document.querySelector('#gap-value'),
  speedValue: document.querySelector('#speed-value'),
  status: document.querySelector('#file-status'),
};

const pathSelector = 'path, line, polyline, polygon, rect, circle, ellipse';
const defaultSvg = document.querySelector('#preview-svg').cloneNode(true);
let preview = document.querySelector('#preview-svg');
let direction = 1;
let playing = !matchMedia('(prefers-reduced-motion: reduce)').matches;
let offset = 0;
let previousTime;

function currentSettings() {
  return {
    dash: Number(controls.dash.value),
    gap: Number(controls.gap.value),
    speed: Number(controls.speed.value),
  };
}

function decoratePaths(svg) {
  const paths = svg.querySelectorAll(pathSelector);
  paths.forEach(path => path.classList.add('dotter-path'));
  return paths.length;
}

function syncControls() {
  const { dash, gap, speed } = currentSettings();
  controls.dashValue.value = `${dash} px`;
  controls.gapValue.value = `${gap} px`;
  controls.speedValue.value = `${speed} px/s`;
  preview.style.setProperty('--dash-length', `${dash}px`);
  preview.style.setProperty('--gap-length', `${gap}px`);
}

function setPlayState(nextPlaying) {
  playing = nextPlaying;
  controls.play.textContent = playing ? 'Pause' : 'Play';
  controls.play.setAttribute('aria-pressed', String(!playing));
  previousTime = undefined;
}

function setDirection(nextDirection) {
  direction = nextDirection;
  const forward = direction === 1;
  controls.direction.textContent = `Direction: ${forward ? 'forward' : 'reverse'}`;
  controls.direction.setAttribute('aria-pressed', String(!forward));
}

function animate(time) {
  if (playing) {
    if (previousTime !== undefined) {
      const deltaSeconds = Math.min((time - previousTime) / 1000, 0.1);
      offset += direction * currentSettings().speed * deltaSeconds;
      preview.style.setProperty('--dash-offset', `${offset}px`);
    }
    previousTime = time;
  }
  requestAnimationFrame(animate);
}

function sanitizeSvg(source) {
  const documentFragment = new DOMParser().parseFromString(source, 'image/svg+xml');
  const parserError = documentFragment.querySelector('parsererror');
  const sourceSvg = documentFragment.documentElement;
  if (parserError || sourceSvg.nodeName.toLowerCase() !== 'svg') {
    throw new Error('This file is not a valid SVG.');
  }

  sourceSvg.querySelectorAll('script, foreignObject, iframe, object, embed').forEach(node => node.remove());
  sourceSvg.querySelectorAll('*').forEach(node => {
    [...node.attributes].forEach(attribute => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith('on') || (name.endsWith('href') && !value.startsWith('#')) || value.includes('url(')) {
        node.removeAttribute(attribute.name);
      }
    });
  });

  const svg = document.importNode(sourceSvg, true);
  svg.id = 'preview-svg';
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Imported SVG with animated dotted strokes');
  if (!svg.hasAttribute('viewBox')) {
    const width = Number.parseFloat(sourceSvg.getAttribute('width')) || 960;
    const height = Number.parseFloat(sourceSvg.getAttribute('height')) || 540;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }
  return svg;
}

function replacePreview(svg, label) {
  preview.replaceWith(svg);
  preview = svg;
  offset = 0;
  previousTime = undefined;
  const shapeCount = decoratePaths(preview);
  syncControls();
  controls.status.textContent = shapeCount
    ? `${label} — animating ${shapeCount} stroke${shapeCount === 1 ? '' : 's'}.`
    : `${label} — no drawable SVG shapes were found.`;
}

controls.import.addEventListener('click', () => controls.file.click());
controls.file.addEventListener('change', async () => {
  const [file] = controls.file.files;
  if (!file) return;
  try {
    replacePreview(sanitizeSvg(await file.text()), `Imported ${file.name}`);
  } catch (error) {
    controls.status.textContent = error.message;
  } finally {
    controls.file.value = '';
  }
});

controls.direction.addEventListener('click', () => setDirection(direction * -1));
controls.play.addEventListener('click', () => setPlayState(!playing));
controls.reset.addEventListener('click', () => {
  controls.dash.value = '8';
  controls.gap.value = '12';
  controls.speed.value = '48';
  setDirection(1);
  setPlayState(!matchMedia('(prefers-reduced-motion: reduce)').matches);
  replacePreview(defaultSvg.cloneNode(true), 'Previewing the included SVG');
});

[controls.dash, controls.gap, controls.speed].forEach(control => {
  control.addEventListener('input', syncControls);
});

replacePreview(preview, 'Previewing the included SVG');
setDirection(1);
setPlayState(playing);
requestAnimationFrame(animate);
