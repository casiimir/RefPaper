"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { AssistantSidebar } from "@/components/chat/AssistantSidebar";
import { redirect } from "next/navigation";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function AssistantPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const params = useParams();
  const assistantId = params.id as string;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const assistant = useQuery(api.assistants.getAssistant, {
    id: assistantId as Id<"assistants">,
  });

  const assistants = useQuery(api.assistants.getAssistants);

  // Handle mobile detection and sidebar state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile); // Default open on desktop, closed on mobile
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isSignedIn) {
    redirect("/sign-in");
  }

  if (assistant === undefined || assistants === undefined) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (assistant === null) {
    redirect("/dashboard");
  }

  if (assistant.status !== "ready") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Assistant is not ready yet</h2>
          <p className="text-muted-foreground">
            Status: {assistant.status}
            {assistant.status === "processing" && assistant.processedPages && assistant.totalPages &&
              ` (${assistant.processedPages}/${assistant.totalPages} pages)`
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full bg-background overflow-hidden">
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <ChatInterface assistant={assistant} />
      </div>
    </div>
  );
}