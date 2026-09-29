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
  background: document.querySelector('#background-color'),
  stroke: document.querySelector('#stroke-color'),
  backgroundSwatch: document.querySelector('#background-swatch'),
  strokeSwatch: document.querySelector('#stroke-swatch'),
  export: document.querySelector('#export-button'),
  exportStatus: document.querySelector('#export-status'),
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

function normalizeColor(input) {
  const color = input.value.trim();
  const valid = /^#[0-9a-f]{6}$/i.test(color);
  input.setAttribute('aria-invalid', String(!valid));
  return valid ? color.toUpperCase() : null;
}

function textColorForBackground(color) {
  const channels = [1, 3, 5].map(index => Number.parseInt(color.slice(index, index + 2), 16) / 255);
  const linear = channels.map(channel => channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4);
  const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  return luminance < 0.179 ? '#FFFFFF' : '#111111';
}

function syncColors() {
  const background = normalizeColor(controls.background);
  const stroke = normalizeColor(controls.stroke);
  if (background) {
    controls.background.value = background;
    controls.backgroundSwatch.style.setProperty('--swatch-color', background);
    preview.style.setProperty('--export-background', background);
    document.documentElement.style.setProperty('--page-background', background);
    document.documentElement.style.setProperty('--page-foreground', textColorForBackground(background));
  }
  if (stroke) {
    controls.stroke.value = stroke;
    controls.strokeSwatch.style.setProperty('--swatch-color', stroke);
    preview.style.setProperty('--export-stroke', stroke);
  }
  controls.export.disabled = !(background && stroke);
  return background && stroke ? { background, stroke } : null;
}

function exportSettings() {
  const colors = syncColors();
  if (!colors) return null;
  return { ...currentSettings(), ...colors, direction };
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
  syncColors();
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
  controls.dash.value = '16';
  controls.gap.value = '10';
  controls.speed.value = '48';
  setDirection(1);
  setPlayState(!matchMedia('(prefers-reduced-motion: reduce)').matches);
  replacePreview(defaultSvg.cloneNode(true), 'Previewing the included SVG');
});

[controls.dash, controls.gap, controls.speed].forEach(control => {
  control.addEventListener('input', syncControls);
});

[controls.background, controls.stroke].forEach(control => {
  control.addEventListener('input', syncColors);
  control.addEventListener('blur', syncColors);
});

controls.export.addEventListener('click', async () => {
  const settings = exportSettings();
  if (!settings) {
    controls.exportStatus.textContent = 'Use six-digit hex colors, for example #111111.';
    return;
  }
  controls.export.disabled = true;
  controls.exportStatus.textContent = 'Preparing 120 frames…';
  try {
    const { exportMp4, exportSpec } = await import('./exporter.js');
    await exportMp4(preview, settings, (frame, total) => {
      controls.exportStatus.textContent = `Rendering frame ${frame} of ${total}…`;
    });
    controls.exportStatus.textContent = `Downloaded MP4 — ${exportSpec}.`;
  } catch (error) {
    controls.exportStatus.textContent = error.message || 'The MP4 could not be exported.';
  } finally {
    syncColors();
  }
});

replacePreview(preview, 'Previewing the included SVG');
syncColors();
setDirection(1);
setPlayState(playing);
requestAnimationFrame(animate);
