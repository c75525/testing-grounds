import * as spring from './vendor/pmndrs-math-spring.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const desktopGalleryInteraction = matchMedia('(min-width: 761px)');
const SLIDE_INTERVAL = 10_000;
const STROKE_SPEED = 29;
const TYPEWRITER_INTERVAL = 16;
const SPLASH_TYPE_INTERVAL = 36;
const SPLASH_MESSAGE = 'Welcome to my portfolio, take a look around.\n:-)';
const SOCIAL_CAPTIONS = {
  Da3dQmmEu52: `Take a look at this vintage pamphlet on cryonics from the early days of Alcor. Notice those two stars hanging above the tree?

Alcor founders Linda and Fred Chamberlain believed humanity would one day travel to the stars, and while searching star catalogs for a fitting name, they chose Alcor, a dim companion star to the bright Mizar star, which was long used as a test of keen eyesight. The idea was that if you can see Alcor's purpose, you have excellent "vision."

Do you have the "vision" to see your future among the stars? ⭐`,
  DWFQPh3Aa7R: `Alcor CEO James Arrowood will be travelling through Europe over the coming weeks and wants to sit down for dinner with members in a few cities along the way.

This trip is part of something bigger. Alcor is actively laying the groundwork for a local European presence, including a facility on the continent, and hearing directly from members is a real part of that process. If you've had thoughts on what Alcor's future in Europe could look like, come share them over a meal.

Here's where he's currently planning to be:

London — Friday - Saturday, March 20th/21st
Frankfurt — Monday, March 23rd
Cologne — Tuesday, March 24th
Stockholm — Wednesday - Thursday, March 25th/26th`,
  DX99IZNj2Z4: `The latest Alcor Newsletter is out. 🗞️

It includes several important developments, including an update on Mike Perry.

Visit the Linktree in our bio to read the full issue. 🔗`,
  DYVTq2DEr3b: `Behind The Scenes:

Our Membership Director Diane, hand-sewing Alcor patches onto the bags our team is bringing to Vitalist Bay. A little personal touch to see us off. 🪡

See you all in Berkeley!`,
  DZD7bXGj0Ha: `Behind The Scenes:

Wonjin using a repurposed machine learning model (built by Mohammed) to calculate the area of brain slices by pixel density. Pretty cool, right? 🧠

The catch? Photographing each slice by hand was a bottleneck. So Mohammed modeled and 3D-printed a custom iPhone mount to streamline the process. 📲

Never a dull moment when you've got this level of versatility on the team.`,
};
const directoryEntries = [...document.querySelectorAll('.directory-entry')];
const pages = [...document.querySelectorAll('.content-page')];
const inhousePage = document.querySelector('#inhouse-page');
const alcorIntroMedia = document.querySelector('.alcor-logo-stage');
const alcorIntroContext = document.querySelector('.alcor-intro-row > .case-context');
const socialStack = document.querySelector('.photo-stack');
const socialCaptionCopy = document.querySelector('.social-caption-copy');
const socialCaptionLive = document.querySelector('.social-caption-live');
const socialConnector = document.querySelector('.social-caption-connector');
const socialConnectorPath = socialConnector?.querySelector('path');
const splash = document.querySelector('.splash');
const splashMessage = document.querySelector('.splash-message');
const splashEnter = document.querySelector('.splash-enter');
const portfolioShell = document.querySelector('.portfolio-shell');
let selectedIndex = directoryEntries.findIndex(entry => entry.dataset.section === 'inhouse');
let hoveredIndex = -1;
const DIRECTORY_OFFSET = 12;
const directorySprings = directoryEntries.map((_, index) => spring.create(index === selectedIndex ? DIRECTORY_OFFSET : 0));
let directorySpringFrame;
let previousSpringTime;
let alcorAnimationTimeout;
let typewriterFrame;
let connectorFrame;
let connectorDrawFrame;
let socialCaptionAnchor;
let socialCaptionStarted = false;
let portfolioLaunched = false;

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

