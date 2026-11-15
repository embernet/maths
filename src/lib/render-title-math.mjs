// render-title-math.mjs — render inline LaTeX ($...$) inside a short title
// string to HTML, for list/index pages that print frontmatter titles directly.
//
// Topic bodies go through remark-math + rehype-katex, but titles printed in
// index lists (e.g. "$\varepsilon$–$\delta$ definition of limit") are plain
// strings, so the raw `$...$` shows through. Use the output with `set:html`.
// KaTeX CSS is already loaded globally by BaseLayout.
import katex from 'katex';

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Render a title containing inline `$...$` math to an HTML string. */
export function renderTitleMath(input) {
  const s = String(input ?? '');
  if (!s.includes('$')) return escapeHtml(s);
  let out = '';
  let last = 0;
  // Non-greedy single-$ inline spans (no support for $$ display math in titles).
  const re = /\$([^$]+)\$/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    out += escapeHtml(s.slice(last, m.index));
    try {
      out += katex.renderToString(m[1], { throwOnError: false, displayMode: false });
    } catch {
      out += escapeHtml(m[0]);
    }
    last = re.lastIndex;
  }
  out += escapeHtml(s.slice(last));
  return out;
}

/** Strip math delimiters/commands to a plain-text approximation (for <title>). */
export function stripTitleMath(input) {
  return String(input ?? '')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .trim();
}
