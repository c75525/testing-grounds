# Stroke Dotter — Design System

## Purpose

Stroke Dotter is a local, browser-based SVG utility for previewing a moving dotted stroke. Users can import an SVG, adjust the dash pattern, and control its motion without uploading the file anywhere.

## Layout

- Shared test-site background: `#fffbcf`.
- Single-column layout, maximum content width `1120px`, with a `1px` black divider system.
- The preview uses the available width and retains the imported SVG's `viewBox`.
- Controls appear before the preview so their values are available before visual interaction.

## Type and controls

- Typography: Arial/Helvetica system sans-serif.
- Buttons are text-only rectangles: transparent background, `1px` black border, square corners. Hover/pressed states invert to black with the page background as text.
- Sliders use native browser range controls and their exact current values appear beside each label.
- Export color fields accept six-digit hexadecimal web colors (`#RRGGBB`), with a 24px square swatch that reflects each valid value. The background field also themes the entire site and preview in real time. Relative luminance determines whether body text is `#111111` or white, selecting the higher-contrast option.

## SVG and animation behavior

- Supported drawable SVG primitives are `path`, `line`, `polyline`, `polygon`, `rect`, `circle`, and `ellipse`.
- Imported shapes are rendered as a black outline with `fill: none`, `1.5px` round-capped strokes, and a non-scaling stroke. The thinner outline and longer dash segments make the motion read as a curved dashed line rather than large dots.
- **Dash length** and **gap length** use CSS/SVG pixel (`px`) units.
- **Speed** is expressed in `px/s`: SVG user units advanced each second. In normal SVG usage these map directly to CSS pixels.
- The animation changes `stroke-dashoffset` in a `requestAnimationFrame` loop. Direction flips the sign of that offset progression.
- Defaults: dash `16px`, gap `10px`, speed `48px/s`, forward direction.
- Reduced-motion users start paused; their stroke offset is visually fixed at zero.

## MP4 export

- Export is a deterministic 2-second AV1 MP4 at **1927 × 1158px** and **60fps** (120 rendered frames), with exactly **30px** padding at the left/right and **20px** at the top/bottom. The selected export background fills that padding. AV1 is used because the requested 1927px width is odd; H.264/AVC 4:2:0 encoding requires both dimensions to be even.
- It renders the current imported SVG with the current dash, gap, speed, direction, background color, and stroke color settings—not a screen recording.
- The browser encodes locally through WebCodecs via the locally vendored Mediabunny MP4 writer. Export requires a current Chromium-based browser with WebCodecs support; no SVG or video data is uploaded.

## Safety and accessibility

- SVG files are read locally in the browser. Before display, scripting and embedded active content are removed.
- The MP4 encoder is loaded only when Export MP4 is selected; it is locally vendored rather than loaded from a third-party CDN.
- All actions are native buttons with visible keyboard focus states. Slider values are exposed as associated output text, and import status is announced through a live region.
