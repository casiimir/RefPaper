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
      // Check if free user has reached their monthly limit
      const questionsThisMonth = await convex.query(api.usage.getCurrentMonthUsage, {});

      if (questionsThisMonth >= 20) {
        return NextResponse.json(
          {
            error: "Monthly question limit reached",
            message: "You've reached your limit of 20 questions per month. Upgrade to Pro for unlimited questions.",
            questionsUsed: questionsThisMonth,
            limit: 20
          },
          { status: 429 }
        );
      }
    }

    // Increment usage counter (for billing tracking)
    if (!hasPro) {
      await convex.mutation(api.usage.incrementUsage, {});
    }

    // Add user message
    await convex.mutation(api.messages.addMessage, {
      assistantId: assistantId as any,
      role: "user",
      content: message,
    });

    try {
      // Query assistant with RAG pipeline (no conversation history for cost optimization)
      const response = await queryAssistant(
        assistant.pineconeNamespace,
        message,
        [], // Empty conversation history to reduce costs by 85%+
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
