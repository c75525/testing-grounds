# Portfolio Performance Audit

**Date:** 2026-10-05

## Source inventory

Six supplied PNG mockups measured approximately 7,998–8,001px wide. Serving those source images would be needlessly expensive for portfolio frames.

## Delivery decision

- Original PNGs are retained locally in ignored `media/incoming/archive/`.
- Published derivatives are WebP at 960px and 1600px widths, selected with `srcset` and `sizes`.
- The processed inventory is approximately 1.79 MB across 44 WebPs. The 28 Alcor derivatives contribute approximately 1.43 MB and include two lossless native-resolution single-phone crops for mobile. Two additional S.A.I.A. phone crops (960px and 1600px) preserve Retina detail from the 7999px archived original while avoiding delivery of its padded full canvas.
- Alcor landscape and square mockups publish at 960px and 1600px; Instagram posts publish at 480px and 960px because their rendered card width is approximately 300px.
- All image boxes have fixed aspect ratios and intrinsic image dimensions to prevent layout shift.
- The three first-visible project images load normally; alternate slideshow images are small responsive derivatives and remain layered, ready for their timed transition.

## Residual risks

- Projects added later must follow the same responsive-derivative workflow.
- Images with a different intended crop/aspect ratio need an explicit frame-ratio decision before publishing.
