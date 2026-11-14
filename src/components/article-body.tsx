import ReactMarkdown from "react-markdown";

/**
 * Renders an article written in Markdown. react-markdown builds React elements
 * and never injects HTML, and raw HTML in the source is skipped outright, so an
 * article cannot carry a script or a hidden frame. Images are left out until
 * articles get their own upload flow.
 */
export function ArticleBody({ markdown }: { markdown: string }) {
  return (
    <div className="article-body">
      <ReactMarkdown
        skipHtml
        disallowedElements={["img", "h1"]}
        unwrapDisallowed
        components={{
          a: ({ href, children }) => {
            const external = typeof href === "string" && /^https?:\/\//.test(href);
            return (
              <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {children}
              </a>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
