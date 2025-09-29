"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ChatRobot } from "./ChatRobot";
import { Send, Loader2, User } from "lucide-react";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";
import { Assistant } from "@/types/assistant";
import { useTranslation } from "@/components/providers/TranslationProvider";
import { AssistantIcon } from "@/components/ui/assistant-icon";
import { getAssistantTheme } from "@/lib/assistant-colors";

interface ChatInterfaceProps {
  assistant: Assistant;
}

export function ChatInterface({ assistant }: ChatInterfaceProps) {
  const { t } = useTranslation();
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
  // DEBUG: TODO: remove in production!
  const [debugMetrics, setDebugMetrics] = useState({
    totalQueries: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    estimatedCost: 0,
  });

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

    // Check if assistant is ready
    if (assistant.status !== "ready") {
      alert(t("chat.assistantNotReadyLong", { status: assistant.status }));
      return;
    }

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
      // DEBUG: TODO: remove in production!
      const responseData = await response.json();

      // Use real token data from API if available
      if (responseData.tokensUsed) {
        const realTotalTokens = responseData.tokensUsed;
        const estimatedInputTokens = Math.ceil(message.length / 4) + 2000; // Still estimate for breakdown
        const realOutputTokens = realTotalTokens - estimatedInputTokens;

        const inputCost = (estimatedInputTokens / 1000000) * 0.05;
        const outputCost = (Math.max(0, realOutputTokens) / 1000000) * 0.4;

        setDebugMetrics((prev) => ({
          totalQueries: prev.totalQueries + 1,
          totalInputTokens: prev.totalInputTokens + estimatedInputTokens,
          totalOutputTokens:
            prev.totalOutputTokens + Math.max(0, realOutputTokens),
          estimatedCost: prev.estimatedCost + inputCost + outputCost,
        }));
      } else {
        // Fallback to old estimation method
        const inputTokens = Math.ceil(message.length / 4) + 2000;
        const inputCost = (inputTokens / 1000000) * 0.05;

        setDebugMetrics((prev) => ({
          totalQueries: prev.totalQueries + 1,
          totalInputTokens: prev.totalInputTokens + inputTokens,
          totalOutputTokens: prev.totalOutputTokens, // Will be updated by useEffect
          estimatedCost: prev.estimatedCost + inputCost,
        }));
      }

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
      <div
        className={`border-b p-2 flex items-center justify-between flex-shrink-0 bg-gradient-to-r ${
          getAssistantTheme(assistant._id).gradient
        } ${getAssistantTheme(assistant._id).border}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex gap-4">
            <AssistantIcon
              docsUrl={assistant.docsUrl}
              className="w-8 h-8 self-center"
            />
            <div>
              <h1 className="text-md font-semibold">{assistant.name}</h1>
              <p className="text-xs text-muted-foreground">
                {(() => {
                  const text = t("chat.documentationFrom", {
                    hostname: new URL(assistant.docsUrl).hostname,
                  });
                  return text.length > 64
                    ? `${text.substring(0, 64)}...`
                    : text;
                })()}
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearChat}
          disabled={messages.length === 0}
        >
          {t("dashboard.clearChat")}
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <h3 className="text-lg font-medium mb-2">
                {t("chat.startConversation")}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t("chat.askAnything", {
                  hostname: new URL(assistant.docsUrl).hostname,
                })}
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{t("chat.tryAsking")}</p>
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>&quot;{t("chat.howToGetStarted")}&quot;</li>
                  <li>&quot;{t("chat.mainFeatures")}&quot;</li>
                  <li>&quot;{t("chat.showExamples")}&quot;</li>
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
            title={t("chat.monthlyLimitReachedTitle")}
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

      {/* Robot above input when loading */}
      {isLoading && <ChatRobot isVisible={isLoading} />}

      {/* Input */}
      <div className="border-t p-4 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              rateLimitError
                ? t("chat.monthlyLimitReached")
                : assistant.status !== "ready"
                ? t("chat.assistantNotReady", { status: assistant.status })
                : t("chat.askQuestion")
            }
            disabled={
              isLoading || !!rateLimitError || assistant.status !== "ready"
            }
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={
              !input.trim() ||
              isLoading ||
              !!rateLimitError ||
              assistant.status !== "ready"
            }
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Simple Debug Metrics - Only in development TODO: remove in prod */}
        {process.env.NODE_ENV === "development" && (
          <div className="text-xs text-muted-foreground mt-2 px-2 py-1 bg-muted/50 rounded text-center">
            <span className="font-mono">
              Queries: {debugMetrics.totalQueries} | Input:{" "}
              {debugMetrics.totalInputTokens.toLocaleString()} | Output:{" "}
              {debugMetrics.totalOutputTokens.toLocaleString()} | Total:{" "}
              {(
                debugMetrics.totalInputTokens + debugMetrics.totalOutputTokens
              ).toLocaleString()}{" "}
              | Cost: ${debugMetrics.estimatedCost.toFixed(6)} | Avg:{" "}
              {debugMetrics.totalQueries > 0
                ? Math.round(
                    (debugMetrics.totalInputTokens +
                      debugMetrics.totalOutputTokens) /
                      debugMetrics.totalQueries
                  ).toLocaleString()
                : 0}{" "}
              tokens/query
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
