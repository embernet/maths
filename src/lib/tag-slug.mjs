/**
 * tag-slug.mjs — single source of truth for turning a tag into a URL slug,
 * used by the tag pills (links) and by the /tags/[tag] page routes so they
 * always agree.
 */
export function tagSlug(tag) {
  return String(tag == null ? '' : tag)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
