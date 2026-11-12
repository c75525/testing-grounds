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
const rows = () => [...directory.querySelectorAll('.directory-row')];
function highlight(row, focus = false) {
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
}
function positionConnector() {
  if (!selected || preview.hidden) return;
  const label = selected.getBoundingClientRect();
  const target = preview.getBoundingClientRect();
  const parent = document.querySelector('.files-page').getBoundingClientRect();
  const viewport = directory.getBoundingClientRect();
  connector.style.visibility = label.top < viewport.top || label.bottom > viewport.bottom ? 'hidden' : 'visible';
  connector.style.left = `${label.right - parent.left + 8}px`;
  connector.style.top = `${label.top + label.height / 2 - parent.top}px`;
  connector.style.width = `${Math.max(0, target.left - label.right - 24)}px`;
}
function showPreview(row, item) {
  clearPreview();
  selected = row;
  row.classList.add('is-selected');
  row.setAttribute('aria-pressed', 'true');
  const token = generation;
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
  if (selected === row) window.open(item.url, '_blank', 'noopener,noreferrer');
  else showPreview(row, item);
}
function renderDirectory() {
  document.querySelector('.files-page').classList.toggle('is-folder-overview', openFolder === null);
  directory.scrollTop = 0;
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
    section.append(list); directory.append(section);
  });
  rows().forEach(row => {
    row.tabIndex = -1;
    row.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') highlight(row); });
    row.addEventListener('focus', () => highlight(row));
    row.addEventListener('transitionend', positionConnector);
  });
}
directory.addEventListener('keydown', event => {
  const visible = rows().filter(row => !row.closest('[hidden]'));
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
directory.addEventListener('transitionend', positionConnector);
addEventListener('resize', positionConnector);
document.fonts.ready.then(positionConnector);
renderDirectory();
highlight(rows()[0], true);
