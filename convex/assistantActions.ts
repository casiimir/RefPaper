"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { crawlDocumentation } from "../lib/firecrawl";
import {
  createAssistantWithConvexDocs,
  deleteNamespace,
} from "../lib/pinecone";
import { Document, AssistantCreationResult } from "@/types/document";
import { ERROR_MESSAGES } from "@/lib/constants";
import { isRateLimitError } from "../lib/errors";

export const processAssistantCreation = internalAction({
  args: {
    assistantId: v.id("assistants"),
    docsUrl: v.string(),
    name: v.string(),
    userPlan: v.union(v.literal("free"), v.literal("pro")),
  },
  handler: async (ctx, { assistantId, docsUrl, name, userPlan }) => {
    const startTime = Date.now();

    try {
      // Update status to crawling
      await ctx.runMutation(internal.assistants.updateAssistantStatus, {
        id: assistantId,
        status: "crawling",
      });

      // Step 1: Crawl documentation with timeout protection
      // Use the userPlan passed from API route (where Clerk plan is checked)
      const documents: Document[] = await crawlDocumentation(
        docsUrl,
        {},
        userPlan
      );

      if (documents.length === 0) {
        throw new Error("No documents found during crawling");
      }

      // Check if assistant was cancelled during crawling
      const assistantExists = await ctx.runQuery(
        internal.assistants.getAssistantInternal,
        {
          id: assistantId,
        }
      );
      if (!assistantExists) {
        return { success: false, message: "Assistant was cancelled" };
      }

      // Update status to processing with document count
      await ctx.runMutation(internal.assistants.updateAssistantStatus, {
        id: assistantId,
        status: "processing",
        totalPages: documents.length,
        processedPages: 0,
      });

      // Step 2: Create assistant with progress callbacks
      // Step 2.1: Save documents to Convex and update to processing
      const documentIds: string[] = await ctx.runMutation(
        internal.documents.createDocuments,
        {
          assistantId,
          documents: documents.map((doc) => ({
            sourceUrl: doc.sourceUrl,
            title: doc.title || "Untitled",
            fullContent: doc.content,
          })),
        }
      );

      await ctx.runMutation(internal.assistants.updateAssistantStatus, {
        id: assistantId,
        status: "processing",
        totalPages: documents.length,
        processedPages: 0,
      });

      // Check if assistant was cancelled during document processing
      const assistantStillExists = await ctx.runQuery(
        internal.assistants.getAssistantInternal,
        {
          id: assistantId,
        }
      );
      if (!assistantStillExists) {
        return { success: false, message: "Assistant was cancelled" };
      }

      // Step 2.2: Create assistant with Pinecone (external API call)
      const result: AssistantCreationResult =
        await createAssistantWithConvexDocs(
          documents,
          documentIds,
          assistantId
        );

      // Final success status update
      await ctx.runMutation(internal.assistants.updateAssistantStatus, {
        id: assistantId,
        status: "ready",
        pineconeNamespace: result.namespace,
        totalPages: result.documentsCount,
        processedPages: result.documentsCount,
      });

      const duration = (Date.now() - startTime) / 1000;

      return {
        success: true,
        namespace: result.namespace,
        documentsCount: result.documentsCount,
        chunksCount: result.chunksCount,
      };
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000;
      console.error(
        `❌ Assistant creation failed after ${duration} seconds:`,
        error
      );

      // Check if it's a timeout error and provide specific messaging
      let errorMessage = error instanceof Error ? error.message : String(error);
      const isTimeoutError =
        errorMessage.includes("timeout") ||
        errorMessage === ERROR_MESSAGES.CRAWL_TIMEOUT;

      if (isTimeoutError) {
        console.error(`⏰ Crawling timeout detected for ${docsUrl}`);
        errorMessage = ERROR_MESSAGES.CRAWL_TIMEOUT;
      }

      // Update status to error with error message
      await ctx.runMutation(internal.assistants.updateAssistantStatus, {
        id: assistantId,
        status: "error",
        errorMessage,
      });

      throw error;
    }
  },
});

/**
 * Queue-based assistant crawling with rate limit handling
 */
export const processAssistantCrawl = internalAction({
  args: {
    assistantId: v.id("assistants"),
    queueId: v.id("crawlQueue"),
  },
  handler: async (ctx, { assistantId, queueId }): Promise<any> => {
    try {
      // Get assistant details
      const assistant: any = await ctx.runQuery(
        internal.assistants.getAssistantInternal,
        {
          id: assistantId,
        }
      );

      if (!assistant) {
        await ctx.runMutation(internal.crawlQueue.markAsFailed, {
          queueId,
          errorMessage: "Assistant not found",
        });
        return;
      }

      // Update assistant status to crawling
      await ctx.runMutation(internal.assistants.updateAssistantStatus, {
        id: assistantId,
        status: "crawling",
      });

      // Get the queue item to retrieve the user plan
      const queueItem = await ctx.runQuery(
        internal.crawlQueue.getQueueItemById,
        {
          queueId,
        }
      );

      if (!queueItem) {
        await ctx.runMutation(internal.crawlQueue.markAsFailed, {
          queueId,
          errorMessage: "Queue item not found",
        });
        return;
      }

      const userPlan = queueItem.userPlan || "free"; // Fallback to free for old records

      // Perform the original crawling process
      const result: any = await ctx.runAction(
        internal.assistantActions.processAssistantCreation,
        {
          assistantId,
          docsUrl: assistant.docsUrl,
          name: assistant.name,
          userPlan,
        }
      );

      // Mark queue item as completed
      await ctx.runMutation(internal.crawlQueue.markAsCompleted, {
        queueId,
      });

      return result;
    } catch (error) {
      console.error("Queue-based crawl failed:", error);

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Check if it's a rate limit error using the centralized function
      const isRateLimit = isRateLimitError(errorMessage);

      // Mark queue item as failed with retry logic
      await ctx.runMutation(internal.crawlQueue.markAsFailed, {
        queueId,
        errorMessage,
        isRateLimit,
      });

      // Get the updated queue item to check if it was marked as permanently failed
      const updatedQueueItem = await ctx.runQuery(
        internal.crawlQueue.getQueueItemById,
        {
          queueId,
        }
      );

      if (!updatedQueueItem || updatedQueueItem.status === "failed") {
        // Max retries reached, mark assistant as error
        await ctx.runMutation(internal.assistants.updateAssistantStatus, {
          id: assistantId,
          status: "error",
          errorMessage,
        });
      } else {
        // Will be retried, keep assistant in queued state
        await ctx.runMutation(internal.assistants.updateAssistantStatus, {
          id: assistantId,
          status: "queued",
        });
      }
    }
  },
});

export const deletePineconeNamespace = internalAction({
  args: {
    namespace: v.string(),
  },
  handler: async (_, { namespace }) => {
    try {
      await deleteNamespace(namespace);
    } catch (error) {
      console.error(`Failed to delete Pinecone namespace ${namespace}:`, error);
      // Don't throw error to avoid blocking assistant deletion if Pinecone fails
    }
  },
});
