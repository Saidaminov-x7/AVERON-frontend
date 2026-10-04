import ReactMarkdown from 'react-markdown';

const inlineElements = ['p', 'strong', 'em', 'del', 'br'] as const;
const blockElements = ['p', 'strong', 'em', 'del', 'br', 'ul', 'ol', 'li'] as const;

export function ProductRichText({ content, inline = false }: { content: string; inline?: boolean }) {
  return (
    <ReactMarkdown
      allowedElements={inline ? inlineElements : blockElements}
      unwrapDisallowed
      components={{
        p: ({ children }) => inline
          ? <span>{children}</span>
          : <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
        ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
