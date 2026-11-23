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
let previewClosingTimer = 0;
let folderEntrance = null;
let folderEntranceToken = 0;
function cancelFolderEntrance() {
  folderEntranceToken += 1;
  folderEntrance?.cancel();
  folderEntrance = null;
  document.querySelector('.files-page').classList.remove('is-folder-opening');
}
function fadeSpringFolder() {
  cancelFolderEntrance();
  if (reduced.matches) return;
  const page = document.querySelector('.files-page');
  const token = folderEntranceToken;
  // Change to the final browsing size while hidden; animate opacity/position,
  // never scale. Two frames allow layout and centering to settle first.
  page.classList.add('is-folder-opening');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (token !== folderEntranceToken) return;
    folderEntrance = page.animate([
      { opacity: 0, offset: 0 },
      { opacity: .9, offset: .65 },
      { opacity: 1, offset: 1 },
    ], { duration: 480, easing: 'ease-out', fill: 'both' });
    folderEntrance.onfinish = () => {
      if (token !== folderEntranceToken) return;
      page.classList.remove('is-folder-opening');
      folderEntrance.cancel();
      folderEntrance = null;
    };
  }));
}
const maxWindowSize = 8;
let windowSize = maxWindowSize;
function fitWindow() {
  const page = document.querySelector('.files-page');
  const style = getComputedStyle(page);
  const mobile = innerWidth <= 640;
  const closing = page.classList.contains('is-closing-preview');
  const width = page.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  let height = page.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  // Matches the established desktop preview proportion (48.5vw–83.5vw)
  // rather than capping an ultrawide display at a small fixed card.
  const previewWidth = mobile ? width : Math.min(width, Math.max(400, innerWidth * .35));
  const gap = mobile ? 20 : Math.min(64, width * .07);
  page.style.setProperty('--preview-width', `${previewWidth}px`);
  page.style.setProperty('--preview-gap', `${gap}px`);
  page.style.setProperty('--preview-height', `${preview.offsetHeight}px`);
  const closingBox = document.querySelector('.preview-panel').getBoundingClientRect();
  const occupiedWidth = selected ? previewWidth : closing ? closingBox.width : 0;
  const occupiedHeight = selected ? preview.offsetHeight : closing ? closingBox.height : 0;
  const availableWidth = (selected || closing) && !mobile ? width - occupiedWidth - gap : width;
  if ((selected || closing) && mobile) height -= occupiedHeight + gap;
  // CSS zoom participates in layout, unlike transform:scale. Thus the browser
  // always centers the actual current footprint, not an invisible oversized box.
  directory.style.setProperty('--directory-scale', 1);
  const activeList = openFolder === null ? null : document.querySelector(`#folder-${openFolder}`);
  const activeItems = activeList ? [...activeList.querySelectorAll('.file-button')] : [];
  // An empty folder is a single tertiary-level line, not a browsing panel.
  // Keep its 1× scale when leaving a selected file so Resources does not
  // inflate after the preview has begun its smooth close.
  const emptyFolder = openFolder !== null && activeItems.length === 0;
  let scale = selected || closing || emptyFolder ? 1 : openFolder === null ? (innerWidth <= 380 ? 2.5 : 3) : 2;
  scale = Math.min(scale, availableWidth / Math.max(1, directory.offsetWidth));
  if (openFolder !== null) {
    const list = activeList;
    const items = activeItems;
    if (items.length) {
      const rowHeight = items.find(item => !item.parentElement.hidden)?.offsetHeight || 27;
      const visibleCount = items.filter(item => !item.parentElement.hidden).length;
      const arrowStyle = getComputedStyle(list.querySelector('.list-more-button'));
      const arrowHeight = parseFloat(arrowStyle.lineHeight) + parseFloat(arrowStyle.paddingTop) + parseFloat(arrowStyle.paddingBottom);
      const missingArrows = [...list.querySelectorAll('.list-more')].filter(item => item.hidden).length;
      const overhead = directory.offsetHeight - visibleCount * rowHeight + missingArrows * arrowHeight;
      windowSize = Math.max(1, Math.min(maxWindowSize, Math.floor((height / scale - overhead) / rowHeight)));
      updateWindow(openFolder, windowStarts.get(openFolder) || 0);
      const cursor = selected || highlighted;
      if (cursor?.classList.contains('file-button') && Number(cursor.dataset.parent) === openFolder) revealRow(cursor);
    }
  }
  scale = Math.max(.1, Math.min(scale, height / Math.max(1, directory.offsetHeight)));
  directory.style.setProperty('--directory-scale', scale);
  page.classList.add('is-layout-ready');
  positionConnector();
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
  page.classList.toggle('is-previewing', selected !== null);
  document.querySelector('.preview-panel').inert = selected === null;
  requestAnimationFrame(fitWindow);
}
function highlight(row, focus = false) {
  revealRow(row);
  highlighted?.classList.remove('is-highlighted');
  highlighted = row;
  row?.classList.add('is-highlighted');
  rows().forEach(item => { item.tabIndex = item === row ? 0 : -1; });
  if (focus && row) {
    row.focus({ preventScroll: true });
    // Center the whole composition instead of scrolling individual rows.
  }
}
function clearPreview() {
  const page = document.querySelector('.files-page');
  const wasPreview = selected !== null;
  generation += 1;
  if (wasPreview && !reduced.matches) {
    clearTimeout(previewClosingTimer);
    page.classList.add('is-closing-preview');
    previewClosingTimer = setTimeout(() => {
      page.classList.remove('is-closing-preview');
      fitWindow();
    }, 500);
  }
  selected?.classList.remove('is-selected');
  selected?.setAttribute('aria-pressed', 'false');
  selected = null;
  preview.hidden = true;
  connector.classList.remove('is-drawing');
  updateStage();
}
let connectorFrame = 0;
function followConnector() {
  cancelAnimationFrame(connectorFrame);
  const end = performance.now() + (reduced.matches ? 0 : 550);
  function frame(now) {
    positionConnector();
    connectorFrame = now < end ? requestAnimationFrame(frame) : 0;
  }
  connectorFrame = requestAnimationFrame(frame);
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
  cancelFolderEntrance();
  clearPreview();
  const token = generation;
  previewLink.href = item.url;
  previewLink.setAttribute('aria-label', `Open ${item.label} in a new tab`);
  const thumbnail = typeof FILE_THUMBNAILS !== 'undefined' ? FILE_THUMBNAILS[item.url] : null;
  const source = thumbnail?.src || './assets/files/placeholder.svg';
  previewImage.onerror = () => {
    if (token !== generation || previewImage.getAttribute('src') !== source) return;
    previewImage.onerror = null;
    previewImage.src = './assets/files/placeholder.svg';
    previewImage.alt = `${item.label} — website preview unavailable`;
  };
  previewImage.alt = thumbnail ? `${item.label} — website screenshot` : `${item.label} — website preview unavailable`;
  previewImage.src = source;
  const imageReady = Promise.race([
    previewImage.decode().catch(() => {}),
    new Promise(resolve => setTimeout(resolve, 1500)),
  ]);
  const space = document.createElement('span');
  space.className = 'caption-space';
  space.textContent = item.description;
  space.setAttribute('aria-hidden', 'true');
  const typed = document.createElement('span');
  typed.className = 'caption-typed';
  typed.setAttribute('aria-hidden', 'true');
  caption.replaceChildren(space, typed);
  caption.setAttribute('aria-label', item.description);
  await imageReady;
  if (token !== generation || openFolder !== Number(row.dataset.parent)) return;
  clearTimeout(previewClosingTimer);
  document.querySelector('.files-page').classList.remove('is-closing-preview');
  selected = row;
  row.classList.add('is-selected');
  row.setAttribute('aria-pressed', 'true');
  preview.hidden = false;
  updateStage();
  fitWindow();
  followConnector();
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
      document.body.classList.remove('files-intro-ready');
      if (openFolder !== folderIndex) fadeSpringFolder();
      else cancelFolderEntrance();
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
        fitWindow();
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
  cancelFolderEntrance();
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
reduced.addEventListener('change', event => { if (event.matches) cancelFolderEntrance(); });
document.fonts.ready.then(fitWindow);
renderDirectory();
requestAnimationFrame(() => { document.querySelector('.files-page').classList.add('is-layout-ready'); highlight(rows()[0], true); });
Promise.resolve(window.saiaPageReady).then(() => document.body.classList.add('files-intro-ready'));
