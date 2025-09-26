import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAuthenticatedConvexClient } from "@/lib/convex-client";

export interface AuthenticatedContext {
  userId: string;
  convex: Awaited<ReturnType<typeof createAuthenticatedConvexClient>>;
  isPro: boolean;
}

/**
 * Common middleware for API routes that need authentication and Convex client
 */
export async function withAuth(
  req: NextRequest
): Promise<{ success: true; context: AuthenticatedContext } | { success: false; response: NextResponse }> {
  try {
    const { userId, has } = await auth();

    if (!userId) {
      return {
        success: false,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      };
    }

    const convex = await createAuthenticatedConvexClient(req);
    const isPro = has({ plan: "pro" });

    return {
      success: true,
      context: {
        userId,
        convex,
        isPro,
      }
    };
  } catch (error) {
    console.error("Auth middleware error:", error);
    return {
      success: false,
      response: NextResponse.json(
        { error: "Authentication failed" },
        { status: 500 }
      )
    };
  }
}