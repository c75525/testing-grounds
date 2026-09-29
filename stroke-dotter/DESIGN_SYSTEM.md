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

## SVG and animation behavior

- Supported drawable SVG primitives are `path`, `line`, `polyline`, `polygon`, `rect`, `circle`, and `ellipse`.
- Imported shapes are rendered as a black outline with `fill: none`, `3px` round-capped strokes, and a non-scaling stroke.
- **Dash length** and **gap length** use CSS/SVG pixel (`px`) units.
- **Speed** is expressed in `px/s`: SVG user units advanced each second. In normal SVG usage these map directly to CSS pixels.
- The animation changes `stroke-dashoffset` in a `requestAnimationFrame` loop. Direction flips the sign of that offset progression.
- Defaults: dash `8px`, gap `12px`, speed `48px/s`, forward direction.
- Reduced-motion users start paused; their stroke offset is visually fixed at zero.

## Safety and accessibility

- SVG files are read locally in the browser. Before display, scripting and embedded active content are removed.
- All actions are native buttons with visible keyboard focus states. Slider values are exposed as associated output text, and import status is announced through a live region.
