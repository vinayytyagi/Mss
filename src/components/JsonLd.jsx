/**
 * Injects a JSON-LD <script> block into the page.
 * Works in both Server and Client components.
 * Pass a single schema object or an array of schema objects.
 */

/**
 * Serialize a schema for safe embedding inside a raw-text <script> element.
 * JSON.stringify does NOT escape '<', so a value containing the closing
 * script sequence (e.g. an admin-authored blog title) would break out of the
 * JSON-LD block and inject executable markup. Escaping < > & to their \uXXXX
 * forms neutralizes that while still round-tripping through JSON.parse. U+2028
 * and U+2029 are escaped too: valid inside JSON strings but JS line terminators.
 * The regexes use \u2028 / \u2029 escape sequences because a literal
 * separator inside a regex literal is itself a syntax error.
 */
function safeJsonLd(schema) {
  return JSON.stringify(schema)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export default function JsonLd({ data }) {
  const schemas = Array.isArray(data) ? data : [data];
  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
        />
      ))}
    </>
  );
}
