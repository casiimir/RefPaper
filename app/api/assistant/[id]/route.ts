import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { withAuth } from "@/lib/api-middleware";
import { ERROR_MESSAGES } from "@/lib/constants";

export async function DELETE(
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

    // Verify the assistant exists and belongs to the user
    const assistant = await context.convex.query(api.assistants.getAssistant, {
      id: assistantId as Id<"assistants">,
    });

    if (!assistant) {
      return NextResponse.json(
        { error: "Assistant not found" },
        { status: 404 }
      );
    }

    // Delete the assistant (this will also clean up Pinecone namespace and documents)
    await context.convex.mutation(api.assistants.deleteAssistantRecord, {
      id: assistantId as Id<"assistants">,
    });

    return NextResponse.json({
      success: true,
      message: "Assistant cancelled and removed successfully",
    });
  } catch (error) {
    console.error("Failed to cancel assistant:", error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.FAILED_TO_CREATE },
      { status: 500 }
    );
  }
}