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

- The page is a centered five-column composition: **flexible outer gutter / 10% directory / 80% main content / 10% context / flexible outer gutter**.
- The inner three-column content region has a maximum width of `1600px`, a minimum `24px` gutter on each side, and `clamp(24px, 4vw, 72px)` vertical padding. On screens wider than 1648px, the unused viewport width becomes equal left/right outer gutters.
- The middle and context columns share no artificial gutter; the right column receives internal left padding of `clamp(14px, 1.5vw, 28px)`.
- Middle-column case-study content is centered and capped at `720px`; project titles sit 20px below their frame.
- Page rows are separated by `clamp(96px, 11vw, 180px)`.

## Directory interaction and motion

- Directory labels: In-house and Freelance only. Project names remain in page content.
- Freelance is the default active page.
- Clicking a directory title selects and scrolls to its page.
- Arrow Up/Down moves directory selection. Enter activates and scrolls to the highlighted section.
- The identity fades upward first. Then the directory trunk draws down, branches draw outward, and section labels fade from the left. Active directory branch and title use `#fffbcf`.
- Active-page elements then reveal top-to-bottom with upward fade-in. All prescribed transitions use `ease-in` timing.

## Content

- Freelance contains c75525.org, samuelplatten.com, and saia.center. Each project title links to its live site.
- Project mockups cross-fade every 10 seconds; reduced-motion users receive the first image only.
- c75525.org’s third slide layers the supplied `c75525_stroke.svg` over its laptop-screen background using the saved Stroke Dotter settings: `32px` dash, `25px` gap, `29px/s`, forward direction, and a `0.75px` white round-capped stroke.
- In-house begins with a temporary Alcor Life Extension Foundation case study using placeholder squares. Its Context and Approach copy is transcribed from the supplied markup and should be replaced or corrected against source copy when available.

## Typesetting

- Running copy uses Areal with kerning, common ligatures, and contextual alternates enabled.
- Prose targets a maximum measure of `min(62ch, 640px)`, `1.55` line height, `text-wrap: pretty`, and no automatic hyphenation. The approved 10% context column remains the actual limiting measure on desktop, so it is materially narrower than the preferred 45–75-character range; widening it requires an explicit grid decision.
- Headings use `text-wrap: balance`.
- Final two words in context paragraphs are joined with a nonbreaking space as an orphan backstop. Meaningful compounds use U+2011 nonbreaking hyphens where needed.

## Responsive behavior

- At 760px and below, the layout stacks: directory, project media, title, then context.
- Header and content text center-align on mobile.
- `prefers-reduced-motion: reduce` removes motion and keeps the initial slide visible.

## Media convention

- Source mockups remain local and ignored under `media/incoming/archive/`.
- Published images use 960px and 1600px responsive WebP derivatives in `media/processed/` with `srcset`, `sizes`, and intrinsic dimensions.
