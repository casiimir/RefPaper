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
    publicShareId: v.optional(v.string()), // For sharing: /assistant/abc123
    lastCrawledAt: v.optional(v.number()), // For re-crawl functionality
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_public_share", ["publicShareId"])
    .index("by_status", ["status"]),

  messages: defineTable({
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
    createdAt: v.number(),
  })
    .index("by_assistant", ["assistantId"])
    .index("by_assistant_date", ["assistantId", "createdAt"]),

  documents: defineTable({
    assistantId: v.id("assistants"),
    sourceUrl: v.string(),
    title: v.string(),
    fileStorageId: v.optional(v.id("_storage")),
    createdAt: v.number(),
  }).index("by_assistant", ["assistantId"]),

});