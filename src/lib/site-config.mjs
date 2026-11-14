/**
 * site-config.mjs — single source of truth for the deployment base path.
 *
 * The app is served under a sub-path (Cloudflare Workers route
 * `tapestrylab.net/maths*`), so every internal link, asset and data URL must be
 * prefixed with this base. Astro only prefixes its own bundled assets; the rest
 * is handled with the helpers here plus the base-path build integration.
 *
 * BASE has NO trailing slash ('/maths'). `withBase()` joins it to a path.
 */
export const BASE = '/maths';

/**
 * Prefix a root-absolute path with BASE. Leaves external URLs, protocol-relative
 * URLs, hash/mailto/tel links and already-prefixed paths untouched.
 */
export function withBase(path = '/') {
  if (path == null || path === '') return BASE + '/';
  // External, protocol-relative, hash, or scheme (mailto:, tel:, http:) — leave as-is.
  if (/^([a-z]+:|\/\/|#|\?)/i.test(path)) return path;
  if (path === BASE || path.startsWith(BASE + '/')) return path;
  return BASE + (path.startsWith('/') ? path : '/' + path);
}
