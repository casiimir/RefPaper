import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Queue management functions

/**
 * Add an assistant to the crawl queue
 */
export const addToQueue = internalMutation({
  args: {
    assistantId: v.id("assistants"),
    priority: v.optional(v.number()),
    userPlan: v.optional(v.union(v.literal("free"), v.literal("pro"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if already in queue
    const existingQueueItem = await ctx.db
      .query("crawlQueue")
      .withIndex("by_assistant", (q) => q.eq("assistantId", args.assistantId))
      .first();

    if (existingQueueItem) {
      // Update existing queue item
      await ctx.db.patch(existingQueueItem._id, {
        status: "pending",
        priority: args.priority ?? 0,
        userPlan: args.userPlan || "free",
        retryCount: 0,
        nextAttemptAt: now,
        updatedAt: now,
      });
      return existingQueueItem._id;
    } else {
      // Create new queue item
      const queueId = await ctx.db.insert("crawlQueue", {
        assistantId: args.assistantId,
        status: "pending",
        priority: args.priority ?? 0,
        userPlan: args.userPlan || "free",
        retryCount: 0,
        nextAttemptAt: now,
        createdAt: now,
        updatedAt: now,
      });
      return queueId;
    }
  },
});

/**
 * Get the next item to process from the queue
 */
export const getNextQueueItem = internalQuery({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Find the next pending item with highest priority (lowest number)
    // that is ready to be processed (nextAttemptAt <= now)
    return await ctx.db
      .query("crawlQueue")
      .withIndex("by_status_priority", (q) => q.eq("status", "pending"))
      .filter((q) => q.lte(q.field("nextAttemptAt"), now))
      .order("asc")
      .first();
  },
});

/**
 * Mark a queue item as processing
 */
export const markAsProcessing = internalMutation({
  args: {
    queueId: v.id("crawlQueue"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.queueId, {
      status: "processing",
      lastAttemptAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Mark a queue item as completed
 */
export const markAsCompleted = internalMutation({
  args: {
    queueId: v.id("crawlQueue"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.queueId, {
      status: "completed",
      updatedAt: now,
    });
  },
});

/**
 * Mark a queue item as failed with retry logic
 */
export const markAsFailed = internalMutation({
  args: {
    queueId: v.id("crawlQueue"),
    errorMessage: v.string(),
    isRateLimit: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const queueItem = await ctx.db.get(args.queueId);

    if (!queueItem) {
      throw new Error("Queue item not found");
    }

    const newRetryCount = queueItem.retryCount + 1;
    const maxRetries = args.isRateLimit ? 5 : 3; // More retries for rate limits

    if (newRetryCount <= maxRetries) {
      // Calculate next attempt time with exponential backoff
      let backoffDelay: number;

      if (args.isRateLimit) {
        // For rate limits, use longer delays: 1min, 2min, 4min, 8min, 16min
        backoffDelay = Math.min(60000 * Math.pow(2, newRetryCount - 1), 16 * 60000);
      } else {
        // For other errors, use shorter delays: 30s, 1min, 2min
        backoffDelay = Math.min(30000 * Math.pow(2, newRetryCount - 1), 2 * 60000);
      }

      const nextAttemptAt = now + backoffDelay;

      await ctx.db.patch(args.queueId, {
        status: "pending",
        retryCount: newRetryCount,
        errorMessage: args.errorMessage,
        nextAttemptAt,
        updatedAt: now,
      });
    } else {
      // Max retries reached, mark as permanently failed
      await ctx.db.patch(args.queueId, {
        status: "failed",
        retryCount: newRetryCount,
        errorMessage: args.errorMessage,
        updatedAt: now,
      });
    }
  },
});

/**
 * Remove an item from the queue (for cancellation)
 */
export const removeFromQueue = internalMutation({
  args: {
    assistantId: v.id("assistants"),
  },
  handler: async (ctx, args) => {
    const queueItem = await ctx.db
      .query("crawlQueue")
      .withIndex("by_assistant", (q) => q.eq("assistantId", args.assistantId))
      .first();

    if (queueItem) {
      await ctx.db.delete(queueItem._id);
    }
  },
});

/**
 * Get a queue item by ID (internal use)
 */
export const getQueueItemById = internalQuery({
  args: {
    queueId: v.id("crawlQueue"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.queueId);
  },
});

/**
 * Get queue position for an assistant
 */
export const getQueuePosition = query({
  args: {
    assistantId: v.id("assistants"),
  },
  handler: async (ctx, args) => {
    const queueItem = await ctx.db
      .query("crawlQueue")
      .withIndex("by_assistant", (q) => q.eq("assistantId", args.assistantId))
      .first();

    if (!queueItem || queueItem.status !== "pending") {
      return null;
    }

    // Count items ahead in queue (higher priority or same priority but earlier)
    const itemsAhead = await ctx.db
      .query("crawlQueue")
      .withIndex("by_status_priority", (q) => q.eq("status", "pending"))
      .filter((q) =>
        q.or(
          q.lt(q.field("priority"), queueItem.priority),
          q.and(
            q.eq(q.field("priority"), queueItem.priority),
            q.lt(q.field("createdAt"), queueItem.createdAt)
          )
        )
      )
      .collect();

    return {
      position: itemsAhead.length + 1,
      totalPending: itemsAhead.length + 1,
      estimatedWaitTime: Math.max(0, itemsAhead.length * 2), // 2 minutes per item estimate
      nextAttemptAt: queueItem.nextAttemptAt,
    };
  },
});

/**
 * Clean up old completed/failed queue items (older than 1 hour)
 */
export const cleanupOldQueueItems = internalMutation({
  args: {},
  handler: async (ctx) => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1 hour ago

    // Find old completed/failed items
    const oldItems = await ctx.db
      .query("crawlQueue")
      .filter((q) =>
        q.and(
          q.or(
            q.eq(q.field("status"), "completed"),
            q.eq(q.field("status"), "failed")
          ),
          q.lt(q.field("updatedAt"), oneHourAgo)
        )
      )
      .collect();

    // Delete old items
    for (const item of oldItems) {
      await ctx.db.delete(item._id);
    }

    return { cleaned: oldItems.length };
  },
});


/**
 * Process queue - scheduled function to handle queued items
 */
export const processQueue = internalMutation({
  args: {},
  handler: async (ctx): Promise<any> => {
    try {
      // Check if there are any items currently being processed
      const processingItems = await ctx.db
        .query("crawlQueue")
        .withIndex("by_status_priority", (q) => q.eq("status", "processing"))
        .collect();

      const now = Date.now();
      const timeoutDuration = 10 * 60 * 1000; // 10 minutes timeout

      // Check for stuck processing items and reset them
      for (const item of processingItems) {
        if (item.lastAttemptAt && (now - item.lastAttemptAt) > timeoutDuration) {
          await ctx.runMutation(internal.crawlQueue.markAsFailed, {
            queueId: item._id,
            errorMessage: "Processing timeout - item was stuck",
            isRateLimit: false,
          });
        }
      }

      // Re-check processing items after timeout cleanup
      const activeProcessingItems = await ctx.db
        .query("crawlQueue")
        .withIndex("by_status_priority", (q) => q.eq("status", "processing"))
        .collect();

      // Don't start new items if we already have one actively processing
      if (activeProcessingItems.length > 0) {
        return {
          action: "skipped",
          reason: "Another item is currently processing",
          processingCount: activeProcessingItems.length
        };
      }

      const nextItem: any = await ctx.runQuery(internal.crawlQueue.getNextQueueItem);

      if (!nextItem) {
        return { action: "no_items", message: "No items to process" };
      }

      // Double-check the item is still pending (race condition protection)
      const currentItem: any = await ctx.db.get(nextItem._id);
      if (!currentItem || currentItem.status !== "pending") {
        return {
          action: "item_changed",
          message: "Item status changed since query"
        };
      }

      // Mark as processing
      await ctx.runMutation(internal.crawlQueue.markAsProcessing, {
        queueId: nextItem._id,
      });

      // Get assistant details
      const assistant: any = await ctx.db.get(nextItem.assistantId);
      if (!assistant) {
        await ctx.runMutation(internal.crawlQueue.markAsFailed, {
          queueId: nextItem._id,
          errorMessage: "Assistant not found",
        });
        return {
          action: "failed",
          reason: "Assistant not found",
          queueId: nextItem._id
        };
      }

      // Check if assistant was cancelled
      if (assistant.status !== "queued") {
        await ctx.runMutation(internal.crawlQueue.markAsFailed, {
          queueId: nextItem._id,
          errorMessage: "Assistant was cancelled or is not in queued state",
        });
        return {
          action: "failed",
          reason: "Assistant not in queued state",
          assistantStatus: assistant.status
        };
      }

      // Schedule the actual crawling
      await ctx.scheduler.runAfter(0, internal.assistantActions.processAssistantCrawl, {
        assistantId: assistant._id,
        queueId: nextItem._id,
      });

      return {
        action: "started",
        assistantId: assistant._id,
        queueId: nextItem._id,
        assistantName: assistant.name
      };

    } catch (error) {
      console.error("Error in processQueue:", error);
      return {
        action: "error",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },
});