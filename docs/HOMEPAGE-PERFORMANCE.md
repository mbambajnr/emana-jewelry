# Homepage image performance

The animated hero uses three photos. Its original JPEGs total approximately 1,162 KB. Pre-encoded WebP variants keep the same photos and framing, with 640, 960, and 1400 pixel widths. At the largest size, all three total approximately 320 KB; the 640 pixel candidates total approximately 98 KB. The browser chooses using `srcset`, viewport width, and display density, so small phones with dense displays may select a larger candidate.

The first photo has a matching responsive preload and high fetch priority. The loading poster and Remotion composition share the same image manifest to avoid fetching an optimized poster followed by the original JPEG. Subsequent slides remain part of the existing animation. The JavaScript animation bundle has not been removed or substantially reduced by this change.

Generated files have content hashes in their names and use one-year immutable caching. Replacing an original and regenerating creates new URLs. Original JPEGs remain checked in as source material and are not requested by the slideshow.

To regenerate after changing one of the original photos:

```sh
python3 -m pip install Pillow
python3 scripts/optimize-hero-images.py
```

Commit `public/hero/optimized` and `src/components/remotion/hero-images.json` together. Review the photos at desktop and phone widths. `tests/hero-assets.test.ts` checks valid WebP candidates and transfer-size budgets; update the budgets only when a visual-quality tradeoff warrants it.

These are file-size savings, not measured improvements to customer load times or a Lighthouse score. The deployed site still needs mobile-network and Core Web Vitals measurement. Product photos require their production storage migration before a complete production acceptance pass.
