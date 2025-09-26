import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get or create usage record for current month
export const getCurrentMonthUsage = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const existingUsage = await ctx.db
      .query("usage")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", identity.subject).eq("month", month)
      )
      .first();

    return existingUsage ? existingUsage.questionsUsed : 0;
  },
});

// Increment usage counter
export const incrementUsage = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const now = Date.now();
    const date = new Date(now);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    const existingUsage = await ctx.db
      .query("usage")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", identity.subject).eq("month", month)
      )
      .first();

    if (existingUsage) {
      // Update existing record
      await ctx.db.patch(existingUsage._id, {
        questionsUsed: existingUsage.questionsUsed + 1,
        updatedAt: now,
      });
      return existingUsage.questionsUsed + 1;
    } else {
      // Create new record
      await ctx.db.insert("usage", {
        userId: identity.subject,
        month,
        questionsUsed: 1,
        createdAt: now,
        updatedAt: now,
      });
      return 1;
    }
  },
});

// Get usage history for analytics (optional)
export const getUsageHistory = query({
  args: { months: v.optional(v.number()) },
  handler: async (ctx, { months = 6 }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    return await ctx.db
      .query("usage")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(months);
  },
});