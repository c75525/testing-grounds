(() => {
  if (!document.querySelector('.copy')) return;
  Promise.resolve(window.saiaPageReady).then(() => {
    document.body.classList.add('home-copy-ready');
  });
})();
