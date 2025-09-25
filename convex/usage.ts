import { mutation, query } from "./_generated/server";

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
          questionsPerMonth: 10,
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
        assistants: usage.plan === "free" ? 2 : Infinity,
        questionsPerMonth: usage.plan === "free" ? 10 : 500,
      },
    };
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

// Admin queries (for future use)
export const getAllUsageStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // TODO: Add admin role check when implementing admin features
    // For now, anyone can see basic stats

    const allUsage = await ctx.db.query("userUsage").collect();

    const stats = {
      totalUsers: allUsage.length,
      freeUsers: allUsage.filter(u => u.plan === "free").length,
      proUsers: allUsage.filter(u => u.plan === "pro").length,
      totalAssistants: allUsage.reduce((sum, u) => sum + u.assistantsCount, 0),
      totalQuestionsThisMonth: allUsage.reduce((sum, u) => sum + u.questionsThisMonth, 0),
    };

    return stats;
  },
});