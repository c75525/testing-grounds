// Keep the original mobile composition and dimensions. Only shift content
// upward when its text would otherwise be clipped by the fixed navigation.
(() => {
  const mobile = matchMedia('(max-width: 640px)');
  const home = document.querySelector('.content');
  const detail = document.querySelector('.meeting-detail');
  const nav = document.querySelector('.bottom-nav');
  const root = document.documentElement;
  let queued = false;
  function fit() {
    queued = false;
    root.style.removeProperty('--home-fit');
    root.style.removeProperty('--meeting-fit');
    if (!mobile.matches || !nav) return;
    const limit = nav.getBoundingClientRect().top - 16;
    if (home) {
      const copy = home.querySelector('.copy');
      const excess = Math.max(0, copy.getBoundingClientRect().bottom - limit);
      root.style.setProperty('--home-fit', `${-excess}px`);
      dispatchEvent(new Event('saia:layout-fit'));
    }
    if (detail) {
      const excess = Math.max(0, detail.getBoundingClientRect().bottom - limit);
      root.style.setProperty('--meeting-fit', `${excess}px`);
    }
  }
  function schedule() {
    if (!queued) { queued = true; requestAnimationFrame(fit); }
  }
  addEventListener('resize', schedule);
  mobile.addEventListener('change', schedule);
  document.fonts.ready.then(schedule);
  // Text changes when a different meeting is selected; positions aren't observed.
  if (detail) new MutationObserver(schedule).observe(detail, { childList: true, subtree: true, characterData: true, attributes: true });
  schedule();
})();
