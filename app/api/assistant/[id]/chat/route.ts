import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { queryAssistant } from "@/lib/pinecone";
import { withAuth } from "@/lib/api-middleware";
import { checkChatMessageLimits } from "@/lib/plan-utils";
import { ERROR_MESSAGES, PLAN_LIMITS } from "@/lib/constants";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate user and create Convex client
    const authResult = await withAuth(req);
    if (!authResult.success) {
      return authResult.response;
    }

    const { context } = authResult;
    const { id: assistantId } = await params;
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.MESSAGE_REQUIRED },
        { status: 400 }
      );
    }

    // Get assistant and verify ownership
    const assistant = await context.convex.query(api.assistants.getAssistant, {
      id: assistantId as any,
    });

    if (assistant.status !== "ready") {
      return NextResponse.json(
        { error: ERROR_MESSAGES.ASSISTANT_NOT_READY },
        { status: 400 }
      );
    }

    if (!assistant.pineconeNamespace) {
      return NextResponse.json(
        { error: "Assistant namespace not found" },
        { status: 400 }
      );
    }

    // Check chat message limits
    const limitCheck = await checkChatMessageLimits(context);
    if (!limitCheck.canProceed) {
      return NextResponse.json(
        {
          error: limitCheck.error?.type === "question_limit" ? "Monthly question limit reached" : limitCheck.error?.message,
          message: `You've reached your limit of ${PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH} questions per month. Upgrade to Pro for unlimited questions.`,
          questionsUsed: limitCheck.error?.questionsUsed,
          limit: limitCheck.error?.limit
        },
        { status: 429 }
      );
    }

    // Increment usage counter (for billing tracking)
    if (!context.isPro) {
      await context.convex.mutation(api.usage.incrementUsage, {});
    }

    // Add user message
    await context.convex.mutation(api.messages.addMessage, {
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
        context.convex
      );


      if ("answer" in response && response.answer) {
        // Add assistant response with sources
        await context.convex.mutation(api.messages.addMessage, {
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
      await context.convex.mutation(api.messages.addMessage, {
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
      { error: ERROR_MESSAGES.FAILED_TO_SEND },
      { status: 500 }
    );
  }
}
