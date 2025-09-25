import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  assistants: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    docsUrl: v.string(),
    userId: v.string(),
    status: v.union(
      v.literal("creating"),
      v.literal("crawling"),
      v.literal("processing"),
      v.literal("ready"),
      v.literal("error")
    ),
    errorMessage: v.optional(v.string()),
    pineconeNamespace: v.optional(v.string()),
    totalPages: v.optional(v.number()),
    processedPages: v.optional(v.number()),
    isPublic: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  chats: defineTable({
    assistantId: v.id("assistants"),
    userId: v.string(),
    title: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_assistant", ["assistantId"])
    .index("by_user", ["userId"]),

  messages: defineTable({
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    sources: v.optional(
      v.array(
        v.object({
          url: v.string(),
          title: v.string(),
          content: v.string(),
          score: v.optional(v.number()),
        })
      )
    ),
    createdAt: v.number(),
  }).index("by_chat", ["chatId"]),

  crawlJobs: defineTable({
    assistantId: v.id("assistants"),
    firecrawlJobId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("waiting"),
      v.literal("completed"),
      v.literal("failed")
    ),
    totalPages: v.optional(v.number()),
    processedPages: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_assistant", ["assistantId"]),
});