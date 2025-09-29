"use client";

import { memo, useMemo, Suspense } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneLight,
  oneDark,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "@/components/providers/theme-provider";

// Pre-compiled regex patterns for performance
const REGEX_PATTERNS = {
  codeBlock: /^```(\w+)?\s*([\s\S]*?)```$/,
  heading3: /^### (.+)/,
  heading2: /^## (.+)/,
  heading1: /^# (.+)/,
  listItem: /^[*-] (.+)/,
  inlineCode: /(`[^`]+`)/g,
  boldText: /(\*\*[^*]+\*\*)/g,
} as const;

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
}: MarkdownRendererProps) {
  const { theme } = useTheme();

  // Memoize expensive computations
  const { syntaxTheme, textStyles, codeStyles, codeBlockStyles } =
    useMemo(() => {
      const isDarkTheme =
        theme === "dark" ||
        (theme === "system" &&
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

      return {
        syntaxTheme: isDarkTheme ? oneDark : oneLight,
        textStyles: "text-foreground/90 leading-[1.7] text-base tracking-wide",
        codeStyles: isDarkTheme
          ? "bg-slate-800/90 text-amber-200 border-slate-600/30"
          : "bg-slate-100/80 text-slate-700 border-slate-200/60",
        codeBlockStyles: {
          margin: 0,
          borderRadius: "0.75rem",
          fontSize: "0.875rem",
          lineHeight: "1.6",
          padding: "1.5rem",
          backgroundColor: isDarkTheme
            ? "rgb(24, 24, 27)"
            : "rgb(250, 250, 250)",
          border: isDarkTheme
            ? "1px solid rgb(39, 39, 42)"
            : "1px solid rgb(229, 229, 234)",
        },
      };
    }, [theme]);

  // Memoized safe code block component
  const SafeCodeBlock = useMemo(
    () =>
      function SafeCodeBlock({
        code,
        language,
      }: {
        code: string;
        language: string;
      }) {
        try {
          return (
            <Suspense
              fallback={
                <pre className="bg-muted p-4 rounded font-mono text-sm">
                  {code}
                </pre>
              }
            >
              <SyntaxHighlighter
                language={language || "text"}
                style={syntaxTheme}
                customStyle={codeBlockStyles}
                codeTagProps={{
                  style: {
                    fontSize: "0.75rem",
                    fontFamily:
                      "ui-monospace, Monaco, 'Cascadia Code', monospace",
                  },
                }}
                role="code"
                aria-label={`Code block in ${language || "text"}`}
                tabIndex={0}
              >
                {code.trim()}
              </SyntaxHighlighter>
            </Suspense>
          );
        } catch (error) {
          console.warn("Syntax highlighting failed:", error);
          return (
            <pre className="bg-muted p-4 rounded font-mono text-sm">{code}</pre>
          );
        }
      },
    [syntaxTheme, codeBlockStyles]
  );

  // Parse markdown-like content and render with syntax highlighting
  const renderContent = useMemo(
    () => (text: string) => {
      // First handle code blocks, then process remaining markdown
      const parts = text.split(/(```[\s\S]*?```)/g);

      return parts.map((part, index) => {
        // Check if this part is a code block using pre-compiled regex
        const codeBlockMatch = part.match(REGEX_PATTERNS.codeBlock);

        if (codeBlockMatch) {
          const [, language, code] = codeBlockMatch;
          return (
            <div key={index} className="my-6">
              <SafeCodeBlock code={code} language={language || "text"} />
            </div>
          );
        }

        // Process markdown for non-code blocks
        return processMarkdown(part, index);
      });
    },
    [SafeCodeBlock]
  );

  const processMarkdown = useMemo(
    () => (text: string, baseIndex: number) => {
      return text.split("\n").map((line, index) => {
        const key = `${baseIndex}-${index}`;

        // Headings with pre-compiled regex and proper accessibility
        const h3Match = line.match(REGEX_PATTERNS.heading3);
        if (h3Match) {
          return (
            <h3
              key={key}
              className="text-xl font-bold mt-8 mb-4 text-foreground/95 tracking-tight border-b border-border/20 pb-2"
              role="heading"
              aria-level={3}
              tabIndex={0}
            >
              {h3Match[1]}
            </h3>
          );
        }

        const h2Match = line.match(REGEX_PATTERNS.heading2);
        if (h2Match) {
          return (
            <h2
              key={key}
              className="text-2xl font-bold mt-3 mb-5 text-foreground/95 tracking-tight border-b border-border/30 pb-3"
              role="heading"
              aria-level={2}
              tabIndex={0}
            >
              {h2Match[1]}
            </h2>
          );
        }

        const h1Match = line.match(REGEX_PATTERNS.heading1);
        if (h1Match) {
          return (
            <h1
              key={key}
              className="text-3xl font-bold mt-12 mb-6 text-foreground tracking-tight border-b-2 border-primary/20 pb-4"
              role="heading"
              aria-level={1}
              tabIndex={0}
            >
              {h1Match[1]}
            </h1>
          );
        }

        // Lists - styled as proper list items with elegant bullets
        const listMatch = line.match(REGEX_PATTERNS.listItem);
        if (listMatch) {
          const content = processInlineCode(listMatch[1]);
          return (
            <div key={key} className="flex items-start gap-3 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60 mt-3 flex-shrink-0"></div>
              <p className={`${textStyles} flex-1`}>{content}</p>
            </div>
          );
        }

        // Skip empty lines - spacing is handled by CSS
        if (line.trim() === "") {
          return null;
        }

        // Regular paragraphs with inline code processing
        const content = processInlineCode(line);
        return (
          <p key={key} className={`mb-6 ${textStyles}`}>
            {content}
          </p>
        );
      });
    },
    [textStyles]
  );

  const processInlineCode = useMemo(
    () => (text: string) => {
      // First handle bold text, then inline code
      const boldParts = text.split(REGEX_PATTERNS.boldText);

      return boldParts.map((part, index) => {
        // Check if this part is bold text
        if (part.startsWith("**") && part.endsWith("**")) {
          const boldText = part.slice(2, -2);
          return (
            <strong
              key={index}
              className="font-bold text-foreground/95 tracking-tight"
            >
              {boldText}
            </strong>
          );
        }

        // Process inline code within non-bold parts
        const inlineCodeParts = part.split(REGEX_PATTERNS.inlineCode);
        return inlineCodeParts.map((codePart, codeIndex) => {
          if (codePart.startsWith("`") && codePart.endsWith("`")) {
            const code = codePart.slice(1, -1);
            return (
              <code
                key={`${index}-${codeIndex}`}
                className={`px-2.5 py-1.5 mx-1 rounded-lg text-sm font-mono transition-all duration-200 border shadow-sm hover:shadow-md ${codeStyles}`}
                role="code"
                aria-label={`Inline code: ${code}`}
              >
                {code}
              </code>
            );
          }
          return codePart;
        });
      });
    },
    [codeStyles]
  );

  // Memoize the final render to prevent unnecessary re-renders
  const renderedContent = useMemo(
    () => renderContent(content),
    [renderContent, content]
  );

  return (
    <div
      className="leading-relaxed selection:bg-amber-200 selection:text-amber-900"
      role="article"
      aria-label="Formatted documentation content"
    >
      {renderedContent}
    </div>
  );
});
