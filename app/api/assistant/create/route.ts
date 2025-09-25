import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { createAssistantFromUrl } from "@/lib/document-processor";

// Helper to create authenticated Convex client
const createAuthenticatedConvexClient = async (req: NextRequest) => {
  const { getToken } = await getAuth(req);
  const token = await getToken({ template: "convex" });

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  if (token) {
    convex.setAuth(token);
  }
  return convex;
};

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

    // Start background processing with auth token
    const { getToken } = await getAuth(req);
    const authToken = await getToken({ template: "convex" });
    processAssistantCreation(assistantId, docsUrl, name, authToken);

    return NextResponse.json({
      success: true,
      assistantId,
      status: "creating",
    });
  } catch (error) {
    console.error("Failed to create assistant:", error);
    return NextResponse.json(
      {
        error: "Failed to create assistant",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Background processing function
async function processAssistantCreation(
  assistantId: any,
  docsUrl: string,
  name: string,
  authToken: string | null
) {
  // Create authenticated Convex client for background processing
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  if (authToken) {
    convex.setAuth(authToken);
  }

  try {
    // Update status to crawling
    await convex.mutation(api.assistants.updateAssistantStatus, {
      id: assistantId,
      status: "crawling",
    });

    // Create assistant with progress callbacks
    const result = await createAssistantFromUrl(docsUrl, name, {
      onProgress: async (stage: string, completed: number, total: number) => {
        try {
          if (stage === "processing") {
            await convex.mutation(api.assistants.updateAssistantStatus, {
              id: assistantId,
              status: "processing",
              totalPages: total,
              processedPages: completed,
            });
          }
        } catch (error) {
          console.error('Failed to update progress:', error);
        }
      },
    });

    // Update final status
    await convex.mutation(api.assistants.updateAssistantStatus, {
      id: assistantId,
      status: "ready",
      pineconeNamespace: result.namespace,
      totalPages: result.documentsCount,
      processedPages: result.documentsCount,
    });
  } catch (error) {
    // Update status to error
    await convex.mutation(api.assistants.updateAssistantStatus, {
      id: assistantId,
      status: "error",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
  }
}
