const page = document.querySelector('.meetings-page');
const scroller = document.querySelector('.meeting-scroller');
// Captions and artwork titles verified against the public Instagram archive.
const verifiedMetadata = {
  '023': {
    title: "TASCHEN'S 1000 FAVORITE WEBSITES",
    description: "From 2003, a book of ‘1000 of today’s very best websites in the areas of advertising, architecture, art design, digital, erotic, illustration, movies, fashion, photography, and more.’ Bring your laptop! Per the book’s recommendation, we’ll be surfing through the picks together to get a glimpse into the role and utility of a website.",
    link: 'https://www.instagram.com/internetarchaeology/p/Dd69jnkS8BB/'
  },
  '022': {
    title: 'WE LIVE IN PUBLIC - A FILM SCREENING',
    description: '“We Live In Public is a 2009 documentary film by Ondi Timoner about Internet pioneer Josh Harris, indirectly highlighting the loss of privacy in the Internet age.” Join us tonight for the first ever S.A.I.A. film screening and discussion tonight.',
    link: 'https://www.instagram.com/internetarchaeology/p/DdpD7wchFsi/'
  },
  '021': {
    title: 'WIKIPEDIA SHOW & TELL',
    description: 'The free encyclopedia. It’s your job to find an article to share. Maybe the start of a research bender that Wikipedia facilitated, or an article with an unorthodox backstory. Perhaps a piece with a photo you gravitate towards.',
    link: 'https://www.instagram.com/internetarchaeology/p/DdRnf_hKyIL/'
  },
  '020': {
    title: 'RHIZOMAL',
    description: 'Today we are talking Rhizome, one of the web’s longest-running spaces dedicated to digital art, internet culture, and preserving the strange, experimental history of life online. We’ll dig through the archive, look at some seminal works of net art, and talk about what happens when the internet itself becomes the medium.',
    arena: 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-two-zero-vhzuuorxvau',
    link: 'https://www.instagram.com/internetarchaeology/p/DczXZUnvyZG/'
  },
  '019': {
    title: 'FESTIVAL SEASON',
    description: 'Social Anthropology Internet Archaeology, now officially a 501(c)(3) non-profit, has been given the opportunity to table at the @localfirstaz Arizona Fall Fest via @gridphx. Our involvement is currently in the brainstorming process and we’d like your input.',
    link: 'https://www.instagram.com/internetarchaeology/p/DcR7DKTPGSP/'
  },
  '018': {
    title: 'UNRESTRICTED HAMMERSPACE',
    description: 'This upcoming Wednesday we’ll be speaking about creating opportunities in the intangible. When confronted with a desert of galleries, inequitable access to spaces, and a lack of budget, there is still hope. Lead by @c75525.',
    link: 'https://www.instagram.com/internetarchaeology/p/DcKl_N3qDD8/'
  },
  '017': {
    title: 'OPEN DISCUSSION',
    description: 'Talk about the internet. Or something happening to you (or somebody else) because of the internet. In an art way, or anthropological way, or whatever you would-like-to-way.',
    link: 'https://www.instagram.com/internetarchaeology/p/DboxSX0v8Me/'
  },
  '016': {
    title: 'AESTHETICS OF TROLLING',
    description: 'From childish pranks, to the peculiar discourse of anonymous message boards, to a shadowy and subversive ideology. By the end of the decade, the canon of images and icons associated with the “lulz” enter into artistic practice.',
    link: 'https://www.instagram.com/internetarchaeology/p/DbXAUBdqN4A/'
  },
  '015': {
    title: 'DIGITAL REMIXING WORKSHOP',
    description: 'A workshop on how to remix, alter, and augment digital materials into art.',
    link: 'https://www.instagram.com/internetarchaeology/p/Day9sdLqss_/'
  },
  '014': {
    title: 'CLUB MATTERS',
    description: 'For our fourteenth meeting, the club will look inwards — where do we go next? Structure, ritual, events, fundraising, activities, and any other proposals are on the table. We encourage you to come by and have a say.',
    link: 'https://www.instagram.com/internetarchaeology/p/DaBgCi7S4c7/'
  },
  '013': {
    title: 'SHOW + TELL WHATEVER',
    description: 'Bring a link. Bring a video. Some art. A story. Empty-handed and open-hearted. We’re easygoing. Feel free to drop any content you want to present in the dedicated 013 channel on our Are.na.',
    link: 'https://www.instagram.com/internetarchaeology/p/DZ8OPf8yKzc/'
  },
  '012': {
    title: 'PIXEL PROFIT',
    description: 'This week we’re talking digital assets, injected economies, and exchange rates with a presentation by @ethan.website.',
    link: 'https://www.instagram.com/internetarchaeology/p/DZp_CgNqhur/'
  },
  '011': {
    title: 'ARCHIPELAGIC IDEATION',
    description: 'At long last! We are covering the beloved online tool & platform @aredotina — with a much anticipated presentation by the site’s patron saint, @youlikemodernart.',
    link: 'https://www.instagram.com/internetarchaeology/p/DZON5OzveDd/'
  },
  '010': {
    title: 'ONLINE DISINHIBITION EFFECT',
    description: 'An open discussion on the Online Disinhibition Effect. You’ve probably been affected.',
    link: 'https://www.instagram.com/internetarchaeology/p/DZGrVXkKA9j/'
  },
  '009': {
    title: 'SLOP MACHINE',
    description: 'A presentation & discussion on brain rot + dadaism. The “enShitification” of tech and software.',
    link: 'https://www.instagram.com/internetarchaeology/p/DY0kWS8KroU/'
  },
  '008': {
    title: 'YOUTUBE SHOW & TELL',
    description: 'Moved from the 10th to the 17th. This week has a couple instructions.',
    link: 'https://www.instagram.com/internetarchaeology/p/DYGJpaWD0xs/'
  }
};
// Numbered Are.na channels linked from the S.A.I.A. hub. Meeting 027 does
// not have a numbered channel published yet, so it intentionally stays hidden.
const arenaLinks = {
  '001': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-zero-one-lu6dplv7fqe',
  '002': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-zero-two-3z-tapg0s7y',
  '003': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-zero-three-axpqiyuymt0',
  '004': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-zero-four-svxodjgpvug',
  '005': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-zero-five-txf6znoe_2y',
  '006': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-zero-six-waw_evzebhi',
  '007': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-zero-seven-qyjwuwf9rgy',
  '008': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-zero-eight-aa7ev7afyt4',
  '009': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-zero-nine-mtdredegxag',
  '010': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-one-zero-ucnvcrk4xlq',
  '011': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-one-one-ubondb4ueck',
  '012': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-one-two-sgviiysdqks',
  '013': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-one-three-eo5xw2oytos',
  '014': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-one-four-l6ulqhw7jiy',
  '015': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-one-five-06wzje0mvt0',
  '016': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-one-six-zijc03bsqvi',
  '017': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-one-seven-sjk2bvshvkc',
  '018': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-one-eight-s14mvjeahiu',
  '019': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-one-nine-wwyfeck_upu',
  '020': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-two-zero-vhzuuorxvau',
  '021': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-two-one-axtefl83cr4',
  '022': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-two-two-neqr-nohua8',
  '023': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-two-three-5qjrxcfaoas',
  '024': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-two-four-zdhz3ete2ji',
  '025': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-two-five-owaecilusuq',
  '026': 'https://www.are.na/s-a-i-a-p6eg8zx1sme/zero-two-six-shnovenludu',
};
const template = scroller.querySelector('.meeting-card');
for (let number = 23; number >= 1; number -= 1) {
  const card = template.cloneNode(true);
  const label = String(number).padStart(3, '0');
  card.classList.remove('is-selected');
  card.setAttribute('aria-pressed', 'false');
  const metadata = verifiedMetadata[label];
  Object.assign(card.dataset, {
    number: label,
    title: metadata?.title ?? 'Filler Meeting Title',
    description: metadata?.description ?? `Filler description for meeting ${label}. Archive content and imagery to be supplied.`,
    linkLabel: metadata ? 'Instagram post' : 'meeting notes',
    link: metadata?.link ?? `#meeting-${label}`,
    arena: metadata?.arena ?? arenaLinks[label] ?? '',
  });
  const title = metadata?.title ?? 'Filler Meeting Title';
  card.querySelector('.meeting-card__title').textContent = `${label} - ${title}`;
  card.querySelector('.visually-hidden').textContent = `Meeting ${label}: ${title}`;
  const art = card.querySelector('.archive-art');
  art.className = `archive-art archive-art--${['floral', 'street', 'map'][number % 3]}`;
  art.replaceChildren();
  scroller.append(card);
}
const cards = [...document.querySelectorAll('.meeting-card')];
// Use the preserved archive images; 001–005 are temporary color placeholders.
cards.forEach(card => {
  card.dataset.arena = card.dataset.arena || arenaLinks[card.dataset.number] || '';
  const art = card.querySelector('.archive-art');
  card.querySelectorAll('.archive-art').forEach((item, index) => { if (index > 0) item.remove(); });
  art.className = 'archive-art';
  art.style.backgroundImage = '';
  art.replaceChildren();
  const image = document.createElement('img');
  image.src = `./assets/meetings/optimized/${card.dataset.number}.webp`;
  image.alt = `Meeting ${card.dataset.number} artwork`;
  image.decoding = 'async';
  image.loading = card.dataset.number === '027' ? 'eager' : 'lazy';
  image.fetchPriority = card.dataset.number === '027' ? 'high' : 'auto';
  art.append(image);
});
// Keep the composition fixed in the viewport; gestures and wheel input drive the archive.
page.style.height = '100svh';
const detail = document.querySelector('.meeting-detail');
const description = detail.querySelector('.meeting-detail__description');
const arenaLink = detail.querySelector('.meeting-detail__arena-link');
const link = detail.querySelector('.meeting-detail__instagram-link');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let activeIndex = -1;
let queued = false;

