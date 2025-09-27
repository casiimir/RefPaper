import FirecrawlApp from "@mendable/firecrawl-js";
import { Document } from "@/types/document";
import {
  CrawlConfig,
  RawPage,
  CrawlResponse,
  CrawlStatus,
} from "@/types/firecrawl";

// Generic config
const DEFAULT_CONFIG: CrawlConfig = {
  formats: ["markdown"],
  limit: 30,
  maxDepth: 10,
  waitFor: 1000,
  excludePaths: [
    "^/blog/.*$",
    "^/news/.*$",
    "^/community/.*$",
    "^/forum/.*$",
    "^/pricing/.*$",
    "^/careers/.*$",
    "^/legal/.*$",
    "^/privacy/.*$",
    "^/terms/.*$",
    "^/changelog/.*$",
  ],
  removeTags: ["nav", "footer", "header", "aside", ".sidebar", "#toc"],
  onlyMainContent: true,
};

/**
 * Crawl documentation from a URL and return processed pages
 */
export async function crawlDocumentation(
  docUrl: string,
  options: Partial<CrawlConfig> = {},
  userPlan: "free" | "pro" = "free"
): Promise<Document[]> {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error("FIRECRAWL_API_KEY is required");
  }

  // Initialize Firecrawl client
  const firecrawl = new FirecrawlApp({
    apiKey: process.env.FIRECRAWL_API_KEY,
  });

  // Set depth limits based on user plan
  const planLimits = {
    free: { maxDepth: 3, limit: 30 }, // Limited to 30 pages for free users
    pro: { maxDepth: 15, limit: 150 }, // Limited to 150 pages for free users
  };

  const limits = planLimits[userPlan];

  // Merge configurations
  const crawlConfig = {
    ...DEFAULT_CONFIG,
    ...options,
    maxDepth: limits.maxDepth,
    limit: limits.limit,
    excludePaths: [
      ...DEFAULT_CONFIG.excludePaths,
      ...(options.excludePaths || []),
    ],
  };

  try {
    // Start crawl
    const crawlResponse: CrawlResponse = await firecrawl.crawl(
      docUrl,
      crawlConfig
    );

    // Handle response based on type (sync vs async)
    let finalData: RawPage[];

    if (crawlResponse.status === "completed" && crawlResponse.data) {
      // Synchronous response - data immediately available
      finalData = crawlResponse.data;
    } else if (crawlResponse.jobId || crawlResponse.id) {
      // Asynchronous response - need to poll for results
      const jobId = crawlResponse.jobId || crawlResponse.id;
      if (!jobId) {
        throw new Error("No job ID returned from crawl");
      }
      finalData = await pollForResults(firecrawl, jobId);
    } else {
      throw new Error("Unexpected crawl response format");
    }

    // Process and clean the crawled data
    return processPages(finalData);
  } catch (error) {
    console.error("Crawl failed:", error);
    throw error;
  }
}

/**
 * Poll for async crawl results
 */
async function pollForResults(
  firecrawl: FirecrawlApp,
  jobId: string
): Promise<RawPage[]> {
  const maxAttempts = 300;
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise((r) => setTimeout(r, 1000));

    const status: CrawlStatus = await firecrawl.getCrawlStatus(jobId);

    if (status.status === "completed") {
      return status.data || [];
    } else if (status.status === "failed") {
      throw new Error(`Crawl failed: ${status.error || "Unknown error"}`);
    }

    attempts++;
  }

  throw new Error("Crawl timeout after 5 minutes");
}

/**
 * Process and clean crawled pages
 */
function processPages(pages: RawPage[]): Document[] {
  return pages
    .filter((page) => {
      // Filter out empty or very short pages
      const contentLength = page.markdown?.length || 0;
      return contentLength >= 100;
    })
    .map((page) => {
      // Clean the content
      const cleanContent = cleanMarkdown(page.markdown || "");

      return {
        content: cleanContent,
        sourceUrl: page.sourceUrl || page.url || page.metadata?.url || "",
        title: page.metadata?.title || extractTitle(cleanContent) || "Untitled",
        description: page.metadata?.description,
        metadata: {
          hasCode: /```[\s\S]*?```/.test(cleanContent),
          hasImages: /!\[.*?\]\(.*?\)/.test(cleanContent),
          contentLength: cleanContent.length,
          crawledAt: new Date().toISOString(),
        },
      };
    })
    .filter((page) => page.content.length > 0); // Final filter after cleaning
}

/**
 * Clean markdown content from common UI elements
 */
function cleanMarkdown(content: string): string {
  return (
    content
      // Remove common UI elements
      .replace(/\*\*Advertisement\*\*/gi, "")
      .replace(/Skip to content/gi, "")
      .replace(/Back to top/gi, "")
      .replace(/Edit this page/gi, "")
      .replace(/Previous\s+Next/gi, "")
      .replace(/©\s*\d{4}.*/gi, "")
      .replace(/All rights reserved.*/gi, "")
      .replace(/\n{4,}/g, "\n\n\n")
      .replace(/[ \t]+$/gm, "")
      .trim()
  );
}

/**
 * Extract title from markdown content
 */
function extractTitle(content: string): string | null {
  // Try to find H1
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();

  // Try to find H2
  const h2Match = content.match(/^##\s+(.+)$/m);
  if (h2Match) return h2Match[1].trim();

  // Use first non-empty line as fallback
  const firstLine = content.split("\n").find((line) => line.trim().length > 0);
  return firstLine ? firstLine.substring(0, 100).trim() : null;
}

export default crawlDocumentation;
