import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { queryAssistant } from "@/lib/pinecone";
import { createAuthenticatedConvexClient } from "@/lib/convex-client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getAuth(req);
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

    // Check usage limits
    const usage = await convex.query(api.usage.getUserUsage, {});
    const limit = usage.limits.questionsPerMonth;

    if (usage.questionsThisMonth >= limit) {
      return NextResponse.json(
        {
          error: `Monthly question limit (${limit}) reached. Please upgrade or wait for reset.`,
        },
        { status: 429 }
      );
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
      // Query assistant with Convex client for full content retrieval
      const response = await queryAssistant(
        assistant.pineconeNamespace,
        message,
        conversationHistory,
        {},
        convex
      );

      if ("answer" in response && response.answer) {
        // Add assistant response
        await convex.mutation(api.messages.addMessage, {
          assistantId: assistantId as any,
          role: "assistant",
          content: response.answer,
          sources: response.sources.map((source: any) => ({
            url: source.sourceUrl,
            title: source.title,
            preview: source.preview,
          })),
        });

        // Increment user question count
        await convex.mutation(api.messages.incrementUserQuestionCount, {
          userId,
        });

        return NextResponse.json({
          success: true,
          answer: response.answer,
          sources: response.sources,
        });
      } else {
        throw new Error("No answer received from assistant");
      }
    } catch (error) {
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
