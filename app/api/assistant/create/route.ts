import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { createAuthenticatedConvexClient } from "@/lib/convex-client";

export async function POST(req: NextRequest) {
  try {
    const { userId, has } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create authenticated Convex client
    const convex = await createAuthenticatedConvexClient(req);

    const { name, docsUrl, description } = await req.json();

    if (!name || !docsUrl) {
      return NextResponse.json(
        { error: "Name and docsUrl are required" },
        { status: 400 }
      );
    }

    // Check plan limits
    const hasPro = has({ plan: "pro" });
    const assistants = await convex.query(api.assistants.getAssistants, {});

    if (!hasPro) {
      // Free plan: Check monthly question limit first
      const questionsThisMonth = await convex.query(api.usage.getCurrentMonthUsage, {});
      if (questionsThisMonth >= 20) {
        return NextResponse.json(
          {
            error: "Monthly question limit reached. Upgrade to Pro for unlimited questions.",
            upgradeRequired: true,
            type: "question_limit",
            questionsUsed: questionsThisMonth,
            limit: 20
          },
          { status: 403 }
        );
      }

      // Free plan: 3 assistants max
      if (assistants.length >= 3) {
        return NextResponse.json(
          {
            error: "Free plan limited to 3 assistants. Upgrade to Pro for 20 assistants.",
            upgradeRequired: true,
            type: "assistant_limit",
          },
          { status: 403 }
        );
      }
    } else {
      // Pro plan: 20 assistants max
      if (assistants.length >= 20) {
        return NextResponse.json(
          {
            error: "Pro plan limited to 20 assistants total.",
            upgradeRequired: false,
            type: "assistant_limit",
          },
          { status: 403 }
        );
      }
    }

    // Create assistant record first
    const assistantId = await convex.mutation(
      api.assistants.createAssistantRecord,
      {
        name,
        docsUrl,
        description,
      }
    );

    // Trigger Convex Action for background processing (20+ minute timeout)
    await convex.mutation(api.assistants.triggerAssistantCreation, {
      assistantId,
      docsUrl,
      name,
      userPlan: hasPro ? "pro" : "free",
    });

    return NextResponse.json({
      success: true,
      assistantId,
      status: "creating",
    });
  } catch (error) {
    console.error("Failed to create assistant:", error);
    return NextResponse.json(
      { error: "Failed to create assistant" },
      { status: 500 }
    );
  }
}
