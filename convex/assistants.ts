import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// Plan limits are now handled by Clerk billing system in API routes

// Helper to generate share ID
const generateShareId = (): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${randomId}`;
};

// Queries
export const getAssistants = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db
      .query("assistants")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});

export const getAssistant = query({
  args: { id: v.id("assistants") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    try {
      const assistant = await ctx.db.get(id);
      if (!assistant || assistant.userId !== identity.subject) {
        return null;
      }
      return assistant;
    } catch (error) {
      // Invalid ID format or other errors - return null for 404 handling
      return null;
    }
  },
});

// Safe version that accepts string and validates internally
export const getAssistantSafe = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Basic validation - Convex IDs should be at least 16 chars and alphanumeric with _ and -
    if (!id || id.length < 16 || !/^[a-zA-Z0-9_-]+$/.test(id)) {
      return null;
    }

    try {
      // Query all user's assistants and find the one with matching ID
      const assistants = await ctx.db
        .query("assistants")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .collect();

      const assistant = assistants.find(a => a._id === id);
      return assistant || null;
    } catch (error) {
      // Invalid ID format or other errors - return null for 404 handling
      console.log("Invalid ID format:", id, error);
      return null;
    }
  },
});

// Internal version without authentication - only for use within the system
export const getAssistantInternal = internalQuery({
  args: { id: v.id("assistants") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getPublicAssistant = query({
  args: { shareId: v.string() },
  handler: async (ctx, { shareId }) => {
    const assistant = await ctx.db
      .query("assistants")
      .withIndex("by_public_share", (q) => q.eq("publicShareId", shareId))
      .filter((q) => q.eq(q.field("isPublic"), true))
      .first();

    if (!assistant) {
      throw new Error("Public assistant not found");
    }

    return assistant;
  },
});

// Mutations
export const createAssistantRecord = mutation({
  args: {
    name: v.string(),
    docsUrl: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { name, docsUrl, description }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if user has pro plan (we'll let the API route handle the plan check)
    // The API route already validates plan limits using Clerk's has() method

    const now = Date.now();

    // Create assistant record
    const assistantId = await ctx.db.insert("assistants", {
      name,
      docsUrl,
      description,
      userId: identity.subject,
      status: "creating",
      createdAt: now,
      updatedAt: now,
    });


    return assistantId;
  },
});

export const triggerAssistantCreation = mutation({
  args: {
    assistantId: v.id("assistants"),
    docsUrl: v.string(),
    name: v.string(),
    userPlan: v.union(v.literal("free"), v.literal("pro")),
  },
  handler: async (ctx, { assistantId, docsUrl, name, userPlan }) => {
    // Update assistant status to queued
    await ctx.runMutation(internal.assistants.updateAssistantStatus, {
      id: assistantId,
      status: "queued",
    });

    // Add to crawl queue with priority based on user plan
    const priority = userPlan === "pro" ? 0 : 1; // Pro users get higher priority

    await ctx.runMutation(internal.crawlQueue.addToQueue, {
      assistantId,
      priority,
      userPlan,
    });
  },
});

export const updateAssistantStatus = internalMutation({
  args: {
    id: v.id("assistants"),
    status: v.union(
      v.literal("creating"),
      v.literal("queued"),
      v.literal("crawling"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("error")
    ),
    totalPages: v.optional(v.number()),
    processedPages: v.optional(v.number()),
    pineconeNamespace: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Check if the assistant still exists before updating
    const assistant = await ctx.db.get(id);
    if (!assistant) {
      // Assistant was deleted (likely cancelled), silently ignore the update
      return;
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
      ...(updates.status === "ready" && { lastCrawledAt: Date.now() }),
    });
  },
});

export const updateAssistant = mutation({
  args: {
    id: v.id("assistants"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { id, name, description }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const assistant = await ctx.db.get(id);
    if (!assistant || assistant.userId !== identity.subject) {
      throw new Error("Assistant not found or unauthorized");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    await ctx.db.patch(id, updates);
  },
});

export const togglePublicSharing = mutation({
  args: {
    id: v.id("assistants"),
    isPublic: v.boolean(),
  },
  handler: async (ctx, { id, isPublic }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const assistant = await ctx.db.get(id);
    if (!assistant || assistant.userId !== identity.subject) {
      throw new Error("Assistant not found or unauthorized");
    }

    const updates: any = {
      isPublic,
      updatedAt: Date.now(),
    };

    // Generate share ID when making public
    if (isPublic && !assistant.publicShareId) {
      updates.publicShareId = generateShareId();
    }

    await ctx.db.patch(id, updates);
  },
});

export const deleteAssistantRecord = mutation({
  args: { id: v.id("assistants") },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const assistant = await ctx.db.get(id);
    if (!assistant || assistant.userId !== identity.subject) {
      throw new Error("Assistant not found or unauthorized");
    }

    // Delete all messages for this assistant
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_assistant", (q) => q.eq("assistantId", id))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }


    // Remove from crawl queue if exists
    await ctx.runMutation(internal.crawlQueue.removeFromQueue, {
      assistantId: id,
    });

    // Delete associated documents
    await ctx.runMutation(internal.documents.deleteDocumentsByAssistant, {
      assistantId: id,
    });

    // Delete Pinecone namespace - always try to delete the namespace based on assistant ID
    // This handles cases where the namespace was created but not yet saved to the database
    const expectedNamespace = `assistant_${id}`;
    await ctx.scheduler.runAfter(0, internal.assistantActions.deletePineconeNamespace, {
      namespace: expectedNamespace,
    });

    // Also delete the saved namespace if it's different (legacy support)
    if (assistant.pineconeNamespace && assistant.pineconeNamespace !== expectedNamespace) {
      await ctx.scheduler.runAfter(0, internal.assistantActions.deletePineconeNamespace, {
        namespace: assistant.pineconeNamespace,
      });
    }

    // Delete the assistant
    await ctx.db.delete(id);
  },
});
