"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { useTranslation } from "@/components/providers/TranslationProvider";
import Link from "next/link";
import {
  Plus,
  Settings,
  MessageSquare,
  ExternalLink,
  Crown,
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
import { PLAN_LIMITS, UI_MESSAGES } from "@/lib/constants";
import { Assistant } from "@/types/assistant";
import {
  getStatusIcon,
  getStatusLabel,
  getStatusColor,
} from "@/lib/status-utils";
import { CenteredLoading } from "@/components/ui/loading";
import { AssistantIcon } from "@/components/ui/assistant-icon";
import { DebugDialog } from "@/components/dev/debug-dialog";

export default function Dashboard() {
  const { isLoaded, isSignedIn, has } = useAuth();
  const { t } = useTranslation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(
    null
  );

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

  const canCreateAssistant = () => {
    if (!isLoaded || !isSignedIn) return false;

    // Pro users can create unlimited assistants
    if (isPro) return true;

    // Free users: check if under assistant limit
    const currentCount = assistants?.length || 0;
    if (currentCount >= PLAN_LIMITS.FREE.ASSISTANTS) return false;

    // Free users: check if under monthly question limit
    const questionsUsed = questionsThisMonth || 0;
    if (questionsUsed >= PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH) return false;

    return true;
  };

  const getCreateAssistantBlockReason = () => {
    if (!isLoaded || !isSignedIn) return "";
    if (isPro) return "";

    const currentCount = assistants?.length || 0;
    const questionsUsed = questionsThisMonth || 0;

    if (currentCount >= PLAN_LIMITS.FREE.ASSISTANTS) {
      return `Free plan limited to ${PLAN_LIMITS.FREE.ASSISTANTS} assistants. Upgrade to Pro for ${PLAN_LIMITS.PRO.ASSISTANTS} assistants.`;
    }

    if (questionsUsed >= PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH) {
      return "Monthly question limit reached. Upgrade to Pro for unlimited questions.";
    }

    return "";
  };

  // Show loading while auth is loading or while data is loading
  if (!isLoaded || !isSignedIn || assistants === undefined) {
    return (
      <div className="bg-background min-h-screen">
        <CenteredLoading message={t("dashboard.loadingDashboard")} />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Stats Bar with Create Button */}
      <div className="border-b bg-muted/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Stats Left Side */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4" />
                <span className="capitalize font-medium">
                  {isPro ? t("plans.proPlan") : t("plans.freePlan")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {questionsThisMonth === undefined ? t("common.loading") : questionsThisMonth}/
                  {isPro ? "∞" : PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH}
                </span>
                <span>{t("dashboard.questionsThisMonth")}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {assistants?.length || 0}/
                  {isPro
                    ? PLAN_LIMITS.PRO.ASSISTANTS
                    : PLAN_LIMITS.FREE.ASSISTANTS}
                </span>
                <span>{t("dashboard.assistants")}</span>
              </div>
              {!isPro && (
                <Button variant="outline" size="sm" className="text-xs h-7">
                  <Crown className="h-3 w-3 mr-1" />
                  {t("common.upgrade")}
                </Button>
              )}
            </div>

            {/* Create Button Right Side */}
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              disabled={!canCreateAssistant()}
              className="font-medium"
              title={getCreateAssistantBlockReason()}
            >
              <Plus className="w-3 h-3 mr-1" />
              {t("common.create")}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Show upgrade prompt when free user reaches question limit */}
        {!isPro &&
          (questionsThisMonth || 0) >= PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH && (
            <UpgradePrompt
              title={UI_MESSAGES.MONTHLY_LIMIT_TITLE}
              description={UI_MESSAGES.UPGRADE_QUESTIONS_DESCRIPTION}
              feature="questions"
              currentUsage={{
                used: questionsThisMonth || 0,
                limit: PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH,
              }}
              className="mb-8"
            />
          )}

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
              <h2 className="text-2xl font-semibold mb-4">{t("dashboard.noAssistants")}</h2>
              <p className="text-muted-foreground mb-6">
                {t("dashboard.noAssistantsDescription")}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {assistants.map((assistant) => (
              <Card
                key={assistant._id}
                className="hover:shadow-md transition-shadow flex flex-col h-full"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <AssistantIcon
                          docsUrl={assistant.docsUrl}
                          className="w-5 h-5"
                        />
                        <CardTitle className="text-lg">
                          {assistant.name}
                        </CardTitle>
                      </div>
                    </div>
                    <Badge className={getStatusColor(assistant.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(assistant.status)}
                        {getStatusLabel(assistant.status)}
                      </div>
                    </Badge>
                  </div>

                  {assistant.status === "ready" && assistant.totalPages && (
                    <div className="text-xs text-ring">
                      {assistant.totalPages} {t("dashboard.documentsProcessed")}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="space-y-2">
                    {assistant.description && (
                      <CardDescription className="text-sm break-all">
                        {assistant.description.length > 128
                          ? `${assistant.description.substring(0, 128)}...`
                          : assistant.description}
                      </CardDescription>
                    )}
                    <Link
                      target="_blank"
                      href={assistant.docsUrl}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate">{assistant.docsUrl}</span>
                    </Link>
                    {assistant.status === "processing" &&
                      assistant.totalPages && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{t("dashboard.processingDocuments")}</span>
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

                    {assistant.status === "error" && (
                      <div className="text-xs text-red-600">
                        {t("dashboard.failedToCreate")}
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="gap-2">
                  {assistant.status === "ready" ? (
                    <Link
                      href={`/assistant/${assistant._id}`}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {t("dashboard.chat")}
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
                      {t("dashboard.chat")}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={assistant.status !== "ready"}
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

      {/* Debug Dialog - Only in development TODO: remove in prod */}
      <DebugDialog />
    </div>
  );
}
