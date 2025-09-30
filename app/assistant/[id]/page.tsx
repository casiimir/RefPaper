"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { AssistantSidebar } from "@/components/chat/AssistantSidebar";
import { Navbar } from "@/components/navbar";
import { redirect, notFound } from "next/navigation";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Assistant } from "@/types/assistant";

// Hook wrapper to safely handle Convex queries that might fail
function useSafeQuery<T>(query: unknown, args: unknown): T | null | undefined {
  try {
    return useQuery(query as Parameters<typeof useQuery>[0], args as Parameters<typeof useQuery>[1]);
  } catch (error) {
    console.error("Query error:", error);
    return null;
  }
}

export default function AssistantPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const params = useParams();
  const assistantId = params.id as string;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Basic validation before querying
  const isBasicValidId = assistantId && assistantId.length >= 16 && /^[a-zA-Z0-9_-]+$/.test(assistantId);

  // If ID format is clearly invalid, show 404 immediately
  useEffect(() => {
    if (isLoaded && assistantId && !isBasicValidId) {
      notFound();
    }
  }, [isLoaded, assistantId, isBasicValidId]);

  // Use safe query wrapper only for potentially valid IDs
  const assistant = useSafeQuery<Assistant>(
    api.assistants.getAssistantSafe,
    isLoaded && isSignedIn && isBasicValidId ? { id: assistantId } : "skip"
  );

  const assistants = useQuery(
    api.assistants.getAssistants,
    isLoaded && isSignedIn ? {} : "skip"
  );

  // Handle mobile detection and sidebar state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile); // Default open on desktop, closed on mobile
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex flex-col h-screen w-full bg-background">
        <div className="h-14 border-b bg-background">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="flex flex-1 overflow-hidden pt-14">
          <div className="w-80 border-r bg-background p-4 space-y-4">
            <Skeleton className="h-8 w-32" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t p-4">
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    redirect("/sign-in");
  }

  if (assistant === undefined || assistants === undefined) {
    return (
      <div className="flex flex-col h-screen w-full bg-background">
        <Navbar />
        <div className="flex flex-1 overflow-hidden pt-14">
          <div className="w-80 border-r bg-background p-4 space-y-4">
            <Skeleton className="h-8 w-32" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t p-4">
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (assistant === null) {
    notFound();
  }

  // Type guard to ensure assistant is not null/undefined before rendering
  if (!assistant || typeof assistant !== 'object' || !assistant._id) {
    return (
      <div className="flex flex-col h-screen w-full bg-background">
        <Navbar />
        <div className="flex flex-1 overflow-hidden pt-14">
          <div className="w-80 border-r bg-background p-4 space-y-4">
            <Skeleton className="h-8 w-32" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t p-4">
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      {/* Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden pt-14">
        {/* Sidebar */}
        <AssistantSidebar
          assistants={assistants}
          currentAssistantId={assistantId}
          isOpen={sidebarOpen}
          isMobile={isMobile}
          onClose={() => setSidebarOpen(false)}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Mobile Backdrop */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Chat Content */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <ChatInterface assistant={assistant} />
        </div>
      </div>
    </div>
  );
}
