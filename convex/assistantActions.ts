"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { crawlDocumentation } from "../lib/firecrawl";
import { createAssistantWithConvexDocs } from "../lib/pinecone";
import { Document } from "@/types/document";

export const processAssistantCreation = internalAction({
  args: {
    assistantId: v.id("assistants"),
    docsUrl: v.string(),
    name: v.string(),
    userPlan: v.union(v.literal("free"), v.literal("pro")),
  },
  handler: async (ctx, { assistantId, docsUrl, name, userPlan }) => {
    try {
      // Update status to crawling
      await ctx.runMutation(internal.assistants.updateAssistantStatus, {
        id: assistantId,
        status: "crawling",
      });

      // Step 1: Crawl documentation
      // Use the userPlan passed from API route (where Clerk plan is checked)

      const documents: Document[] = await crawlDocumentation(docsUrl, {}, userPlan);

      if (documents.length === 0) {
        throw new Error("No documents found during crawling");
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
      const documentIds: string[] = await ctx.runMutation(internal.documents.createDocuments, {
        assistantId,
        documents: documents.map((doc) => ({
          sourceUrl: doc.sourceUrl,
          title: doc.title || "Untitled",
          fullContent: doc.content,
        })),
      });

      await ctx.runMutation(internal.assistants.updateAssistantStatus, {
        id: assistantId,
        status: "processing",
        totalPages: documents.length,
        processedPages: 0,
      });

      // Step 2.2: Create assistant with Pinecone (external API call)
      const result: any = await createAssistantWithConvexDocs(
        documents,
        documentIds,
        name
      );

      // Final success status update
      await ctx.runMutation(internal.assistants.updateAssistantStatus, {
        id: assistantId,
        status: "ready",
        pineconeNamespace: result.namespace,
        totalPages: result.documentsCount,
        processedPages: result.documentsCount,
      });

      return {
        success: true,
        namespace: result.namespace,
        documentsCount: result.documentsCount,
        chunksCount: result.chunksCount,
      };
    } catch (error) {
      console.error("Assistant creation failed:", error);

      // Update status to error with error message
      await ctx.runMutation(internal.assistants.updateAssistantStatus, {
        id: assistantId,
        status: "error",
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  },
});