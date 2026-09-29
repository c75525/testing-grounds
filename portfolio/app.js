const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const SLIDE_INTERVAL = 10_000;

function setActiveSlide(slides, activeIndex) {
  slides.forEach((slide, index) => {
    const active = index === activeIndex;
    slide.classList.toggle('is-active', active);
    slide.setAttribute('aria-hidden', String(!active));
  });
}

function startSlideshow(slideshow) {
  const slides = [...slideshow.querySelectorAll('.slide')];
  let activeIndex = 0;
  setActiveSlide(slides, activeIndex);
  if (slides.length < 2 || reducedMotion.matches) return;

  setInterval(() => {
    activeIndex = (activeIndex + 1) % slides.length;
    setActiveSlide(slides, activeIndex);
  }, SLIDE_INTERVAL);
}

document.querySelectorAll('.slideshow').forEach(startSlideshow);
