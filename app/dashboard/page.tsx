"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  Plus,
  Settings,
  MessageSquare,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { api } from "@/convex/_generated/api";
import { CreateAssistantModal } from "@/components/create-assistant-modal";
import { AssistantSettingsModal } from "@/components/assistant-settings-modal";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";

type Assistant = {
  _id: string;
  name: string;
  description?: string;
  docsUrl: string;
  status: string;
  totalPages?: number;
  processedPages?: number;
};

export default function Dashboard() {
  const { isLoaded, isSignedIn, has } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);

  // Only fetch data when auth is loaded and user is signed in
  const assistants = useQuery(
    api.assistants.getAssistants,
    isLoaded && isSignedIn ? {} : "skip"
  );
  const questionsThisMonth = useQuery(
    api.usage.getCurrentMonthUsage,
    isLoaded && isSignedIn ? {} : "skip"
  );
  const isPro = has ? has({ plan: "pro" }) : false;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "creating":
      case "crawling":
      case "processing":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "ready":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "creating":
        return "Creating";
      case "crawling":
        return "Crawling";
      case "processing":
        return "Processing";
      case "ready":
        return "Ready";
      case "error":
        return "Error";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "creating":
      case "crawling":
      case "processing":
        return "bg-blue-500/10 text-blue-700 border-blue-200";
      case "ready":
        return "bg-green-500/10 text-green-700 border-green-200";
      case "error":
        return "bg-red-500/10 text-red-700 border-red-200";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  const canCreateAssistant = () => {
    if (!isLoaded || !isSignedIn) return false;

    // Pro users can create unlimited assistants
    if (isPro) return true;

    // Free users: check if under assistant limit (3 assistants max)
    const currentCount = assistants?.length || 0;
    if (currentCount >= 3) return false;

    // Free users: check if under monthly question limit (20 questions max)
    const questionsUsed = questionsThisMonth || 0;
    if (questionsUsed >= 20) return false;

    return true;
  };

  const getCreateAssistantBlockReason = () => {
    if (!isLoaded || !isSignedIn) return "";
    if (isPro) return "";

    const currentCount = assistants?.length || 0;
    const questionsUsed = questionsThisMonth || 0;

    if (currentCount >= 3) {
      return "Free plan limited to 3 assistants. Upgrade to Pro for 20 assistants.";
    }

    if (questionsUsed >= 20) {
      return "Monthly question limit reached. Upgrade to Pro for unlimited questions.";
    }

    return "";
  };

  // Show loading while auth is loading or while data is loading
  if (!isLoaded || !isSignedIn || assistants === undefined) {
    return (
      <div className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your AI assistants and documentation
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => setShowCreateModal(true)}
            disabled={!canCreateAssistant()}
            className="font-semibold"
            title={getCreateAssistantBlockReason()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Assistant
          </Button>
        </div>

        {/* Show upgrade prompt when free user reaches question limit */}
        {!isPro && (questionsThisMonth || 0) >= 20 && (
          <UpgradePrompt
            title="Monthly question limit reached!"
            description="You've used all 20 free questions this month. You can no longer create new assistants or ask questions until you upgrade."
            feature="questions"
            currentUsage={{
              used: questionsThisMonth || 0,
              limit: 20,
            }}
            className="mb-8"
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{isPro ? "pro" : "free"}</div>
              {!isPro && (
                <p className="text-xs text-muted-foreground mt-1">
                  Limited features
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Assistants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assistants?.length || 0}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  / {isPro ? "20" : "3"}
                </span>
              </div>
              <Progress
                value={((assistants?.length || 0) / (isPro ? 20 : 3)) * 100}
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Questions This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {questionsThisMonth || 0}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  / {isPro ? "∞" : "20"}
                </span>
              </div>
              {!isPro && (
                <Progress
                  value={((questionsThisMonth || 0) / 20) * 100}
                  className="mt-2 h-1"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {assistants.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              {canCreateAssistant() && (
                <div
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center cursor-pointer hover:bg-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
              <h2 className="text-2xl font-semibold mb-4">No assistants yet</h2>
              <p className="text-muted-foreground mb-6">
                Create your first AI assistant by providing documentation URLs.
                Transform any docs into an intelligent knowledge base.
              </p>

            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assistants.map((assistant) => (
              <Card
                key={assistant._id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {assistant.name}
                      </CardTitle>
                      {assistant.description && (
                        <CardDescription className="text-sm">
                          {assistant.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge className={getStatusColor(assistant.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(assistant.status)}
                        {getStatusLabel(assistant.status)}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate">{assistant.docsUrl}</span>
                    </div>

                    {assistant.status === "processing" &&
                      assistant.totalPages && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Processing documents</span>
                            <span>
                              {assistant.processedPages || 0}/
                              {assistant.totalPages}
                            </span>
                          </div>
                          <Progress
                            value={
                              ((assistant.processedPages || 0) /
                                assistant.totalPages) *
                              100
                            }
                            className="h-1"
                          />
                        </div>
                      )}

                    {assistant.status === "ready" && assistant.totalPages && (
                      <div className="text-xs text-muted-foreground">
                        {assistant.totalPages} documents processed
                      </div>
                    )}

                    {assistant.status === "error" && (
                      <div className="text-xs text-red-600">
                        Failed to create assistant. Please try again.
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="gap-2">
                  {assistant.status === "ready" ? (
                    <Link href={`/assistant/${assistant._id}`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <MessageSquare className="w-3 h-3 mr-1" />
                        Chat
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={true}
                      className="flex-1"
                    >
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Chat
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAssistant(assistant)}
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateAssistantModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        userPlan={isPro ? "pro" : "free"}
        questionsThisMonth={questionsThisMonth}
      />

      <AssistantSettingsModal
        open={!!selectedAssistant}
        onOpenChange={(open) => !open && setSelectedAssistant(null)}
        assistant={selectedAssistant}
      />
    </div>
  );
}
