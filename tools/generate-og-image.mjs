// Generates public/og-image.png (1200x630) — the default social-share image.
// Run once with `node tools/generate-og-image.mjs`; the PNG is committed.
// Re-run if the branding/wording changes.
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#1a3a52"/>
      <stop offset="1" stop-color="#0f2638"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="12" fill="#c9a24b"/>
  <text x="90" y="250" font-family="Georgia, 'Times New Roman', serif" font-size="300" fill="#c9a24b" opacity="0.18">&#8721;</text>
  <text x="90" y="300" font-family="Georgia, 'Times New Roman', serif" font-size="78" font-weight="700" fill="#faf9f7">The Undergraduate</text>
  <text x="90" y="392" font-family="Georgia, 'Times New Roman', serif" font-size="78" font-weight="700" fill="#faf9f7">Mathematics Companion</text>
  <text x="92" y="470" font-family="Georgia, 'Times New Roman', serif" font-size="38" fill="#9fb4c4">A friendly map of the undergraduate mathematics curriculum</text>
  <text x="92" y="560" font-family="Georgia, 'Times New Roman', serif" font-size="30" fill="#c9a24b">topics &#183; theorems &#183; mathematicians &#183; applications</text>
</svg>`;

const out = fileURLToPath(new URL('../public/og-image.png', import.meta.url));
await sharp(Buffer.from(svg)).png().toFile(out);
console.log(`[og-image] wrote ${out}`);
