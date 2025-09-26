import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { createAuthenticatedConvexClient } from "@/lib/convex-client";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuth(req);
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
