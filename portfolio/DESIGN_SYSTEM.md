# Samuel Plattten — Portfolio Design System

## Purpose

An image-led portfolio of professionally demonstrative creative projects. It supports Samuel Plattten’s public artist identity and applications for multimedia design, web-development, and branding roles.

## Visual system

- Background: `#000000`.
- Primary/body text: `#fffbef`.
- Portfolio name: `#fffbcf`.
- Type: locally hosted Areal variable font (`assets/fonts/ABCArealVariable.ttf`) for all typography.
- No decoration, cards, rounded containers, gradients, or icons.

## Layout

- Desktop content width: `min(100% - 48px, 1080px)`.
- Header uses two columns: “Works by” and `Samuel Plattten`.
- Projects form a vertically spaced two-column grid. On desktop, a large mockup frame and its centered Areal regular-italic title occupy the left column; the project description aligns in the right column. Project titles and descriptions use the same type size. Each title links to its live site. Mobile stacks mockup, title, then description.
- Standard mockup frame ratio is `16:9`; the S.A.I.A. frame uses its native `1.678:1` ratio.

## Project slideshows

- Each project begins on the first image in its ordered source list.
- A project with multiple images cross-fades to the next image every 10 seconds using a 1200ms opacity transition, looping in order.
- A single-image project remains static.
- c75525.org’s third slide layers the supplied `c75525_stroke.svg` over its laptop-screen background. It uses the current Stroke Dotter configuration: `32px` dash, `25px` gap, `29px/s`, forward direction, white round-capped `0.75px` stroke. The SVG is scaled to 43% of the mockup width and centered at the laptop display’s visual center (`50%` horizontal, `47%` vertical).
- With `prefers-reduced-motion: reduce`, each project stays on its first image.

## Media convention

- Source mockups are preserved locally and ignored under `media/incoming/archive/`.
- Published images are responsive WebP derivatives in `media/processed/`, with 960px and 1600px widths. The animated c75525 SVG is a separate local asset in `assets/c75525-stroke.svg`.
- Each displayed image has `srcset`, `sizes`, and intrinsic dimensions.
