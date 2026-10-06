import * as spring from './vendor/pmndrs-math-spring.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const SLIDE_INTERVAL = 10_000;
const STROKE_SPEED = 29;
const directoryEntries = [...document.querySelectorAll('.directory-entry')];
const pages = [...document.querySelectorAll('.content-page')];
let selectedIndex = directoryEntries.findIndex(entry => entry.dataset.section === 'freelance');
let hoveredIndex = -1;
const DIRECTORY_OFFSET = 12;
const directorySprings = directoryEntries.map((_, index) => spring.create(index === selectedIndex ? DIRECTORY_OFFSET : 0));
let directorySpringFrame;
let previousSpringTime;
let alcorAnimationTimeout;

function animateDirectorySelection() {
  if (reducedMotion.matches) {
    directoryEntries.forEach((entry, index) => {
      const value = index === selectedIndex || index === hoveredIndex ? DIRECTORY_OFFSET : 0;
      directorySprings[index].value = value;
      directorySprings[index].velocity = 0;
      entry.style.setProperty('--directory-offset', `${value}px`);
    });
    return;
  }
  if (directorySpringFrame) return;
  previousSpringTime = undefined;
  function tick(time) {
    const delta = previousSpringTime === undefined ? 0 : Math.min((time - previousSpringTime) / 1000, 0.05);
    previousSpringTime = time;
    let settled = true;
    directorySprings.forEach((state, index) => {
      const target = index === selectedIndex || index === hoveredIndex ? DIRECTORY_OFFSET : 0;
      spring.update(state, target, 0.22, 0.58, delta);
      directoryEntries[index].style.setProperty('--directory-offset', `${state.value}px`);
      if (Math.abs(state.value - target) > 0.01 || Math.abs(state.velocity) > 0.01) settled = false;
    });
    if (settled) {
      directorySpringFrame = undefined;
      previousSpringTime = undefined;
    } else {
      directorySpringFrame = requestAnimationFrame(tick);
    }
  }
  directorySpringFrame = requestAnimationFrame(tick);
}

function bindLastTwoWords(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  const lastTextNode = textNodes.reverse().find(node => node.textContent.trim());
  if (!lastTextNode) return;
  lastTextNode.textContent = lastTextNode.textContent.replace(/(\S+)\s+(\S+)(\s*)$/u, '$1\u00a0$2$3');
}

function setDirectorySelection(index) {
  selectedIndex = (index + directoryEntries.length) % directoryEntries.length;
  directoryEntries.forEach((entry, entryIndex) => {
    const selected = entryIndex === selectedIndex;
    entry.setAttribute('aria-selected', String(selected));
    entry.tabIndex = selected ? 0 : -1;
  });
  document.body.dataset.activeSection = directoryEntries[selectedIndex].dataset.section;
  animateDirectorySelection();
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
    }
  });
  if (section === 'inhouse') playAlcorLogoAnimation();
  if (shouldScroll) requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  });
}

function playAlcorLogoAnimation() {
  const logo = document.querySelector('#portfolio-alcor-logo');
  if (!logo) return;
  clearTimeout(alcorAnimationTimeout);
  logo.classList.remove('animate-draw');
  if (reducedMotion.matches) return;
  void logo.getBoundingClientRect();
  requestAnimationFrame(() => logo.classList.add('animate-draw'));
  alcorAnimationTimeout = setTimeout(() => logo.classList.remove('animate-draw'), 3500);
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

document.querySelectorAll('.photo-stack').forEach(stack => {
  let shuffling = false;
  stack.addEventListener('click', () => {
    if (shuffling) return;
    const frontPhoto = stack.querySelector(':scope > .stack-photo');
    if (!frontPhoto) return;
    if (reducedMotion.matches) {
      stack.append(frontPhoto);
      return;
    }
    shuffling = true;
    stack.classList.add('is-shuffling');
    setTimeout(() => {
      stack.append(frontPhoto);
      stack.classList.remove('is-shuffling');
      shuffling = false;
    }, 260);
  });
});

directoryEntries.forEach((entry, index) => {
  entry.addEventListener('pointerenter', () => {
    hoveredIndex = index;
    animateDirectorySelection();
  });
  entry.addEventListener('pointerleave', () => {
    if (hoveredIndex === index) hoveredIndex = -1;
    animateDirectorySelection();
  });
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

document.querySelectorAll('.case-context p, .inhouse-heading p').forEach(bindLastTwoWords);
setDirectorySelection(selectedIndex);
document.querySelectorAll('.slideshow').forEach(startSlideshow);
mountC75525StrokeAnimation();
requestAnimationFrame(() => document.body.classList.add('is-loaded'));
