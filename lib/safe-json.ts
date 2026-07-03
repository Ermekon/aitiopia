/**
 * Serialises data for use inside <script type="application/ld+json"> blocks.
 *
 * Attack prevented: JSON.stringify() does NOT escape the sequence </script>.
 * If a database field contains that literal string, the browser's HTML parser
 * terminates the enclosing <script> tag and interprets the rest as raw HTML,
 * enabling stored XSS. Unicode-escaping < and > makes the output safe to embed
 * inside any HTML context regardless of the script type attribute.
 *
 * Example of the attack without this function:
 *   value = '</script><script>alert(1)</script>'
 *   JSON.stringify(value) → "</script><script>alert(1)</script>"  ← breaks out
 *   safeJsonLd(value)     → "</script>..."             ← inert
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}
