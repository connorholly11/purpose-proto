import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Match RN‑Markdown‑Display prop names we actually use
export default (props: { children: string }) => (
  <ReactMarkdown remarkPlugins={[remarkGfm]}>{props.children}</ReactMarkdown>
);