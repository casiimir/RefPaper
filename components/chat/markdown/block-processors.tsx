import React, { CSSProperties } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { MARKDOWN_PATTERNS, getNestingLevel } from "./patterns";

interface BlockProcessorProps {
  key: string;
  line: string;
  isDark: boolean;
  syntaxTheme: { [key: string]: React.CSSProperties };
  processInline: (text: string) => React.ReactNode[];
}

// Header processors
export const createHeaderProcessor = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
  const headerClasses = {
    1: "text-3xl font-bold mt-3 mb-3 text-foreground tracking-tight border-b-2 border-primary/20 pb-3",
    2: "text-2xl font-bold mt-3 mb-2 text-foreground/95 tracking-tight border-b border-border/30 pb-2",
    3: "text-xl font-bold mt-2 mb-2 text-foreground/95 tracking-tight border-b border-border/20 pb-2",
    4: "text-lg font-semibold mt-2 mb-2 text-foreground/90 tracking-tight",
    5: "text-base font-semibold mt-2 mb-2 text-foreground/90 tracking-tight",
    6: "text-sm font-semibold mt-2 mb-2 text-foreground/85 tracking-tight",
  };

  const HeaderProcessor: React.FC<BlockProcessorProps> = ({
    key,
    line,
    processInline,
  }) => {
    const pattern =
      MARKDOWN_PATTERNS[`heading${level}` as keyof typeof MARKDOWN_PATTERNS];
    const match = line.match(pattern as RegExp);

    if (!match) return null;

    const HeaderTag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

    return (
      <HeaderTag key={key} className={headerClasses[level]}>
        {processInline(match[1])}
      </HeaderTag>
    );
  };

  HeaderProcessor.displayName = `HeaderProcessor${level}`;
  return HeaderProcessor;
};

// Code block processor
export const processCodeBlock = (
  key: string,
  codeBlockContent: string[],
  codeBlockLanguage: string,
  syntaxTheme: {
    [key: string]: CSSProperties;
  }
) => (
  <div key={key} className="my-3">
    <SyntaxHighlighter
      language={codeBlockLanguage || "text"}
      style={syntaxTheme}
      customStyle={{
        margin: 0,
        borderRadius: "0.75rem",
        fontSize: "0.875rem",
        lineHeight: "1.6",
        padding: "1.5rem",
      }}
    >
      {codeBlockContent.join("\n")}
    </SyntaxHighlighter>
  </div>
);

// Table processor
export const processTable = (
  key: string,
  tableRows: string[][],
  processInline: (text: string) => React.ReactNode[]
) => (
  <div key={key} className="my-3 overflow-x-auto">
    <table className="min-w-full border border-border rounded-lg">
      <thead className="bg-muted/50">
        <tr>
          {tableRows[0].map((cell, cellIndex) => (
            <th
              key={cellIndex}
              className="px-4 py-2 text-left border-b border-border font-semibold"
            >
              {processInline(cell)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tableRows.slice(1).map((row, rowIndex) => (
          <tr key={rowIndex} className="even:bg-muted/25">
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} className="px-4 py-2 border-b border-border">
                {processInline(cell)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Blockquote processor
export const processBlockquote = ({
  key,
  line,
  processInline,
}: BlockProcessorProps) => {
  const match = line.match(MARKDOWN_PATTERNS.blockquote);
  if (!match) return null;

  return (
    <blockquote
      key={key}
      className="border-l-4 border-primary/30 pl-4 py-2 my-3 bg-muted/30 rounded-r-lg"
    >
      <p className="italic text-muted-foreground mb-0 leading-relaxed">
        {processInline(match[1])}
      </p>
    </blockquote>
  );
};

// List processors
export const processUnorderedList = ({
  key,
  line,
  processInline,
}: BlockProcessorProps) => {
  const match = line.match(MARKDOWN_PATTERNS.unorderedList);
  if (!match) return null;

  const nestingLevel = getNestingLevel(match[1]);
  const marginLeft = nestingLevel * 24; // 24px per level

  return (
    <div
      key={key}
      className="flex items-start gap-3 mb-2"
      style={{ marginLeft: `${marginLeft}px` }}
    >
      <div className="text-primary/70 mt-1 flex-shrink-0 font-mono text-sm font-bold">
        •
      </div>
      <p className="text-foreground/90 leading-relaxed text-base flex-1">
        {processInline(match[2])}
      </p>
    </div>
  );
};

export const processOrderedList = ({
  key,
  line,
  processInline,
}: BlockProcessorProps) => {
  const match = line.match(MARKDOWN_PATTERNS.orderedList);
  if (!match) return null;

  const nestingLevel = getNestingLevel(match[1]);
  const marginLeft = nestingLevel * 24; // 24px per level
  const listNumber = line.match(/\d+/)?.[0] || "1";

  return (
    <div
      key={key}
      className="flex items-start gap-3 mb-2"
      style={{ marginLeft: `${marginLeft}px` }}
    >
      <div className="text-primary/70 mt-1 flex-shrink-0 font-mono text-sm font-bold min-w-[20px]">
        {listNumber}.
      </div>
      <p className="text-foreground/90 leading-relaxed text-base flex-1">
        {processInline(match[2])}
      </p>
    </div>
  );
};

// Horizontal rule processor
export const processHorizontalRule = (key: string) => (
  <div key={key} className="flex items-center justify-center my-4">
    <div className="w-full h-px bg-border"></div>
  </div>
);

// Regular paragraph processor
export const processParagraph = ({
  key,
  line,
  processInline,
}: BlockProcessorProps) => (
  <p key={key} className="text-foreground/90 leading-relaxed text-base mb-2">
    {processInline(line)}
  </p>
);

// Empty line processor
export const processEmptyLine = (key: string) => (
  <div key={key} className="h-2"></div>
);
