import FirecrawlApp from "@mendable/firecrawl-js";
import { Document } from "@/types/document";
import {
  CrawlConfig,
  RawPage,
  CrawlResponse,
  CrawlStatus,
} from "@/types/firecrawl";
import { CRAWL_TIMEOUTS, ERROR_MESSAGES } from "./constants";

// Generic config for Firecrawl v4.3.5
const DEFAULT_CONFIG: CrawlConfig = {
  limit: 30,
  maxDiscoveryDepth: 10,
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
  allowSubdomains: false,
  crawlEntireDomain: false,
  scrapeOptions: {
    formats: ["markdown" as const],
    excludeTags: [
      "nav",
      "footer",
      "header",
      "aside",
      ".sidebar",
      "#toc",
      ".cookie-banner",
      ".cookie-notice",
      ".recaptcha",
      ".breadcrumb",
      ".page-nav",
      ".edit-page",
      ".feedback",
      ".skipToContent",
      ".table-of-contents",
      ".navigation",
      ".footer-links",
    ],
    onlyMainContent: true,
    waitFor: 1000,
    blockAds: true,
    removeBase64Images: true,
    fastMode: true,
  },
};

/**
 * Crawl documentation from a URL and return processed pages with timeout protection
 */
export async function crawlDocumentation(
  docUrl: string,
  options: Partial<CrawlConfig> = {},
  userPlan: "free" | "pro" = "free"
): Promise<Document[]> {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error("FIRECRAWL_API_KEY is required");
  }

  // Wrap the entire crawling process with a timeout
  return Promise.race([
    performCrawl(docUrl, options, userPlan),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        const elapsedMinutes = CRAWL_TIMEOUTS.MAX_CRAWL_TIME / 1000 / 60;
        console.error(
          `⏰ Overall crawl timeout after ${elapsedMinutes} minutes for ${docUrl}`
        );
        reject(new Error(ERROR_MESSAGES.CRAWL_TIMEOUT));
      }, CRAWL_TIMEOUTS.MAX_CRAWL_TIME);
    }),
  ]);
}

/**
 * Internal function to perform the actual crawling
 */
async function performCrawl(
  docUrl: string,
  options: Partial<CrawlConfig> = {},
  userPlan: "free" | "pro" = "free"
): Promise<Document[]> {
  // Initialize Firecrawl client
  const firecrawl = new FirecrawlApp({
    apiKey: process.env.FIRECRAWL_API_KEY,
  });

  // Set depth limits based on user plan
  const planLimits = {
    free: { maxDiscoveryDepth: 3, limit: 30 }, // Limited to 30 pages for free users
    pro: { maxDiscoveryDepth: 15, limit: 150 }, // Limited to 150 pages for pro users
  };

  const limits = planLimits[userPlan];

  // Merge configurations
  const crawlConfig = {
    ...DEFAULT_CONFIG,
    ...options,
    maxDiscoveryDepth: limits.maxDiscoveryDepth,
    limit: limits.limit,
    excludePaths: [
      ...DEFAULT_CONFIG.excludePaths,
      ...(options.excludePaths || []),
    ],
    scrapeOptions: {
      ...DEFAULT_CONFIG.scrapeOptions,
      ...(options.scrapeOptions || {}),
      excludeTags: [
        ...(DEFAULT_CONFIG.scrapeOptions.excludeTags || []),
        ...(options.scrapeOptions?.excludeTags || []),
      ],
    },
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
    const processedDocuments = processPages(finalData);
    return processedDocuments;
  } catch (error) {
    console.error("❌ Crawl failed:", error);
    throw error;
  }
}

/**
 * Poll for async crawl results with configurable timeout
 */
async function pollForResults(
  firecrawl: FirecrawlApp,
  jobId: string
): Promise<RawPage[]> {
  const maxAttempts = CRAWL_TIMEOUTS.MAX_POLL_ATTEMPTS;
  let attempts = 0;
  const startTime = Date.now();

  while (attempts < maxAttempts) {
    // Check if we've exceeded the maximum crawl time
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime > CRAWL_TIMEOUTS.MAX_CRAWL_TIME) {
      throw new Error(ERROR_MESSAGES.CRAWL_TIMEOUT);
    }

    await new Promise((r) => setTimeout(r, CRAWL_TIMEOUTS.POLL_INTERVAL));

    try {
      const status: CrawlStatus = await firecrawl.getCrawlStatus(jobId);

      if (status.status === "completed") {
        return status.data || [];
      } else if (status.status === "failed") {
        console.error(`❌ Crawl failed: ${status.error || "Unknown error"}`);
        throw new Error(`Crawl failed: ${status.error || "Unknown error"}`);
      }
      // Continue polling for "scraping" or "crawling" status
    } catch {
      // Don't throw immediately on status check errors, continue polling
      // The error might be temporary network issues
    }

    attempts++;
  }

  throw new Error(ERROR_MESSAGES.CRAWL_TIMEOUT);
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
 * Detect documentation platform type based on content patterns
 */
