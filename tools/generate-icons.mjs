// generate-icons.mjs — produce every icon/splash/social asset from one master logo.
//
//   node tools/generate-icons.mjs <path-to-master-square-png>
//
// Master should be a square PNG (>=1024x1024). Outputs (committed):
//   public/icons/favicon-16/32/48.png      — browser tab
//   public/icons/icon-64.png               — site header / top bar
//   public/icons/apple-touch-icon.png      — iOS home screen (180)
//   public/icons/icon-192.png, icon-512.png            — Android / PWA ("any")
//   public/icons/icon-192-maskable.png, icon-512-maskable.png — maskable (full-bleed)
//   public/og-image.png (1200x630)         — social share card + splash (logo + title)
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const NAVY = '#1a3a52';
const GOLD = '#a77b3f';
const CREAM = '#faf9f7';

const master = process.argv[2]
  ? process.argv[2]
  : fileURLToPath(new URL('../tmp-master-logo.png', import.meta.url));
const iconsDir = fileURLToPath(new URL('../public/icons/', import.meta.url));
const publicDir = fileURLToPath(new URL('../public/', import.meta.url));

const masterBuf = await readFile(master);

// Plain "any" icons — straight resize of the master.
const plain = [
  ['favicon-16.png', 16], ['favicon-32.png', 32], ['favicon-48.png', 48],
  ['icon-64.png', 64], ['apple-touch-icon.png', 180],
  ['icon-192.png', 192], ['icon-512.png', 512],
];
for (const [name, size] of plain) {
  await sharp(masterBuf).resize(size, size, { fit: 'cover' }).png().toFile(iconsDir + name);
}

// Maskable icons — emblem scaled to the ~80% safe zone, centred on a full-bleed
// navy square so the platform mask never clips meaningful content.
for (const [name, size] of [['icon-192-maskable.png', 192], ['icon-512-maskable.png', 512]]) {
  const inner = Math.round(size * 0.78);
  const emblem = await sharp(masterBuf).resize(inner, inner, { fit: 'contain', background: NAVY }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: NAVY } })
    .composite([{ input: emblem, gravity: 'center' }])
    .png()
    .toFile(iconsDir + name);
}

// Social / splash card (1200x630): logo on the left, wordmark on the right.
const logoPng = await sharp(masterBuf).resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
const logoDataUri = `data:image/png;base64,${logoPng.toString('base64')}`;
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${NAVY}"/><stop offset="1" stop-color="#0f2638"/>
  </linearGradient></defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="12" fill="${GOLD}"/>
  <image href="${logoDataUri}" x="90" y="115" width="400" height="400"/>
  <text x="560" y="300" font-family="Georgia, 'Times New Roman', serif" font-size="88" font-weight="700" fill="${CREAM}">Mathematics</text>
  <text x="560" y="398" font-family="Georgia, 'Times New Roman', serif" font-size="88" font-weight="700" fill="${CREAM}">Companion</text>
  <text x="562" y="470" font-family="Georgia, 'Times New Roman', serif" font-size="34" fill="#9fb4c4">A map of mathematics</text>
</svg>`;
await sharp(Buffer.from(ogSvg)).png().toFile(publicDir + 'og-image.png');

console.log('[icons] generated favicons, app icons, maskable icons, and og-image.png');
