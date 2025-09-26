"use client";

import { User, Bot, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  _id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    url: string;
    title: string;
    preview: string;
  }>;
  createdAt: number;
};

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message Content */}
      <div className={cn("flex-1 space-y-2", isUser && "flex items-end flex-col")}>
        <div
          className={cn(
            "rounded-lg px-4 py-3 max-w-[80%]",
            isUser
              ? "bg-primary text-primary-foreground ml-auto"
              : "bg-muted text-foreground"
          )}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        </div>

        {/* Sources */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="space-y-2 max-w-[80%]">
            <p className="text-xs text-muted-foreground font-medium">Sources:</p>
            <div className="grid gap-2">
              {message.sources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm group-hover:text-foreground transition-colors line-clamp-1">
                      {source.title}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {source.preview}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground">
          {new Date(message.createdAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}