# Portfolio Performance Audit

**Date:** 2026-09-29

## Source inventory

Six supplied PNG mockups measured approximately 7,998–8,001px wide. Serving those source images would be needlessly expensive for portfolio frames.

## Delivery decision

- Original PNGs are retained locally in ignored `media/incoming/archive/`.
- Published derivatives are WebP at 960px and 1600px widths, selected with `srcset` and `sizes`.
- Published derivative transfer total: approximately 253 KB across 14 files, including the third c75525 laptop-background slide and replacement S.A.I.A. poster slides.
- All image boxes have fixed aspect ratios and intrinsic image dimensions to prevent layout shift.
- The three first-visible project images load normally; alternate slideshow images are small responsive derivatives and remain layered, ready for their timed transition.

## Residual risks

- Projects added later must follow the same responsive-derivative workflow.
- Images with a different intended crop/aspect ratio need an explicit frame-ratio decision before publishing.
