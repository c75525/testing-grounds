import {
  BufferTarget,
  CanvasSource,
  Mp4OutputFormat,
  Output,
  Quality,
} from './vendor/mediabunny.js';

const EXPORT_WIDTH = 1927;
const EXPORT_HEIGHT = 1158;
const FRAME_RATE = 60;
const DURATION_SECONDS = 2;
const TOTAL_FRAMES = FRAME_RATE * DURATION_SECONDS;
const HORIZONTAL_PADDING = 30;
const VERTICAL_PADDING = 20;
const SVG_NS = 'http://www.w3.org/2000/svg';

function frameSvg(preview, settings, elapsedSeconds) {
  const svg = preview.cloneNode(true);
  svg.removeAttribute('id');
  svg.setAttribute('width', String(EXPORT_WIDTH));
  svg.setAttribute('height', String(EXPORT_HEIGHT));
  svg.setAttribute('xmlns', SVG_NS);

  const viewBox = (svg.getAttribute('viewBox') || '0 0 960 540').trim().split(/[\s,]+/).map(Number);
  const [x = 0, y = 0, width = 960, height = 540] = viewBox;
  const background = document.createElementNS(SVG_NS, 'rect');
  background.setAttribute('x', String(x));
  background.setAttribute('y', String(y));
  background.setAttribute('width', String(width));
  background.setAttribute('height', String(height));
  background.setAttribute('fill', settings.background);
  svg.insertBefore(background, svg.firstChild);

  const dashOffset = settings.direction * settings.speed * elapsedSeconds;
  svg.querySelectorAll('.dotter-path').forEach(path => {
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', settings.stroke);
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-dasharray', `${settings.dash} ${settings.gap}`);
    path.setAttribute('stroke-dashoffset', String(dashOffset));
    path.setAttribute('vector-effect', 'non-scaling-stroke');
  });

  return new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
}

async function drawFrame(context, preview, settings, elapsedSeconds) {
  const source = frameSvg(preview, settings, elapsedSeconds);
  const url = URL.createObjectURL(source);
  const image = new Image();
  image.src = url;
  try {
    await image.decode();
    context.fillStyle = settings.background;
    context.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
    context.drawImage(
      image,
      HORIZONTAL_PADDING,
      VERTICAL_PADDING,
      EXPORT_WIDTH - HORIZONTAL_PADDING * 2,
      EXPORT_HEIGHT - VERTICAL_PADDING * 2,
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

function download(buffer) {
  const blob = new Blob([buffer], { type: 'video/mp4' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'stroke-dotter.mp4';
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

export async function exportMp4(preview, settings, onProgress) {
  if (!('VideoEncoder' in window)) {
    throw new Error('MP4 export needs a current Chromium-based browser with WebCodecs support.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = EXPORT_WIDTH;
  canvas.height = EXPORT_HEIGHT;
  const context = canvas.getContext('2d', { alpha: false });
  const output = new Output({
    format: new Mp4OutputFormat(),
    target: new BufferTarget(),
  });
  const source = new CanvasSource(canvas, {
    codec: 'av1',
    quality: new Quality({ bitrate: 16_000_000 }),
  });

  output.addVideoTrack(source, { frameRate: FRAME_RATE });
  await output.start();

  for (let frame = 0; frame < TOTAL_FRAMES; frame += 1) {
    const timestamp = frame / FRAME_RATE;
    await drawFrame(context, preview, settings, timestamp);
    await source.add(timestamp, 1 / FRAME_RATE);
    if (frame % 6 === 0) {
      onProgress?.(frame + 1, TOTAL_FRAMES);
      await new Promise(requestAnimationFrame);
    }
  }

  onProgress?.(TOTAL_FRAMES, TOTAL_FRAMES);
  await output.finalize();
  download(output.target.buffer);
}

export const exportSpec = `${EXPORT_WIDTH} × ${EXPORT_HEIGHT} px · ${FRAME_RATE} fps · ${DURATION_SECONDS} seconds · ${HORIZONTAL_PADDING}px horizontal / ${VERTICAL_PADDING}px vertical padding`;
