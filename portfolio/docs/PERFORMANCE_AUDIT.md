# Portfolio Performance Audit

**Date:** 2026-10-05

## Source inventory

Six supplied PNG mockups measured approximately 7,998–8,001px wide. Serving those source images would be needlessly expensive for portfolio frames.

## Delivery decision

- Original PNGs are retained locally in ignored `media/incoming/archive/`.
- Published derivatives are WebP at 960px and 1600px widths, selected with `srcset` and `sizes`.
- The processed inventory is approximately 1.55 MB across 40 WebPs. The 26 Alcor derivatives contribute approximately 1.29 MB and cover six landscape slideshow images, two square Patience tee images, plus five Instagram stack images.
- Alcor landscape and square mockups publish at 960px and 1600px; Instagram posts publish at 480px and 960px because their rendered card width is approximately 300px.
- All image boxes have fixed aspect ratios and intrinsic image dimensions to prevent layout shift.
- The three first-visible project images load normally; alternate slideshow images are small responsive derivatives and remain layered, ready for their timed transition.

## Residual risks

- Projects added later must follow the same responsive-derivative workflow.
- Images with a different intended crop/aspect ratio need an explicit frame-ratio decision before publishing.
