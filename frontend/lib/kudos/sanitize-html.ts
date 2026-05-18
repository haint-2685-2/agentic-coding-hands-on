// Tiny allowlist sanitizer for rich-text kudo messages. Strips everything
// except inline marks (b/strong, i/em, s/strike/del, u), block-level
// structure produced by the editor (p, br, blockquote, ol, ul, li), and
// safe links (a[href], http(s)/mailto only, with target/rel locked down).
// We avoid a heavyweight runtime dependency since the rules are short.

const INLINE_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'S', 'STRIKE', 'DEL', 'U']);
const BLOCK_TAGS = new Set(['P', 'BR', 'BLOCKQUOTE', 'OL', 'UL', 'LI', 'DIV']);
const SAFE_LINK = /^(?:https?:|mailto:)/i;

export function sanitizeKudoHtml(input: string): string {
  if (typeof window === 'undefined') {
    // Server-side fallback: strip all tags. Pages call this from a Client
    // Component after hydration; SSR path uses the safe text fallback.
    return stripTags(input);
  }
  const tpl = document.createElement('template');
  tpl.innerHTML = input;
  walk(tpl.content);
  return tpl.innerHTML;
}

function walk(node: Node) {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tag = el.tagName;
      if (tag === 'A') {
        const href = el.getAttribute('href') ?? '';
        if (!SAFE_LINK.test(href)) {
          // Drop href entirely — keep text.
          unwrap(el);
          continue;
        }
        // Reset to a known-safe set of attributes.
        for (const a of Array.from(el.attributes)) {
          if (a.name !== 'href') el.removeAttribute(a.name);
        }
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      } else if (!INLINE_TAGS.has(tag) && !BLOCK_TAGS.has(tag)) {
        unwrap(el);
        continue;
      } else {
        // Strip every attribute on allowed tags.
        for (const a of Array.from(el.attributes)) {
          el.removeAttribute(a.name);
        }
      }
      walk(el);
    }
  }
}

function unwrap(el: Element) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, '');
}

// Best-effort plain-text projection for char counting + dedup hashing.
export function htmlToPlainText(html: string): string {
  if (typeof window === 'undefined') return stripTags(html);
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  return (tpl.content.textContent ?? '').trim();
}
