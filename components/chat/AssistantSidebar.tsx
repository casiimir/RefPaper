"use client";

import Link from "next/link";
import { Bot, Plus, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Assistant = {
  _id: string;
  name: string;
  status: string;
  docsUrl: string;
  createdAt: number;
};

interface AssistantSidebarProps {
  assistants: Assistant[];
  currentAssistantId: string;
  isOpen: boolean;
  isMobile: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export function AssistantSidebar({
  assistants,
  currentAssistantId,
  isOpen,
  isMobile,
  onClose,
  onToggle,
}: AssistantSidebarProps) {
  return (
    <>
      {/* Side toggle button for opening */}
      {!isOpen && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="fixed top-1/2 left-0 -translate-y-1/2 z-50 bg-background border-y border-r shadow-lg hover:bg-accent rounded-r-lg rounded-l-none pl-2 pr-3"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      <div
        className={cn(
          "w-64 border-r bg-background flex flex-col transition-all duration-300 ease-out relative",
          isMobile
            ? "fixed inset-y-0 left-0 z-50 shadow-lg"
            : "relative z-40",
          isMobile && !isOpen && "-translate-x-full",
          !isMobile && !isOpen && "hidden"
        )}
      >
        {/* Close toggle button inside sidebar */}
        {isOpen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 z-10 bg-background shadow-lg hover:bg-accent rounded-l-lg rounded-r-none pr-2 pl-3",
              isMobile ? "-right-0 border-y border-l" : "-right-4 border"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Assistants</h2>
            <Link href="/dashboard">
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                {isMobile ? "" : "New"}
              </Button>
            </Link>
          </div>
        </div>

        {/* Assistants List */}
        <div className="flex-1 overflow-y-auto p-2">
          {assistants.map((assistant) => (
            <Link
              key={assistant._id}
              href={`/assistant/${assistant._id}`}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg mb-2 hover:bg-muted/50 transition-colors",
                currentAssistantId === assistant._id && "bg-muted"
              )}
              onClick={() => isMobile && onClose()}
            >
              <Bot className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{assistant.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {new URL(assistant.docsUrl).hostname}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      assistant.status === "ready" && "bg-green-500",
                      assistant.status === "creating" && "bg-yellow-500",
                      assistant.status === "crawling" && "bg-blue-500",
                      assistant.status === "processing" && "bg-blue-500",
                      assistant.status === "error" && "bg-red-500"
                    )}
                  />
                  <span className="text-xs text-muted-foreground capitalize">
                    {assistant.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <Link href="/dashboard" onClick={() => isMobile && onClose()}>
            <Button variant="ghost" className="w-full justify-start">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
}
