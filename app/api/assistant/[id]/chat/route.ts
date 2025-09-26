import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { queryAssistant } from "@/lib/pinecone";
import { createAuthenticatedConvexClient } from "@/lib/convex-client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, has } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create authenticated Convex client
    const convex = await createAuthenticatedConvexClient(req);

    const { id: assistantId } = await params;
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get assistant and verify ownership
    const assistant = await convex.query(api.assistants.getAssistant, {
      id: assistantId as any,
    });

    if (assistant.status !== "ready") {
      return NextResponse.json(
        { error: "Assistant is not ready yet" },
        { status: 400 }
      );
    }

    if (!assistant.pineconeNamespace) {
      return NextResponse.json(
        { error: "Assistant namespace not found" },
        { status: 400 }
      );
    }

    // Check if user has pro plan for unlimited questions
    const hasPro = has({ plan: "pro" });

    if (!hasPro) {
      // Free users have 20 questions/month limit enforced by Clerk billing
      // No manual tracking needed - Clerk handles subscription limits
    }

    // Add user message
    await convex.mutation(api.messages.addMessage, {
      assistantId: assistantId as any,
      role: "user",
      content: message,
    });

    // Get conversation history
    const messages = await convex.query(api.messages.getMessages, {
      assistantId: assistantId as any,
    });
    const conversationHistory = messages.slice(-10).map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      // Query assistant with RAG pipeline
      const response = await queryAssistant(
        assistant.pineconeNamespace,
        message,
        conversationHistory,
        {
          maxTokens: 1500,
          stream: false,
        },
        convex
      );

      if ("answer" in response && response.answer) {
        // Add assistant response with sources
        await convex.mutation(api.messages.addMessage, {
          assistantId: assistantId as any,
          role: "assistant",
          content: response.answer,
          sources: response.sources.map((source: any) => ({
            url: source.sourceUrl,
            title: source.title,
            preview: source.preview || source.title || "Documentation snippet",
          })),
        });

        return NextResponse.json({
          success: true,
          answer: response.answer,
          sources: response.sources.map((source: any) => ({
            url: source.sourceUrl,
            title: source.title,
            preview: source.preview || source.title || "Documentation snippet",
          })),
          tokensUsed: response.tokensUsed,
        });
      } else {
        throw new Error("No answer received from assistant");
      }
    } catch (error) {
      console.error("RAG pipeline error:", error);

      // Add error message
      await convex.mutation(api.messages.addMessage, {
        assistantId: assistantId as any,
        role: "assistant",
        content:
          "I'm sorry, I encountered an error while processing your request. Please try again.",
      });

      throw error;
    }
  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
