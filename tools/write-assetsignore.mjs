// Emits dist/.assetsignore after the Astro Cloudflare build.
//
// The @astrojs/cloudflare adapter writes the Worker bundle to dist/_worker.js/
// and the route manifest to dist/_routes.json. Our wrangler config uses `dist`
// as the static-assets directory (assets.directory = "dist"), so without this
// ignore file Wrangler would try to upload the server-side Worker code as a
// public asset and error out. Listing them here keeps them server-side only.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const distDir = new URL('../dist/', import.meta.url);
const target = new URL('.assetsignore', distDir);

writeFileSync(target, '_worker.js\n_routes.json\n');
console.log(`[assetsignore] wrote ${fileURLToPath(target)}`);