function syncAlcorIntroRow() {
  if (!inhousePage || !alcorIntroMedia || !alcorIntroContext || inhousePage.hidden || innerWidth <= 760) {
    inhousePage?.classList.remove('has-compact-intro');
    return;
  }
  const mediaHeight = alcorIntroMedia.getBoundingClientRect().height;
  const contextHeight = alcorIntroContext.getBoundingClientRect().height;
  const rowGap = Number.parseFloat(getComputedStyle(inhousePage).rowGap);
  const overhang = Math.max(0, contextHeight - mediaHeight);
  const canPreserveGap = overhang <= Math.max(0, rowGap - 24);
  inhousePage.classList.toggle('has-compact-intro', canPreserveGap);
  if (canPreserveGap) inhousePage.style.setProperty('--alcor-intro-row-height', `${mediaHeight}px`);
}

function captionGraphemes(text) {
  if ('Segmenter' in Intl) {
    return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map(item => item.segment);
  }
  return Array.from(text);
}

function transformedElementPoint(element, x, y) {
  const parent = element.offsetParent;
  if (!parent) return { x: 0, y: 0 };
  const parentRect = parent.getBoundingClientRect();
  const style = getComputedStyle(element);
  const matrix = new DOMMatrix(style.transform === 'none' ? undefined : style.transform);
  const [originX, originY] = style.transformOrigin.split(' ').map(Number.parseFloat);
  const localX = x - originX;
  const localY = y - originY;
  return {
    x: parentRect.left + parent.clientLeft + element.offsetLeft + originX + matrix.a * localX + matrix.c * localY + matrix.e,
    y: parentRect.top + parent.clientTop + element.offsetTop + originY + matrix.b * localX + matrix.d * localY + matrix.f,
  };
}

function revealSplashEnter() {
  splashEnter?.classList.add('is-ready');
}

function typeSplashMessage() {
  if (!splashMessage) return;
  if (reducedMotion.matches) {
    splashMessage.textContent = SPLASH_MESSAGE;
    revealSplashEnter();
    return;
  }
  const graphemes = captionGraphemes(SPLASH_MESSAGE);
  let visibleCount = 0;
  let previousTime;
  function type(time) {
    if (previousTime === undefined || time - previousTime >= SPLASH_TYPE_INTERVAL) {
      visibleCount += 1;
      previousTime = time;
      splashMessage.textContent = graphemes.slice(0, visibleCount).join('');
    }
    if (visibleCount < graphemes.length) requestAnimationFrame(type);
    else setTimeout(revealSplashEnter, 180);
  }
  requestAnimationFrame(type);
}

function launchPortfolio() {
  if (portfolioLaunched) return;
  portfolioLaunched = true;
  if (splash) splash.hidden = true;
  document.body.dataset.splashActive = 'false';
  portfolioShell?.removeAttribute('inert');
  portfolioShell?.removeAttribute('aria-hidden');
  window.scrollTo({ top: 0, behavior: 'auto' });
  activateSection('inhouse', false);
  document.querySelectorAll('.slideshow').forEach(startSlideshow);
  mountC75525StrokeAnimation();
  requestAnimationFrame(() => document.body.classList.add('is-loaded'));
}

function dismissSplash() {
  if (!splash || !splashEnter?.classList.contains('is-ready')) return;
  splash.classList.add('is-exiting');
  setTimeout(launchPortfolio, reducedMotion.matches ? 0 : 500);
}

function updateSocialConnector() {
  const frontPhoto = socialStack?.querySelector(':scope > .stack-photo');
  if (!socialCaptionStarted || !frontPhoto || !socialCaptionCopy || !socialConnector || !socialConnectorPath) return;
  const overlayRect = socialConnector.getBoundingClientRect();
  const captionRect = socialCaptionCopy.getBoundingClientRect();
  const lineHeight = Number.parseFloat(getComputedStyle(socialCaptionCopy).lineHeight);
  const cardPoint = transformedElementPoint(frontPhoto, frontPhoto.offsetWidth - 8, frontPhoto.offsetHeight - 8);
  const startX = cardPoint.x - overlayRect.left;
  const startY = cardPoint.y - overlayRect.top;
  if (!socialCaptionAnchor) {
    socialCaptionAnchor = innerWidth <= 760
      ? {
          x: captionRect.left - overlayRect.left + 16,
          y: captionRect.top - overlayRect.top - 16,
        }
      : {
          x: captionRect.left - overlayRect.left - 16,
          y: captionRect.top - overlayRect.top + lineHeight * 1.5,
        };
  }
  socialConnectorPath.setAttribute('d', `M${startX} ${startY}L${socialCaptionAnchor.x} ${socialCaptionAnchor.y}`);
}

