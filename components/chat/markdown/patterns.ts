// Comprehensive regex patterns for all markdown elements
export const MARKDOWN_PATTERNS = {
  // Headers (H1-H6) - must be checked in order from H6 to H1
  heading6: /^######\s+(.+)$/,
  heading5: /^#####\s+(.+)$/,
  heading4: /^####\s+(.+)$/,
  heading3: /^###\s+(.+)$/,
  heading2: /^##\s+(.+)$/,
  heading1: /^#\s+(.+)$/,

  // Code blocks
  codeBlockStart: /^```(.*)$/,
  codeBlockEnd: /^```\s*$/,

  // Blockquotes
  blockquote: /^>\s*(.*)$/,

  // Lists (ordered and unordered, with nesting support)
  unorderedList: /^(\s*)[-*+]\s+(.+)$/,
  orderedList: /^(\s*)\d+\.\s+(.+)$/,

  // Horizontal rules
  horizontalRule: /^---+\s*$/,

  // Inline formatting
  boldText: /\*\*(.*?)\*\*/g,
  italicText: /\*(.*?)\*/g,
  inlineCode: /`([^`]+)`/g,
  strikethrough: /~~(.*?)~~/g,

  // Links and images
  link: /\[([^\]]+)\]\(([^)]+)\)/g,
  image: /!\[([^\]]*)\]\(([^)]+)\)/g,

  // Tables
  tableRow: /^\|(.+)\|$/,
  tableSeparator: /^\|[-:\s|]+\|$/,
} as const;

// Helper function to calculate nesting level based on indentation
export const getNestingLevel = (indentation: string): number => {
  return Math.floor(indentation.length / 2); // 2 spaces = 1 level
};