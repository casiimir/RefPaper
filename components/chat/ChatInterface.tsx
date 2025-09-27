"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { Send, Loader2, User } from "lucide-react";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";
import { Assistant } from "@/types/assistant";

interface ChatInterfaceProps {
  assistant: Assistant;
}

export function ChatInterface({ assistant }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<{
    message: string;
    questionsUsed: number;
    limit: number;
  } | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(api.messages.getMessages, {
    assistantId: assistant._id as Id<"assistants">,
  });

  const clearMessages = useMutation(api.messages.clearMessages);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    if (pendingMessage || isLoading) {
      scrollToBottom();
    }
  }, [pendingMessage, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput("");
    setIsLoading(true);
    setRateLimitError(null); // Clear any previous error
    setPendingMessage(message); // Show message immediately

    try {
      const response = await fetch(`/api/assistant/${assistant._id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (response.status === 429) {
        // Rate limit reached
        const errorData = await response.json();
        setRateLimitError({
          message: errorData.message,
          questionsUsed: errorData.questionsUsed,
          limit: errorData.limit,
        });
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      await response.json();
      // Messages are automatically updated via Convex real-time subscription
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
      setPendingMessage(null); // Clear pending message
    }
  };

  const handleClearChat = async () => {
    try {
      await clearMessages({ assistantId: assistant._id as Id<"assistants"> });
    } catch (error) {
      console.error("Failed to clear chat:", error);
    }
  };

  if (!messages) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold">{assistant.name}</h1>
            <p className="text-sm text-muted-foreground">
              Documentation from {new URL(assistant.docsUrl).hostname}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearChat}
          disabled={messages.length === 0}
        >
          Clear Chat
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
              <p className="text-muted-foreground mb-4">
                Ask me anything about the documentation from{" "}
                <span className="font-medium">
                  {new URL(assistant.docsUrl).hostname}
                </span>
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Try asking:</p>
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>&quot;How do I get started?&quot;</li>
                  <li>&quot;What are the main features?&quot;</li>
                  <li>&quot;Show me examples&quot;</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message._id} message={message} />
            ))}

            {/* Show pending user message only if it's not already in the messages */}
            {pendingMessage &&
              !messages.some(
                (msg) => msg.content === pendingMessage && msg.role === "user"
              ) && (
                <div className="flex gap-3 flex-row-reverse">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary text-primary-foreground">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1 flex items-end flex-col">
                    <div className="rounded-lg px-4 py-3 max-w-[80%] bg-primary text-primary-foreground ml-auto">
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {pendingMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Show typing indicator only if user message is already in the database */}
            {isLoading &&
              pendingMessage &&
              messages.some(
                (msg) => msg.content === pendingMessage && msg.role === "user"
              ) && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </>
        )}

        {/* Rate limit error */}
        {rateLimitError && (
          <UpgradePrompt
            title="Monthly limit reached!"
            description={rateLimitError.message}
            feature="questions"
            currentUsage={{
              used: rateLimitError.questionsUsed,
              limit: rateLimitError.limit,
            }}
            onUpgrade={() => window.open("/pricing", "_blank")}
          />
        )}
      </div>

      {/* Input */}
      <div className="border-t p-4 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              rateLimitError
                ? "Monthly limit reached - upgrade to Pro for unlimited questions"
                : "Ask a question about the documentation..."
            }
            disabled={isLoading || !!rateLimitError}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading || !!rateLimitError}
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
