const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const SLIDE_INTERVAL = 10_000;
const STROKE_DASH = 32;
const STROKE_GAP = 25;
const STROKE_SPEED = 29;

function setActiveSlide(slides, activeIndex) {
  slides.forEach((slide, index) => {
    const active = index === activeIndex;
    slide.classList.toggle('is-active', active);
    slide.setAttribute('aria-hidden', String(!active));
  });
}

function startSlideshow(slideshow) {
  const slides = [...slideshow.querySelectorAll(':scope > .slide')];
  let activeIndex = 0;
  setActiveSlide(slides, activeIndex);
  if (slides.length < 2 || reducedMotion.matches) return;

  setInterval(() => {
    activeIndex = (activeIndex + 1) % slides.length;
    setActiveSlide(slides, activeIndex);
  }, SLIDE_INTERVAL);
}

async function mountC75525StrokeAnimation() {
  const container = document.querySelector('#c75525-stroke-animation');
  if (!container) return;

  try {
    const response = await fetch('./assets/c75525-stroke.svg');
    if (!response.ok) throw new Error(`Stroke SVG request failed (${response.status})`);
    const source = await response.text();
    const parsed = new DOMParser().parseFromString(source, 'image/svg+xml');
    const sourceSvg = parsed.documentElement;
    if (sourceSvg.nodeName.toLowerCase() !== 'svg') throw new Error('Stroke source is not an SVG.');

    const svg = document.importNode(sourceSvg, true);
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('aria-hidden', 'true');
    svg.querySelectorAll('path, line, polyline, polygon, rect, circle, ellipse').forEach(path => {
      path.classList.add('dotter-path');
    });
    container.replaceChildren(svg);

    if (reducedMotion.matches) return;
    let offset = 0;
    let previousTime;
    function animate(time) {
      if (previousTime !== undefined) {
        const deltaSeconds = Math.min((time - previousTime) / 1000, 0.1);
        offset += STROKE_SPEED * deltaSeconds;
        svg.style.setProperty('--dash-offset', `${offset}px`);
      }
      previousTime = time;
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  } catch (error) {
    console.error('c75525 stroke animation could not load.', error);
  }
}

document.querySelectorAll('.slideshow').forEach(startSlideshow);
mountC75525StrokeAnimation();
