import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { withAuth } from "@/lib/api-middleware";
import { checkAssistantCreationLimits } from "@/lib/plan-utils";
import { ERROR_MESSAGES } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    // Authenticate user and create Convex client
    const authResult = await withAuth(req);
    if (!authResult.success) {
      return authResult.response;
    }

    const { context } = authResult;
    const { name, docsUrl, description } = await req.json();

    // Validate required fields
    if (!name || !docsUrl) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.NAME_DOCSURL_REQUIRED },
        { status: 400 }
      );
    }

    // Check plan limits
    const limitCheck = await checkAssistantCreationLimits(context);
    if (!limitCheck.canProceed) {
      return NextResponse.json(limitCheck.error, { status: 403 });
    }

    // Create assistant record first
    const assistantId = await context.convex.mutation(
      api.assistants.createAssistantRecord,
      {
        name,
        docsUrl,
        description,
      }
    );

    // Trigger Convex Action for background processing (20+ minute timeout)
    await context.convex.mutation(api.assistants.triggerAssistantCreation, {
      assistantId,
      docsUrl,
      name,
      userPlan: context.isPro ? "pro" : "free",
    });

    return NextResponse.json({
      success: true,
      assistantId,
      status: "creating",
    });
  } catch (error) {
    console.error("Failed to create assistant:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.FAILED_TO_CREATE },
      { status: 500 }
    );
  }
}
