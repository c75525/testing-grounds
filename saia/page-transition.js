(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let resolveReady;
  let started = false;
  let pauseTimer;
  let cleanupTimer;
  window.saiaPageReady = new Promise(resolve => { resolveReady = resolve; });
  function finish() {
    started = true;
    clearTimeout(pauseTimer);
    clearTimeout(cleanupTimer);
    clearTimeout(failsafe);
    root.classList.remove('page-loading', 'page-entering');
    resolveReady();
  }
  function reveal() {
    if (started) return;
    if (reduced.matches) { finish(); return; }
    started = true;
    root.classList.replace('page-loading', 'page-entering');
    resolveReady();
    cleanupTimer = setTimeout(finish, 1150);
  }
  // If font loading stalls, keep the page usable instead of leaving it hidden.
  const failsafe = setTimeout(finish, 3500);
  if (reduced.matches) { finish(); return; }
  root.classList.add('page-loading');
  document.addEventListener('DOMContentLoaded', async () => {
    await Promise.race([
      document.fonts.ready,
      new Promise(resolve => setTimeout(resolve, 1800)),
    ]);
    if (!started) pauseTimer = setTimeout(reveal, 500);
  }, { once: true });
  document.addEventListener('animationend', event => {
    if (event.target === document.body && event.animationName === 'saia-page-enter') finish();
  });
  reduced.addEventListener('change', event => { if (event.matches) finish(); });
  addEventListener('pageshow', event => { if (event.persisted) finish(); });
})();
