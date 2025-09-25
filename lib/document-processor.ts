import { crawlDocumentation } from "@/lib/firecrawl";
import { createAssistant } from "@/lib/pinecone";
import {
  Document,
  AssistantCreationResult,
  ProgressCallback,
} from "@/types/document";

/**
 * Complete pipeline: crawl documentation → create AI assistant
 */
export async function createAssistantFromUrl(
  docsUrl: string,
  assistantName: string,
  callbacks?: ProgressCallback
): Promise<AssistantCreationResult> {
  try {
    // Step 1: Crawl documentation
    callbacks?.onProgress?.("crawling", 0, 3);
    const documents: Document[] = await crawlDocumentation(docsUrl);

    if (documents.length === 0) {
      throw new Error("No documents found during crawling");
    }

    callbacks?.onProgress?.("crawling", 1, 3);

    // Step 2: Create assistant with vector embeddings
    callbacks?.onProgress?.("processing", 1, 3);
    const result = await createAssistant(documents, assistantName, callbacks);

    callbacks?.onProgress?.("completed", 3, 3);
    return result;
  } catch (error) {
    console.error("Failed to create assistant from URL:", error);
    throw error;
  }
}

/**
 * Validate URL before processing
 */
export function isValidDocumentationUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // Must be http/https
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return false;
    }

    // Common documentation patterns
    const docPatterns = [
      /docs?\./,
      /documentation/,
      /guide/,
      /manual/,
      /wiki/,
      /help/,
      /reference/,
      /api/,
    ];

    const urlString = url.toLowerCase();
    return (
      docPatterns.some((pattern) => pattern.test(urlString)) ||
      urlString.includes("/docs") ||
      urlString.includes("/guide")
    );
  } catch {
    return false;
  }
}

/**
 * Extract domain name for display purposes
 */
export function extractDomainName(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url;
  }
}