function animateSocialConnector() {
  cancelAnimationFrame(connectorDrawFrame);
  updateSocialConnector();
  if (!socialConnectorPath || reducedMotion.matches || !socialCaptionAnchor) return;
  const startedAt = performance.now();
  function draw(time) {
    updateSocialConnector();
    const target = socialConnectorPath.getPointAtLength(0);
    const progress = Math.min(1, (time - startedAt) / 360);
    const easedProgress = progress * progress;
    const movingX = socialCaptionAnchor.x + (target.x - socialCaptionAnchor.x) * easedProgress;
    const movingY = socialCaptionAnchor.y + (target.y - socialCaptionAnchor.y) * easedProgress;
    socialConnectorPath.setAttribute('d', `M${movingX} ${movingY}L${socialCaptionAnchor.x} ${socialCaptionAnchor.y}`);
    if (progress < 1) connectorDrawFrame = requestAnimationFrame(draw);
    else updateSocialConnector();
  }
  socialConnectorPath.setAttribute('d', `M${socialCaptionAnchor.x} ${socialCaptionAnchor.y}L${socialCaptionAnchor.x} ${socialCaptionAnchor.y}`);
  connectorDrawFrame = requestAnimationFrame(draw);
}

function trackSocialConnector(duration = 500) {
  cancelAnimationFrame(connectorFrame);
  const endTime = performance.now() + duration;
  function track(time) {
    updateSocialConnector();
    if (time < endTime) connectorFrame = requestAnimationFrame(track);
  }
  connectorFrame = requestAnimationFrame(track);
}

function clearSocialCaption() {
  cancelAnimationFrame(typewriterFrame);
  cancelAnimationFrame(connectorDrawFrame);
  socialCaptionAnchor = undefined;
  if (socialCaptionCopy) {
    socialCaptionCopy.replaceChildren();
    socialCaptionCopy.style.removeProperty('min-height');
  }
  if (socialCaptionLive) socialCaptionLive.textContent = '';
  socialConnectorPath?.removeAttribute('d');
}

function buildStableTypewriter(text) {
  const fragment = document.createDocumentFragment();
  const glyphs = [];
  captionGraphemes(text).forEach(grapheme => {
    if (grapheme === '\n') {
      fragment.append(document.createElement('br'));
      return;
    }
    if (/^\s+$/u.test(grapheme)) {
      fragment.append(document.createTextNode(grapheme));
      return;
    }
    const glyph = document.createElement('span');
    glyph.className = 'typewriter-glyph';
    glyph.textContent = grapheme;
    glyphs.push(glyph);
    fragment.append(glyph);
  });
  socialCaptionCopy.replaceChildren(fragment);
  return glyphs;
}

function renderFrontSocialCaption() {
  const frontPhoto = socialStack?.querySelector(':scope > .stack-photo');
  const caption = frontPhoto ? SOCIAL_CAPTIONS[frontPhoto.dataset.postId] : undefined;
  if (!caption || !socialCaptionCopy || !socialCaptionLive) return;
  cancelAnimationFrame(typewriterFrame);
  const fullCaption = `“${caption}”`;
  socialCaptionLive.textContent = fullCaption;
  socialCaptionCopy.textContent = fullCaption;
  socialCaptionCopy.style.minHeight = `${socialCaptionCopy.getBoundingClientRect().height}px`;
  socialCaptionAnchor = undefined;
  if (reducedMotion.matches) {
    socialCaptionCopy.textContent = fullCaption;
    updateSocialConnector();
    return;
  }
  const glyphs = buildStableTypewriter(fullCaption);
  let visibleCount = 0;
  let previousTime;
  function type(time) {
    if (previousTime === undefined || time - previousTime >= TYPEWRITER_INTERVAL) {
      glyphs[visibleCount]?.classList.add('is-visible');
      visibleCount += 1;
      previousTime = time;
    }
    if (visibleCount < glyphs.length) typewriterFrame = requestAnimationFrame(type);
  }
  typewriterFrame = requestAnimationFrame(type);
  updateSocialConnector();
}

