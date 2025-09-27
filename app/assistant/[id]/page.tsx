"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { AssistantSidebar } from "@/components/chat/AssistantSidebar";
import { Navbar } from "@/components/navbar";
import { redirect } from "next/navigation";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useTranslation } from "@/components/providers/TranslationProvider";

export default function AssistantPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { t } = useTranslation();
  const params = useParams();
  const assistantId = params.id as string;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const assistant = useQuery(
    api.assistants.getAssistant,
    isLoaded && isSignedIn ? { id: assistantId as Id<"assistants"> } : "skip"
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
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center">{t("common.loading")}</div>;
  }

  if (!isSignedIn) {
    redirect("/sign-in");
  }

  if (assistant === undefined || assistants === undefined) {
    return <div className="flex h-screen items-center justify-center">{t("common.loading")}</div>;
  }

  if (assistant === null) {
    redirect("/dashboard");
  }


  return (
    <div className="flex flex-col h-screen w-full bg-background">
      {/* Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
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