function detectDocumentationType(content: string): string {
  const patterns = [
    {
      type: "docusaurus",
      indicators: ["__docusaurus", "On this page", "Skip to main content"],
    },
    {
      type: "gitbook",
      indicators: ["Was this helpful?", "Last updated", "GitBook"],
    },
    {
      type: "sphinx",
      indicators: ["Built with Sphinx", "© Copyright", "sphinx-build"],
    },
    {
      type: "vitepress",
      indicators: ["Edit this page on GitHub", "VitePress"],
    },
    { type: "notion", indicators: ["Share", "Duplicate", "notion.so"] },
    { type: "gitiles", indicators: ["Generated by", "source.chromium.org"] },
    { type: "mkdocs", indicators: ["MkDocs", "Created with Material"] },
  ];

  for (const pattern of patterns) {
    if (pattern.indicators.some((indicator) => content.includes(indicator))) {
      return pattern.type;
    }
  }

  return "generic";
}

/**
 * Clean markdown content using platform-specific and generic patterns
 */
function cleanMarkdown(content: string): string {
  const docType = detectDocumentationType(content);

  // Apply universal cleaning first
  let cleaned = content
    // Universal navigation elements
    .replace(/Skip to content/gi, "")
    .replace(/Back to top/gi, "")
    .replace(/Edit this page/gi, "")
    .replace(/Previous\s+Next/gi, "")
    .replace(/^\s*Table of Contents\s*$/gm, "")

    // Universal cookie/privacy elements
    .replace(
      /We use.*?cookies[\s\S]*?(?:privacy|policy|learn more)[\s\S]*?\./gi,
      ""
    )
    .replace(/Accept.*?cookies?/gi, "")
    .replace(/Decline.*?Accept/g, "")
    .replace(/reCAPTCHA[\s\S]*?verification[\s\S]*?\./gi, "")
    .replace(/protected by \*\*reCAPTCHA\*\*/gi, "")
    .replace(/\[Privacy\]\([^)]*\)\s*[\\-]*\s*\[Terms\]\([^)]*\)/g, "")

    // Universal footer elements
    .replace(/©\s*\d{4}[\s\S]*?(?:All rights reserved|Inc\.|Ltd\.|LLC)/gi, "")
    .replace(/\*\*Advertisement\*\*/gi, "")
    .replace(/\bAdvertisement\b/gi, "")

    // Universal social/sharing
    .replace(/Share on (Twitter|Facebook|LinkedIn)/gi, "")
    .replace(/Follow us on/gi, "");

  // Apply platform-specific cleaning
  switch (docType) {
    case "docusaurus":
      cleaned = cleaned
        .replace(/\[Skip to main content\]\([^)]*\)/gi, "")
        .replace(/On this page\n/gi, "")
        .replace(/#__docusaurus[^)]*\)/g, "")
        .replace(/\\#__docusaurus[^)]*\)/g, "")
        .replace(/^\s*---\s*$/gm, "");
      break;

    case "gitbook":
      cleaned = cleaned
        .replace(/Was this helpful\?[\s\S]*?/gi, "")
        .replace(/Last updated.*?ago/gi, "")
        .replace(/Powered by GitBook/gi, "");
      break;

    case "sphinx":
      cleaned = cleaned
        .replace(/Built with Sphinx[\s\S]*?\./gi, "")
        .replace(/sphinx-build/gi, "")
        .replace(/\[source\]/gi, "");
      break;

    case "vitepress":
      cleaned = cleaned
        .replace(/Edit this page on GitHub/gi, "")
        .replace(/Last updated:/gi, "");
      break;

    case "notion":
      cleaned = cleaned
        .replace(/\bShare\b/g, "")
        .replace(/\bDuplicate\b/g, "")
        .replace(/notion\.so/gi, "");
      break;

    case "mkdocs":
      cleaned = cleaned.replace(/Created with Material for MkDocs/gi, "");
      break;
  }

  // Final universal cleanup
  return (
    cleaned
      // Remove excessive whitespace
      .replace(/\n{4,}/g, "\n\n\n")
      .replace(/[ \t]+$/gm, "")
      .replace(/^\s*[-=]{3,}\s*$/gm, "") // Remove separator lines

      // Clean up markdown artifacts
      .replace(/\\\]/g, "]")
      .replace(/\\\(/g, "(")
      .replace(/\\\)/g, ")")
      .replace(/\\\*/g, "*")

      // Remove empty lines at start/end
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
