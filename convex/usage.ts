import { mutation, query, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Queries
export const getUserUsage = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const usage = await ctx.db
      .query("userUsage")
      .withIndex("by_user", (q: any) => q.eq("userId", identity.subject))
      .first();

    // Return default if no usage record exists
    if (!usage) {
      return {
        plan: "free" as const,
        assistantsCount: 0,
        questionsThisMonth: 0,
        planResetDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        limits: {
          assistants: 2,
          questionsPerMonth: 20,
        },
      };
    }

    // Check if monthly counter should reset (read-only check)
    const now = Date.now();
    const shouldReset = now > usage.planResetDate;

    return {
      ...usage,
      questionsThisMonth: shouldReset ? 0 : usage.questionsThisMonth,
      planResetDate: shouldReset ? now + 30 * 24 * 60 * 60 * 1000 : usage.planResetDate,
      limits: {
        assistants: usage.plan === "free" ? 2 : 30,
        questionsPerMonth: usage.plan === "free" ? 20 : Infinity,
      },
    };
  },
});

export const getUserUsageInternal = internalQuery({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, { userId }) => {
    if (!userId) {
      return {
        plan: "free" as const,
        assistantsCount: 0,
        questionsThisMonth: 0,
      };
    }

    const usage = await ctx.db
      .query("userUsage")
      .withIndex("by_user", (q: any) => q.eq("userId", userId))
      .first();

    if (!usage) {
      return {
        plan: "free" as const,
        assistantsCount: 0,
        questionsThisMonth: 0,
      };
    }

    return usage;
  },
});

// Mutations
export const upgradeToPro = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const usage = await ctx.db
      .query("userUsage")
      .withIndex("by_user", (q: any) => q.eq("userId", identity.subject))
      .first();

    if (!usage) {
      // Create new pro usage record
      await ctx.db.insert("userUsage", {
        userId: identity.subject,
        plan: "pro",
        assistantsCount: 0,
        questionsThisMonth: 0,
        planResetDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      // Update existing record to pro
      await ctx.db.patch(usage._id, {
        plan: "pro",
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

export const downgradeToFree = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const usage = await ctx.db
      .query("userUsage")
      .withIndex("by_user", (q: any) => q.eq("userId", identity.subject))
      .first();

    if (usage) {
      await ctx.db.patch(usage._id, {
        plan: "free",
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

export const resetMonthlyUsage = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const usage = await ctx.db
      .query("userUsage")
      .withIndex("by_user", (q: any) => q.eq("userId", identity.subject))
      .first();

    if (usage) {
      await ctx.db.patch(usage._id, {
        questionsThisMonth: 0,
        planResetDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
        updatedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