// Square Jump-style discrete navigation: one adjacent item, 550ms cubic easing.
let settledStep = 0;
let position = 0;
let isSnapping = false;
let snapFrame;
let touchStartY = null;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const cubicInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Continuous logarithmic spiral: foreground at zero, tightening hook in the distance.
// Keep photographs upright; their positions and sizes describe the spiral.
function pose(relative) {
  // Departing images grow toward the viewer and curl into the lower-left crop.
  // At one step behind: 1.65× size, with its top about 1.175 card heights lower
  // after accounting for the left-center transform origin.
  if (relative < 0) {
    const distance = -relative;
    return [
      -(0.615 * distance + 1.185 * distance * distance),
      0.722 * distance + 0.778 * distance * distance,
      1 + 0.65 * distance,
    ];
  }
  const radius = Math.exp(-relative * 0.30);
  const angle = relative * 0.76;
  const x = 1.80 * (1 - radius * Math.cos(angle));
  const y = -0.95 * radius * Math.sin(angle);
  const scale = Math.exp(-relative * 0.38);
  return [x, y, scale];
}
function select(index) {
  if (index === activeIndex) return;
  activeIndex = index;
  cards.forEach((card, i) => {
    card.classList.toggle('is-selected', i === index);
    card.setAttribute('aria-pressed', String(i === index));
  });
  const card = cards[index];
  description.textContent = card.dataset.description;
  // Archive destinations are pending; don't present invented notes as real links.
  arenaLink.hidden = !card.dataset.arena;
  arenaLink.href = card.dataset.arena || '#';
  link.hidden = !card.dataset.link.startsWith('https:');
  link.href = card.dataset.link;
  link.textContent = card.dataset.linkLabel;
}
function render() {
  queued = false;
  const selected = clamp(Math.round(position), 0, cards.length - 1);
  const width = cards[0].offsetWidth;
  const height = cards[0].offsetHeight;
  cards.forEach((card, index) => {
    const relative = index - position;
    const [x, y, scale] = pose(relative);
    card.style.transform = `translate3d(${x * width}px, ${y * height}px, 0) scale(${scale})`;
    card.style.opacity = '1';
    // The archive viewport clips departing cards naturally at the page edge.
    card.style.pointerEvents = relative < -1 ? 'none' : 'auto';
    card.style.zIndex = String(100 - Math.round(Math.abs(relative) * 10));
  });
  select(selected);
}
function scheduleRender() {
  if (!queued) { queued = true; requestAnimationFrame(render); }
}
function goTo(index) {
  if (isSnapping) return;
  const target = clamp(index, 0, cards.length - 1);
  const start = position;
  if (Math.abs(target - start) < 0.001) { settledStep = target; return; }
  const duration = reducedMotion.matches ? 0 : 550;
  const started = performance.now();
  isSnapping = true;
  function tick(now) {
    const t = duration ? clamp((now - started) / duration, 0, 1) : 1;
    position = start + (target - start) * cubicInOut(t);
    render();
    if (t < 1) snapFrame = requestAnimationFrame(tick);
    else {
      position = target;
      settledStep = target;
      isSnapping = false;
    }
  }
  snapFrame = requestAnimationFrame(tick);
}
cards.forEach((card, index) => {
  card.addEventListener('keydown', event => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? cards.length - 1
      : Math.max(0, Math.min(cards.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)));
    goTo(next);
    cards[next].focus({ preventScroll: true });
  });
});
addEventListener('wheel', event => {
  if (event.ctrlKey || Math.abs(event.deltaY) < 1) return;
  event.preventDefault();
  if (!isSnapping) goTo(settledStep + Math.sign(event.deltaY));
}, { passive: false });
addEventListener('touchstart', event => {
  touchStartY = event.touches.length === 1 ? event.touches[0].clientY : null;
}, { passive: true });
addEventListener('touchmove', event => {
  if (touchStartY !== null) event.preventDefault();
}, { passive: false });
addEventListener('touchend', event => {
  if (touchStartY === null || !event.changedTouches.length) return;
  const delta = touchStartY - event.changedTouches[0].clientY;
  touchStartY = null;
  if (Math.abs(delta) > 30) goTo(settledStep + Math.sign(delta));
}, { passive: true });
addEventListener('resize', () => {
  cancelAnimationFrame(snapFrame);
  isSnapping = false;
  scheduleRender();
});
reducedMotion.addEventListener('change', scheduleRender);
document.fonts.ready.then(scheduleRender);
render();
