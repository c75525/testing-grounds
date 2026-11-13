# Idle logo rendering — 2026-11-13

## Scope and baseline
User reports occasional idle rotation stutter on mobile. Audited deployed Home at commit a608648 and local source. Assets, fonts, geometry detail, pixel ratios and layout are unchanged; this audit targets continuous rendering rather than transfer size.

Observed source costs: two per-frame array spreads; full-canvas secondary rendering despite a heading-only CSS glyph mask; hidden entrance line objects and GPU buffers retained indefinitely.

Deployed baseline: headless Edge, 393×852, DPR 2, six seconds after session-skipped entrance: 600 frame intervals, median 10ms, p95 10.1ms, max 10.2ms, zero intervals above 33.4ms. The reported intermittent device-specific hitch was not reproduced in this environment.

## Changes
- Cache combined stroke list rather than allocating it twice per frame.
- Remove and dispose entrance-only line geometry/materials on completion (also when skipped).
- Scissor the secondary renderer to padded heading bounds. Preserve full viewport projection, glyph mask, antialiasing, model geometry, both material passes and rotation speed.
- No quality downgrade or font/layout change.

## Validation
- Local optimized run under same viewport/DPR and six-second sampling: 600 intervals, p95 10.1ms, max 10.2ms, zero intervals above 33.4ms. No measured frame-rate improvement claimed because baseline already met cadence.
- Fixed-angle before/after screenshots: mobile PNG byte-identical; desktop difference confined to 167 antialiased pixels within the wordmark, with no composition changes.
- Existing entrance tests pass at 390/1440, including tab-session replay skipping, reduced motion and no page errors.
- Color-fade regression tests pass at 320/393/1440: all four materials remain opaque/depth-writing, continuous color interpolation, full-width mobile gray field intact.

## Residual risk
Headless Windows Edge is not iPhone Safari. Reduced redundant GPU work and allocation churn address plausible contributors but do not prove elimination of the user's occasional hitch. If it persists, profile the affected device (Safari Web Inspector, frame timeline/thermal conditions) before further quality or renderer changes.
