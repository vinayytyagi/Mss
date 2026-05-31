/**
 * Injects a JSON-LD <script> block into the page.
 * Works in both Server and Client components.
 * Pass a single schema object or an array of schema objects.
 */
export default function JsonLd({ data }) {
  const schemas = Array.isArray(data) ? data : [data];
  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