function startSocialPresentation() {
  if (socialCaptionStarted || document.body.dataset.activeSection !== 'inhouse') return;
  socialCaptionStarted = true;
  renderFrontSocialCaption();
  animateSocialConnector();
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
  socialCaptionStarted = false;
  clearSocialCaption();
  if (section === 'inhouse') {
    requestAnimationFrame(syncAlcorIntroRow);
    playAlcorLogoAnimation();
  }
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
  alcorAnimationTimeout = setTimeout(() => logo.classList.remove('animate-draw'), 4800);
}

function startSlideshow(slideshow) {
  const slides = [...slideshow.querySelectorAll(':scope > .slide')];
  if (slides.length < 2) return;
  const baseLabel = slideshow.getAttribute('aria-label') || 'Project slideshow';
  const controls = document.createElement('div');
  controls.className = 'slideshow-controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', `${baseLabel} slide selection`);
  const controlButtons = slides.map((_, index) => {
    const button = document.createElement('button');
    button.className = 'slideshow-control';
    button.type = 'button';
    button.setAttribute('aria-label', `Show slide ${index + 1} of ${slides.length}`);
    const fill = document.createElement('span');
    fill.className = 'slideshow-control-fill';
    fill.setAttribute('aria-hidden', 'true');
    button.append(fill);
    controls.append(button);
    return button;
  });
  slideshow.insertAdjacentElement('afterend', controls);

  let activeIndex = Math.max(0, slides.findIndex(slide => slide.classList.contains('is-active')));
  let advanceTimeout;
  let controlSpringFrame;
  let previousControlSpringTime;
  const controlSprings = controlButtons.map(() => spring.create(1));

  function syncFrameInteractionMode() {
    const desktop = desktopGalleryInteraction.matches;
    slideshow.classList.toggle('is-interactive', desktop);
    if (desktop) {
      slideshow.tabIndex = 0;
      slideshow.setAttribute('role', 'button');
    } else {
      slideshow.removeAttribute('tabindex');
      slideshow.removeAttribute('role');
    }
  }

  function animateControlSprings() {
    if (reducedMotion.matches) {
      controlButtons.forEach((button, index) => {
        const value = index === activeIndex ? 0.55 : 1;
        controlSprings[index].value = value;
        controlSprings[index].velocity = 0;
        button.style.setProperty('--control-scale-y', value);
      });
      return;
    }
    if (controlSpringFrame) return;
    previousControlSpringTime = undefined;
    function tick(time) {
      const delta = previousControlSpringTime === undefined ? 0 : Math.min((time - previousControlSpringTime) / 1000, 0.05);
      previousControlSpringTime = time;
      let settled = true;
      controlSprings.forEach((state, index) => {
        const target = index === activeIndex ? 0.55 : 1;
        spring.update(state, target, 0.18, 0.52, delta);
        controlButtons[index].style.setProperty('--control-scale-y', state.value);
        if (Math.abs(state.value - target) > 0.005 || Math.abs(state.velocity) > 0.005) settled = false;
      });
      if (settled) {
        controlSpringFrame = undefined;
        previousControlSpringTime = undefined;
      } else {
        controlSpringFrame = requestAnimationFrame(tick);
      }
    }
    controlSpringFrame = requestAnimationFrame(tick);
  }

  function syncSlideState() {
    slides.forEach((slide, index) => {
      const active = index === activeIndex;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });
    controlButtons.forEach((button, index) => {
      const active = index === activeIndex;
      button.classList.toggle('is-active', active);
      if (active) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
      const fill = button.querySelector('.slideshow-control-fill');
      fill.style.animation = 'none';
      if (active && !reducedMotion.matches) {
        void fill.offsetWidth;
        fill.style.animation = `slideshow-progress ${SLIDE_INTERVAL}ms linear forwards`;
      }
    });
    const actionLabel = desktopGalleryInteraction.matches
      ? 'Activate for the next slide.'
      : 'Use the controls below to select a slide.';
    slideshow.setAttribute('aria-label', `${baseLabel}; slide ${activeIndex + 1} of ${slides.length}. ${actionLabel}`);
    animateControlSprings();
  }

  function scheduleAdvance() {
    clearTimeout(advanceTimeout);
    if (!reducedMotion.matches) advanceTimeout = setTimeout(advance, SLIDE_INTERVAL);
  }

  function showSlide(index) {
    activeIndex = index;
    syncSlideState();
    scheduleAdvance();
  }

  function advance() {
    showSlide((activeIndex + 1) % slides.length);
  }

  controlButtons.forEach((button, index) => {
    button.addEventListener('pointerenter', () => {
      if (desktopGalleryInteraction.matches && index !== activeIndex) showSlide(index);
    });
    button.addEventListener('focus', () => {
      if (index !== activeIndex) showSlide(index);
    });
    button.addEventListener('click', () => {
      if (!desktopGalleryInteraction.matches && index !== activeIndex) showSlide(index);
    });
  });
  slideshow.addEventListener('click', () => {
    if (desktopGalleryInteraction.matches) advance();
  });
  slideshow.addEventListener('keydown', event => {
    if (!desktopGalleryInteraction.matches || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    advance();
  });
  desktopGalleryInteraction.addEventListener('change', () => {
    syncFrameInteractionMode();
    syncSlideState();
    scheduleAdvance();
  });

  syncFrameInteractionMode();
  syncSlideState();
  scheduleAdvance();
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
  stack.addEventListener('pointerenter', () => trackSocialConnector());
  stack.addEventListener('pointerleave', () => trackSocialConnector());
  stack.addEventListener('transitionend', event => {
    if (event.propertyName === 'transform') updateSocialConnector();
  });
  stack.addEventListener('click', () => {
    if (shuffling) return;
    const frontPhoto = stack.querySelector(':scope > .stack-photo');
    if (!frontPhoto) return;
    socialCaptionStarted = true;
    clearSocialCaption();
    if (reducedMotion.matches) {
      stack.append(frontPhoto);
      renderFrontSocialCaption();
      animateSocialConnector();
      return;
    }
    shuffling = true;
    stack.classList.add('is-shuffling');
    trackSocialConnector(320);
    setTimeout(() => {
      stack.append(frontPhoto);
      stack.classList.remove('is-shuffling');
      shuffling = false;
      renderFrontSocialCaption();
      animateSocialConnector();
    }, 260);
  });
});

if ('IntersectionObserver' in window && socialStack) {
  const socialPresentationObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) startSocialPresentation();
  }, { threshold: 0.2 });
  socialPresentationObserver.observe(socialStack);
}

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

document.querySelectorAll('.case-context p, .inhouse-heading p, .project-subtitle').forEach(bindLastTwoWords);
if ('ResizeObserver' in window && alcorIntroMedia && alcorIntroContext) {
  const alcorLayoutObserver = new ResizeObserver(() => {
    syncAlcorIntroRow();
    updateSocialConnector();
  });
  alcorLayoutObserver.observe(alcorIntroMedia);
  alcorLayoutObserver.observe(alcorIntroContext);
  if (socialStack) alcorLayoutObserver.observe(socialStack);
  if (socialCaptionCopy) alcorLayoutObserver.observe(socialCaptionCopy);
}
setDirectorySelection(selectedIndex);
if (splash && splashEnter) {
  splashEnter.addEventListener('click', dismissSplash);
  requestAnimationFrame(() => document.body.classList.add('is-splash-ready'));
  setTimeout(typeSplashMessage, reducedMotion.matches ? 0 : 700);
} else {
  launchPortfolio();
}
