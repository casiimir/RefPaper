import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";

export const getDocumentsByIds = query({
  args: { documentIds: v.array(v.id("documents")) },
  handler: async (ctx, { documentIds }) => {
    const documents = await Promise.all(
      documentIds.map(async (id) => {
        const doc = await ctx.db.get(id);
        if (!doc) return null;

        return {
          ...doc,
          fullContent: "",
        };
      })
    );
    return documents.filter((doc) => doc !== null);
  },
});

export const createDocuments = internalMutation({
  args: {
    assistantId: v.id("assistants"),
    documents: v.array(
      v.object({
        sourceUrl: v.string(),
        title: v.string(),
        fullContent: v.string(),
      })
    ),
  },
  handler: async (ctx, { assistantId, documents }) => {
    const now = Date.now();
    const documentIds = await Promise.all(
      documents.map(async (doc) => {
        return await ctx.db.insert("documents", {
          assistantId,
          sourceUrl: doc.sourceUrl,
          title: doc.title,
          createdAt: now,
        });
      })
    );
    return documentIds;
  },
});


export const deleteDocumentsByAssistant = internalMutation({
  args: { assistantId: v.id("assistants") },
  handler: async (ctx, { assistantId }) => {
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_assistant", (q) => q.eq("assistantId", assistantId))
      .collect();

    for (const doc of documents) {
      await ctx.db.delete(doc._id);
    }
  },
});