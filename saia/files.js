const directory = document.querySelector('#directory');
const preview = document.querySelector('.file-preview');
const connector = document.querySelector('.preview-connector');
const caption = document.querySelector('.preview-caption');
const previewLink = document.querySelector('.preview-link');
const previewImage = document.querySelector('.preview-image');
const status = document.querySelector('#file-status');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let openFolder = null;
let highlighted = null;
let selected = null;
let generation = 0;
const maxWindowSize = 8;
let windowSize = maxWindowSize;
function fitWindow() {
  if (openFolder === null) return;
  const list = document.querySelector(`#folder-${openFolder}`);
  const row = list.querySelector('.file-button');
  if (!row) return;
  const scale = new DOMMatrix(getComputedStyle(directory).transform).a;
  const top = list.getBoundingClientRect().top;
  const bottom = Math.min(directory.getBoundingClientRect().bottom, document.querySelector('.bottom-nav').getBoundingClientRect().top - 16);
  const rowHeight = row.offsetHeight * scale;
  // Reserve both end indicators; fewer than eight entries on short viewports.
  windowSize = Math.max(1, Math.min(maxWindowSize, Math.floor((bottom - top - 44 * scale) / rowHeight)));
  updateWindow(openFolder, windowStarts.get(openFolder) || 0);
  if (highlighted?.classList.contains('file-button') && Number(highlighted.dataset.parent) === openFolder) revealRow(highlighted);
}
const windowStarts = new Map();
function updateWindow(folderIndex, start) {
  const list = document.querySelector(`#folder-${folderIndex}`);
  const items = [...list.querySelectorAll('.file-button')];
  const first = Math.max(0, Math.min(Math.max(0, items.length - windowSize), start));
  windowStarts.set(folderIndex, first);
  items.forEach((row, index) => {
    row.parentElement.hidden = index < first || index >= first + windowSize;
    row.parentElement.style.setProperty('--order', Math.max(0, index - first));
  });
  list.querySelector('[data-direction="up"]').hidden = first === 0;
  list.querySelector('[data-direction="down"]').hidden = first + windowSize >= items.length;
  positionConnector();
}
function revealRow(row) {
  if (!row?.classList.contains('file-button')) return;
  const folderIndex = Number(row.dataset.parent);
  const index = Number(row.dataset.index);
  const first = windowStarts.get(folderIndex) || 0;
  if (index < first) updateWindow(folderIndex, index);
  else if (index >= first + windowSize) updateWindow(folderIndex, index - windowSize + 1);
}
const rows = () => [...directory.querySelectorAll('.directory-row')];
function updateStage() {
  const page = document.querySelector('.files-page');
  page.classList.toggle('is-folder-overview', openFolder === null);
  page.classList.toggle('is-folder-browsing', openFolder !== null && selected === null);
}
function highlight(row, focus = false) {
  revealRow(row);
  highlighted?.classList.remove('is-highlighted');
  highlighted = row;
  row?.classList.add('is-highlighted');
  rows().forEach(item => { item.tabIndex = item === row ? 0 : -1; });
  if (focus && row) {
    row.focus({ preventScroll: true });
    if (openFolder !== null) row.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}
function clearPreview() {
  generation += 1;
  selected?.classList.remove('is-selected');
  selected?.setAttribute('aria-pressed', 'false');
  selected = null;
  preview.hidden = true;
  connector.classList.remove('is-drawing');
  updateStage();
}
function positionConnector() {
  if (!selected || preview.hidden) return;
  const label = selected.getBoundingClientRect();
  const target = preview.getBoundingClientRect();
  const parent = document.querySelector('.files-page').getBoundingClientRect();
  const viewport = directory.getBoundingClientRect();
  connector.style.visibility = selected.closest('[hidden]') || label.top < viewport.top || label.bottom > viewport.bottom ? 'hidden' : 'visible';
  connector.style.left = `${label.right - parent.left + 8}px`;
  connector.style.top = `${label.top + label.height / 2 - parent.top}px`;
  connector.style.width = `${Math.max(0, target.left - label.right - 24)}px`;
}
async function showPreview(row, item) {
  const wasBrowsing = selected === null;
  clearPreview();
  selected = row;
  row.classList.add('is-selected');
  row.setAttribute('aria-pressed', 'true');
  const token = generation;
  updateStage();
  if (wasBrowsing && !reduced.matches) await new Promise(resolve => setTimeout(resolve, 720));
  if (token !== generation) return;
  row.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  previewLink.href = item.url;
  previewLink.setAttribute('aria-label', `Open ${item.label} in a new tab`);
  previewImage.src = './assets/files/placeholder.svg';
  previewImage.alt = `${item.label} — temporary solid-color preview`;
  const space = document.createElement('span');
  space.className = 'caption-space';
  space.textContent = item.description;
  space.setAttribute('aria-hidden', 'true');
  const typed = document.createElement('span');
  typed.className = 'caption-typed';
  typed.setAttribute('aria-hidden', 'true');
  caption.replaceChildren(space, typed);
  caption.setAttribute('aria-label', item.description);
  preview.hidden = false;
  // Restart only the new preview, without moving its containing frame.
  previewLink.style.animation = 'none';
  void previewLink.offsetWidth;
  previewLink.style.animation = '';
  positionConnector();
  void connector.offsetWidth;
  connector.classList.add('is-drawing');
  status.textContent = `${item.label} preview. Press Enter again or click the card to open the link.`;
  if (reduced.matches) { typed.textContent = item.description; return; }
  const letters = [...item.description].map(character => {
    const letter = document.createElement('span');
    letter.textContent = character;
    letter.style.visibility = 'hidden';
    typed.append(letter);
    return letter;
  });
  let count = 0;
  function type() {
    if (token !== generation) return;
    letters[count++].style.visibility = 'visible';
    if (count < letters.length) setTimeout(type, 22);
  }
  setTimeout(type, 750);
}
function openItem(row, item) {
  if (selected === row) {
    if (!preview.hidden) window.open(item.url, '_blank', 'noopener,noreferrer');
  } else showPreview(row, item);
}
function renderDirectory() {
  updateStage();
  directory.scrollTop = 0;
  if (reduced.matches) requestAnimationFrame(fitWindow);
  // Preserve folder buttons so their chevrons can transition between states.
  if (directory.children.length) {
    FILES_DATA.forEach((folder, folderIndex) => {
      directory.querySelector(`[data-folder="${folderIndex}"]`).setAttribute('aria-expanded', String(openFolder === folderIndex));
      document.querySelector(`#folder-${folderIndex}`).hidden = openFolder !== folderIndex;
      updateWindow(folderIndex, windowStarts.get(folderIndex) || 0);
    });
    return;
  }
  directory.replaceChildren();
  FILES_DATA.forEach((folder, folderIndex) => {
    const section = document.createElement('section');
    section.className = 'folder';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'directory-row folder-button';
    button.textContent = folder.label;
    button.dataset.folder = folderIndex;
    button.setAttribute('aria-expanded', String(openFolder === folderIndex));
    button.setAttribute('aria-controls', `folder-${folderIndex}`);
    button.addEventListener('click', () => {
      clearPreview();
      openFolder = openFolder === folderIndex ? null : folderIndex;
      windowStarts.set(folderIndex, 0);
      windowSize = maxWindowSize;
      renderDirectory();
      highlight(directory.querySelector(`[data-folder="${folderIndex}"]`), true);
    });
    section.append(button);
    const list = document.createElement('ul');
    list.id = `folder-${folderIndex}`;
    list.className = 'folder-items';
    list.hidden = openFolder !== folderIndex;
    folder.items.forEach((item, index) => {
      const li = document.createElement('li');
      li.style.setProperty('--order', index);
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'directory-row file-button';
      row.textContent = item.label;
      row.dataset.parent = folderIndex;
      row.dataset.index = index;
      row.setAttribute('aria-pressed', 'false');
      row.addEventListener('click', () => showPreview(row, item));
      row.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          if (!event.repeat) openItem(row, item);
        }
      });
      li.append(row); list.append(li);
    });
    if (!folder.items.length) {
      const empty = document.createElement('li');
      empty.textContent = 'No files added yet.';
      empty.style.fontSize = '.8rem';
      list.append(empty);
    }
    for (const direction of ['up', 'down']) {
      const control = document.createElement('li');
      control.className = 'list-more';
      control.dataset.direction = direction;
      const arrow = document.createElement('button');
      arrow.type = 'button';
      arrow.className = 'list-more-button';
      arrow.textContent = direction === 'up' ? '↑' : '↓';
      arrow.setAttribute('aria-label', direction === 'up' ? 'Previous items' : 'More items');
      arrow.addEventListener('click', () => {
        const start = windowStarts.get(folderIndex) || 0;
        updateWindow(folderIndex, start + (direction === 'up' ? -windowSize : windowSize));
        const next = list.querySelector(`.file-button[data-index="${windowStarts.get(folderIndex)}"]`);
        highlight(next, true);
        status.textContent = `Showing items ${windowStarts.get(folderIndex) + 1}–${Math.min(folder.items.length, windowStarts.get(folderIndex) + windowSize)} of ${folder.items.length}.`;
      });
      control.append(arrow);
      if (direction === 'up') list.prepend(control); else list.append(control);
    }
    section.append(list); directory.append(section);
    updateWindow(folderIndex, windowStarts.get(folderIndex) || 0);
  });
  rows().forEach(row => {
    row.tabIndex = -1;
    row.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') highlight(row); });
    // Keep the keyboard cursor, but let pointer emphasis fade away on exit.
    row.addEventListener('pointerleave', event => {
      if (event.pointerType === 'mouse') row.classList.remove('is-highlighted');
    });
    row.addEventListener('focus', () => highlight(row));
    row.addEventListener('transitionend', positionConnector);
  });
}
directory.addEventListener('keydown', event => {
  // Include windowed-out items in keyboard order, but not closed folders' items.
  const visible = rows().filter(row => row.classList.contains('folder-button') || Number(row.dataset.parent) === openFolder);
  const index = visible.indexOf(highlighted);
  if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? visible.length - 1
      : Math.max(0, Math.min(visible.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)));
    highlight(visible[next], true);
  }
});
addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (selected) {
    const previous = selected;
    clearPreview(); highlight(previous, true);
  } else if (openFolder !== null) {
    const previous = openFolder;
    openFolder = null; renderDirectory();
    highlight(directory.querySelector(`[data-folder="${previous}"]`), true);
  }
});
directory.addEventListener('scroll', positionConnector, { passive: true });
directory.addEventListener('transitionend', event => {
  positionConnector();
  if (event.target === directory && event.propertyName === 'transform') fitWindow();
});
addEventListener('resize', () => { positionConnector(); fitWindow(); });
document.fonts.ready.then(positionConnector);
renderDirectory();
highlight(rows()[0], true);
