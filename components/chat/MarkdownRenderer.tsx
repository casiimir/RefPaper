"use client";

import { memo, useMemo } from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

// Import our modular components
import { MARKDOWN_PATTERNS } from "./markdown/patterns";
import { processInlineFormatting } from "./markdown/inline-processors";
import {
  createHeaderProcessor,
  processCodeBlock,
  processTable,
  processBlockquote,
  processUnorderedList,
  processOrderedList,
  processHorizontalRule,
  processParagraph,
  processEmptyLine,
} from "./markdown/block-processors";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
}: MarkdownRendererProps) {
  const { theme } = useTheme();

  const { syntaxTheme, isDark } = useMemo(() => {
    const isDarkTheme =
      theme === "dark" ||
      (theme === "system" &&
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    return {
      syntaxTheme: isDarkTheme ? oneDark : oneLight,
      isDark: isDarkTheme,
    };
  }, [theme]);

  // Create header processors for all levels
  const headerProcessors = useMemo(() => ({
    h1: createHeaderProcessor(1),
    h2: createHeaderProcessor(2),
    h3: createHeaderProcessor(3),
    h4: createHeaderProcessor(4),
    h5: createHeaderProcessor(5),
    h6: createHeaderProcessor(6),
  }), []);

  // Process inline formatting with current theme
  const processInline = useMemo(() =>
    (text: string) => processInlineFormatting(text, isDark),
    [isDark]
  );

  // Process the markdown content
  const processMarkdown = useMemo(() => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];

    // State for multi-line elements
    let codeBlockContent: string[] = [];
    let codeBlockLanguage = '';
    let isInCodeBlock = false;
    let tableRows: string[][] = [];
    let isInTable = false;

    lines.forEach((line, index) => {
      const key = `line-${index}`;

      // Handle code blocks
      if (isInCodeBlock) {
        if (MARKDOWN_PATTERNS.codeBlockEnd.test(line.trim())) {
          // End code block
          if (codeBlockContent.length > 0) {
            elements.push(processCodeBlock(key, codeBlockContent, codeBlockLanguage, syntaxTheme));
          }
          codeBlockContent = [];
          codeBlockLanguage = '';
          isInCodeBlock = false;
        } else {
          codeBlockContent.push(line);
        }
        return;
      }

      // Check for code block start
      const codeBlockMatch = line.trim().match(MARKDOWN_PATTERNS.codeBlockStart);
      if (codeBlockMatch) {
        isInCodeBlock = true;
        codeBlockLanguage = codeBlockMatch[1]?.trim() || 'text';
        return;
      }

      // Handle table rows
      const tableRowMatch = line.match(MARKDOWN_PATTERNS.tableRow);
      const tableSeparatorMatch = line.match(MARKDOWN_PATTERNS.tableSeparator);

      if (tableRowMatch || tableSeparatorMatch) {
        if (tableSeparatorMatch && tableRows.length > 0) {
          isInTable = true;
          return;
        }
        if (tableRowMatch) {
          const cells = tableRowMatch[1].split('|').map(cell => cell.trim());
          tableRows.push(cells);
          isInTable = true;
          return;
        }
      } else if (isInTable && tableRows.length > 0) {
        // End of table, render it
        elements.push(processTable(key, tableRows, processInline));
        tableRows = [];
        isInTable = false;
      }

      // Process headers (H6 to H1 to avoid conflicts)
      let element = headerProcessors.h6({ key, line, isDark, syntaxTheme, processInline }) as React.ReactElement | null;
      if (element) { elements.push(element); return; }

      element = headerProcessors.h5({ key, line, isDark, syntaxTheme, processInline }) as React.ReactElement | null;
      if (element) { elements.push(element); return; }

      element = headerProcessors.h4({ key, line, isDark, syntaxTheme, processInline }) as React.ReactElement | null;
      if (element) { elements.push(element); return; }

      element = headerProcessors.h3({ key, line, isDark, syntaxTheme, processInline }) as React.ReactElement | null;
      if (element) { elements.push(element); return; }

      element = headerProcessors.h2({ key, line, isDark, syntaxTheme, processInline }) as React.ReactElement | null;
      if (element) { elements.push(element); return; }

      element = headerProcessors.h1({ key, line, isDark, syntaxTheme, processInline }) as React.ReactElement | null;
      if (element) { elements.push(element); return; }

      // Horizontal rules
      if (MARKDOWN_PATTERNS.horizontalRule.test(line)) {
        elements.push(processHorizontalRule(key));
        return;
      }

      // Blockquotes
      element = processBlockquote({ key, line, isDark, syntaxTheme, processInline });
      if (element) { elements.push(element); return; }

      // Unordered lists
      element = processUnorderedList({ key, line, isDark, syntaxTheme, processInline });
      if (element) { elements.push(element); return; }

      // Ordered lists
      element = processOrderedList({ key, line, isDark, syntaxTheme, processInline });
      if (element) { elements.push(element); return; }

      // Empty lines
      if (line.trim() === '') {
        elements.push(processEmptyLine(key));
        return;
      }

      // Regular paragraphs
      elements.push(processParagraph({ key, line, isDark, syntaxTheme, processInline }));
    });

    return elements;
  }, [content, syntaxTheme, isDark, headerProcessors, processInline]);

  return (
    <div className="prose prose-lg max-w-none">
      {processMarkdown}
    </div>
  );
});