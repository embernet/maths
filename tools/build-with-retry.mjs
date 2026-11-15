// build-with-retry.mjs — runs `astro build`, retrying on a known flaky Astro 4
// bug.
//
// Astro 4's SSR build occasionally fails with "Unable to find the module for
// <page>. This is unexpected and likely a bug in Astro" — a non-deterministic
// chunking race in Rollup that strikes a random page on ~1 in 4 builds for this
// large (1100+ page) hybrid site. The build is correct whenever it completes;
// the failure is purely transient. Retrying a few times makes the build (and
// the Cloudflare deploy that runs it) reliable.
//
// Any OTHER (deterministic) build error fails immediately — we only retry the
// known transient one.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ASTRO = fileURLToPath(new URL('../node_modules/astro/astro.js', import.meta.url));
const MAX_ATTEMPTS = 8;
const TRANSIENT = /Unable to find the (module|manifest) for /;

function runBuild() {
  return new Promise((resolve) => {
    let output = '';
    const child = spawn(process.execPath, [ASTRO, 'build'], { stdio: ['inherit', 'pipe', 'pipe'] });
    child.stdout.on('data', (d) => { output += d; process.stdout.write(d); });
    child.stderr.on('data', (d) => { output += d; process.stderr.write(d); });
    child.on('close', (code) => resolve({ code, output }));
  });
}

for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  const { code, output } = await runBuild();
  if (code === 0) process.exit(0);
  if (attempt < MAX_ATTEMPTS && TRANSIENT.test(output)) {
    console.error(`\n[build-retry] transient Astro build error (attempt ${attempt}/${MAX_ATTEMPTS}); retrying…\n`);
    continue;
  }
  process.exit(code ?? 1);
}
