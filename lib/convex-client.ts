import { NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";

// Helper to create authenticated Convex client
export const createAuthenticatedConvexClient = async (req: NextRequest) => {
  const { getToken } = await getAuth(req);
  const token = await getToken({ template: "convex" });

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  if (token) {
    convex.setAuth(token);
  }
  return convex;
};