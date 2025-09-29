import React from "react";
import { MARKDOWN_PATTERNS } from "./patterns";



// Process inline formatting (bold, italic, code, links, etc.)
export const processInlineFormatting = (text: string, isDark: boolean): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let partIndex = 0;


  // Process all inline patterns
  const patterns = [
    {
      regex: MARKDOWN_PATTERNS.inlineCode,
      component: (match: string, content: string) => (
        <code key={`code-${partIndex++}`} className={`px-1.5 py-0.5 rounded text-sm font-mono ${
          isDark ? "bg-slate-800/90 text-amber-200" : "bg-slate-100/80 text-slate-700"
        }`}>
          {content}
        </code>
      )
    },
    {
      regex: MARKDOWN_PATTERNS.boldText,
      component: (match: string, content: string) => (
        <strong key={`bold-${partIndex++}`} className="font-bold">{content}</strong>
      )
    },
    {
      regex: MARKDOWN_PATTERNS.italicText,
      component: (match: string, content: string) => (
        <em key={`italic-${partIndex++}`} className="italic">{content}</em>
      )
    },
    {
      regex: MARKDOWN_PATTERNS.strikethrough,
      component: (match: string, content: string) => (
        <del key={`strike-${partIndex++}`} className="line-through opacity-75">{content}</del>
      )
    },
    {
      regex: MARKDOWN_PATTERNS.link,
      component: (match: string, linkText: string, url: string) => (
        <a key={`link-${partIndex++}`} href={url} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
          {linkText}
        </a>
      )
    },
    {
      regex: MARKDOWN_PATTERNS.image,
      component: (match: string, alt: string, src: string) => (
        <img key={`img-${partIndex++}`} src={src} alt={alt} className="max-w-full h-auto rounded-lg my-2" />
      )
    },
  ];

  // Sort matches by position to process them in order
  const allMatches: Array<{index: number, length: number, component: React.ReactNode}> = [];

  patterns.forEach(pattern => {
    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    while ((match = regex.exec(text)) !== null) {
      allMatches.push({
        index: match.index,
        length: match[0].length,
        component: pattern.component(match[0], match[1], match[2])
      });
    }
  });

  // Sort by index
  allMatches.sort((a, b) => a.index - b.index);

  // Build the result
  allMatches.forEach(match => {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(match.component);
    lastIndex = match.index + match.length;
  });

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
};