/**
 * Renders the sanitized article HTML produced by the admin Tiptap editor.
 * The HTML is sanitized server-side (mss-admin lib/blogs.js) on every save,
 * so this is trusted CMS output — same trust model as the hero slideshow.
 */
export default function BlogContent({ html }) {
  return <div className="blog-content" dangerouslySetInnerHTML={{ __html: html || "" }} />;
}
