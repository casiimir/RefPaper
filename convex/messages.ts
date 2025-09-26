import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Queries
export const getMessages = query({
  args: { assistantId: v.id("assistants") },
  handler: async (ctx, { assistantId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Check if user owns the assistant or if it's public
    const assistant = await ctx.db.get(assistantId);
    if (!assistant) {
      throw new Error("Assistant not found");
    }

    if (assistant.userId !== identity.subject && !assistant.isPublic) {
      throw new Error("Unauthorized");
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_assistant_date", (q) => q.eq("assistantId", assistantId))
      .order("asc")
      .collect();
  },
});

// Mutations
export const addMessage = mutation({
  args: {
    assistantId: v.id("assistants"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    sources: v.optional(
      v.array(
        v.object({
          url: v.string(),
          title: v.string(),
          preview: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      ...args,
      createdAt: Date.now(),
    });

    return messageId;
  },
});

export const incrementUserQuestionCount = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const usage = await ctx.db
      .query("userUsage")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (usage) {
      await ctx.db.patch(usage._id, {
        questionsThisMonth: usage.questionsThisMonth + 1,
        updatedAt: Date.now(),
      });
    }
  },
});

export const clearMessages = mutation({
  args: { assistantId: v.id("assistants") },
  handler: async (ctx, { assistantId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Verify ownership
    const assistant = await ctx.db.get(assistantId);
    if (!assistant || assistant.userId !== identity.subject) {
      throw new Error("Assistant not found or unauthorized");
    }

    // Delete all messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_assistant", (q) => q.eq("assistantId", assistantId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    return { success: true };
  },
});