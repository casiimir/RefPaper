"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { UserProfile } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { User, BarChart3 } from "lucide-react";
import { PLAN_LIMITS } from "@/lib/constants";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";
import { CenteredLoading } from "@/components/ui/loading";
import { useTranslation } from "@/components/providers/TranslationProvider";

export default function SettingsPage() {
  const { isLoaded, isSignedIn, has } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("account");

  const assistants = useQuery(
    api.assistants.getAssistants,
    isLoaded && isSignedIn ? {} : "skip"
  );
  const questionsThisMonth = useQuery(
    api.usage.getCurrentMonthUsage,
    isLoaded && isSignedIn ? {} : "skip"
  );

  const isPro = has ? has({ plan: "pro" }) : false;

  if (!isLoaded) {
    return <CenteredLoading message={t("common.loading")} />;
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <CenteredLoading message={t("navigation.signIn")} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground">
          {t("settings.subtitle")}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {t("settings.accountBilling")}
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t("settings.usage")}
          </TabsTrigger>
        </TabsList>

        {/* Account & Billing Tab */}
        <TabsContent value="account" className="space-y-6">
          <div className="flex justify-center w-full">
            <div className="max-w-4xl w-full">
              <UserProfile
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    cardBox: "shadow-none border-0",
                    card: "w-full"
                  }
                }}
              />
            </div>
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Assistants Usage */}
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.aiAssistants")}</CardTitle>
                <CardDescription>
                  {t("settings.assistantsUsage")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">
                      {assistants?.length || 0}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {t("plans.of")} {isPro ? PLAN_LIMITS.PRO.ASSISTANTS : PLAN_LIMITS.FREE.ASSISTANTS}
                    </span>
                  </div>
                  <Progress
                    value={((assistants?.length || 0) / (isPro ? PLAN_LIMITS.PRO.ASSISTANTS : PLAN_LIMITS.FREE.ASSISTANTS)) * 100}
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    {t("settings.assistantsRemaining", {
                      count: isPro ?
                        PLAN_LIMITS.PRO.ASSISTANTS - (assistants?.length || 0) :
                        PLAN_LIMITS.FREE.ASSISTANTS - (assistants?.length || 0)
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions Usage */}
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.monthlyQuestions")}</CardTitle>
                <CardDescription>
                  {t("settings.questionsDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">
                      {questionsThisMonth || 0}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {isPro ? t("plans.unlimited") : `${t("plans.of")} ${PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH}`}
                    </span>
                  </div>
                  {!isPro && (
                    <>
                      <Progress
                        value={((questionsThisMonth || 0) / PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH) * 100}
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground">
                        {t("settings.questionsRemaining", {
                          count: PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH - (questionsThisMonth || 0)
                        })}
                      </div>
                    </>
                  )}
                  {isPro && (
                    <div className="text-xs text-muted-foreground">
                      {t("plans.unlimitedQuestions")}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upgrade Prompt for Free Users Near Limit */}
          {!isPro && (questionsThisMonth || 0) >= PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH * 0.8 && (
            <UpgradePrompt
              title={t("settings.approachingLimit")}
              description={t("settings.approachingLimitDescription")}
              feature="questions"
              currentUsage={{
                used: questionsThisMonth || 0,
                limit: PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH,
              }}
            />
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}