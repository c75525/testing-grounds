const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const SLIDE_INTERVAL = 10_000;
const STROKE_SPEED = 29;
const directoryEntries = [...document.querySelectorAll('.directory-entry')];
const pages = [...document.querySelectorAll('.content-page')];
let selectedIndex = directoryEntries.findIndex(entry => entry.dataset.section === 'freelance');

function setDirectorySelection(index) {
  selectedIndex = (index + directoryEntries.length) % directoryEntries.length;
  directoryEntries.forEach((entry, entryIndex) => {
    const selected = entryIndex === selectedIndex;
    entry.setAttribute('aria-selected', String(selected));
    entry.tabIndex = selected ? 0 : -1;
  });
  document.body.dataset.activeSection = directoryEntries[selectedIndex].dataset.section;
}

function activateSection(section, shouldScroll = true) {
  setDirectorySelection(directoryEntries.findIndex(entry => entry.dataset.section === section));
  pages.forEach(page => {
    const active = page.dataset.page === section;
    page.hidden = !active;
    page.classList.remove('is-active');
    if (active) {
      void page.offsetWidth;
      page.classList.add('is-active');
      if (shouldScroll) page.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    }
  });
}

function startSlideshow(slideshow) {
  const slides = [...slideshow.querySelectorAll(':scope > .slide')];
  if (slides.length < 2 || reducedMotion.matches) return;
  let activeIndex = 0;
  setInterval(() => {
    slides[activeIndex].classList.remove('is-active');
    slides[activeIndex].setAttribute('aria-hidden', 'true');
    activeIndex = (activeIndex + 1) % slides.length;
    slides[activeIndex].classList.add('is-active');
    slides[activeIndex].setAttribute('aria-hidden', 'false');
  }, SLIDE_INTERVAL);
}

async function mountC75525StrokeAnimation() {
  const container = document.querySelector('#c75525-stroke-animation');
  if (!container) return;
  try {
    const response = await fetch('./assets/c75525-stroke.svg');
    if (!response.ok) throw new Error(`Stroke SVG request failed (${response.status})`);
    const parsed = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
    const sourceSvg = parsed.documentElement;
    if (sourceSvg.nodeName.toLowerCase() !== 'svg') throw new Error('Stroke source is not an SVG.');
    const svg = document.importNode(sourceSvg, true);
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('aria-hidden', 'true');
    svg.querySelectorAll('path, line, polyline, polygon, rect, circle, ellipse').forEach(path => path.classList.add('dotter-path'));
    container.replaceChildren(svg);
    if (reducedMotion.matches) return;
    let offset = 0;
    let previousTime;
    function animate(time) {
      if (previousTime !== undefined) {
        offset += STROKE_SPEED * Math.min((time - previousTime) / 1000, 0.1);
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

directoryEntries.forEach((entry, index) => {
  entry.addEventListener('click', () => activateSection(entry.dataset.section));
  entry.addEventListener('keydown', event => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = index + (event.key === 'ArrowUp' ? -1 : 1);
      setDirectorySelection(nextIndex);
      directoryEntries[selectedIndex].focus();
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      activateSection(entry.dataset.section);
    }
  });
});

setDirectorySelection(selectedIndex);
document.querySelectorAll('.slideshow').forEach(startSlideshow);
mountC75525StrokeAnimation();
requestAnimationFrame(() => document.body.classList.add('is-loaded'));
