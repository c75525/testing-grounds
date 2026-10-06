# Samuel Plattten — Portfolio Design System

## Source authority

The supplied directory/UI markups are authoritative for hierarchy, column structure, spacing intent, and animation sequence. Ask before intentionally deviating from them.

## Visual system

- Background: `#000000`.
- Body/copy: `#e1ede8`.
- Samuel Plattten name, selected directory entry, and project-site titles: `#fffbcf`.
- Typography: locally hosted Areal variable font (`assets/fonts/ABCArealVariable.ttf`).
- No decorative cards, gradients, or rounded interface controls. Temporary In-house placeholder frames are intentionally plain outlined squares.

## Desktop grid and spacing

- The page is a centered five-column composition: **flexible outer gutter / 10% directory / 65% main content / 25% context / flexible outer gutter**.
- The inner three-column content region has a maximum width of `1600px`, a minimum `24px` gutter on each side, and `clamp(24px, 4vw, 72px)` vertical padding. On screens wider than 1648px, the unused viewport width becomes equal left/right outer gutters.
- The middle and context tracks are separated by an explicit responsive grid gutter of `clamp(14px, 1.5vw, 28px)`; neither column uses spacing padding to simulate a gutter.
- Middle-column case-study content is centered and capped at `720px`; project titles sit 20px below their frame.
- Page rows are separated by `clamp(96px, 11vw, 180px)`.

## Directory interaction and motion

- Directory labels: In-house and Freelance only. Project names remain in page content.
- Freelance is the default active page.
- Clicking a directory title selects and scrolls to its page.
- Arrow Up/Down moves directory selection. Enter or click activates the highlighted section and returns the document to the top of the page.
- When selection changes, the active label springs `12px` to the right while the former label springs back to its resting position. Labels are aligned to their branch coordinates, with a 2px upward optical correction on Freelance to compensate for Areal’s visible glyph position inside its line box. The motion uses a locally bundled `pmndrs/math` under-damped scalar spring (`0.22s` smooth time, `0.58` damping ratio); reduced-motion users receive the final offsets immediately.
- The identity fades upward first. Then the directory trunk draws down, branches draw outward, and section labels fade from the left. Active directory branch and title use `#fffbcf`.
- Active-page elements then reveal top-to-bottom with upward fade-in. All prescribed transitions use `ease-in` timing.

## Content

- Freelance contains c75525.org, samuelplatten.com, and saia.center. Each project title links to its live site.
- Project mockups cross-fade every 10 seconds; reduced-motion users receive the first image only.
- c75525.org’s third slide layers the supplied `c75525_stroke.svg` over its laptop-screen background using the saved Stroke Dotter settings: `32px` dash, `25px` gap, `29px/s`, forward direction, and a `0.75px` white round-capped stroke.
- In-house begins with a temporary Alcor Life Extension Foundation case study using placeholder squares. Its Context and Approach copy is transcribed from the supplied markup and should be replaced or corrected against source copy when available.

## Typesetting

- Running copy uses Areal with kerning, common ligatures, and contextual alternates enabled.
- Prose targets a maximum measure of `min(62ch, 640px)`, `1.55` line height, `text-wrap: pretty`, and no automatic hyphenation. The 25% context track provides approximately 390px at the 1600px shell maximum, approaching the lower bound of the preferred 45–75-character range at the approved type size.
- Longer descriptions are divided into logical paragraphs rather than forced into a single dense block.
- Headings use `text-wrap: balance`.
- Final two words in context paragraphs are joined with a nonbreaking space as an orphan backstop. Meaningful compounds use U+2011 nonbreaking hyphens where needed.

## Responsive behavior

- At 760px and below, the layout stacks: directory, project media, title, then context.
- Header and content text center-align on mobile.
- `prefers-reduced-motion: reduce` removes motion and keeps the initial slide visible.

## Media convention

- Source mockups remain local and ignored under `media/incoming/archive/`.
- Published images use 960px and 1600px responsive WebP derivatives in `media/processed/` with `srcset`, `sizes`, and intrinsic dimensions.
