"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { UserProfile } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Loader2, User, BarChart3 } from "lucide-react";
import { PLAN_LIMITS } from "@/lib/constants";
import { UpgradePrompt } from "@/components/ui/upgrade-prompt";

export default function SettingsPage() {
  const { isLoaded, isSignedIn, has } = useAuth();
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
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">Please sign in to access settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and usage
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Account & Billing
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Usage
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
                <CardTitle>AI Assistants</CardTitle>
                <CardDescription>
                  Your current assistants usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">
                      {assistants?.length || 0}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of {isPro ? PLAN_LIMITS.PRO.ASSISTANTS : PLAN_LIMITS.FREE.ASSISTANTS}
                    </span>
                  </div>
                  <Progress
                    value={((assistants?.length || 0) / (isPro ? PLAN_LIMITS.PRO.ASSISTANTS : PLAN_LIMITS.FREE.ASSISTANTS)) * 100}
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    {isPro ?
                      `${PLAN_LIMITS.PRO.ASSISTANTS - (assistants?.length || 0)} assistants remaining` :
                      `${PLAN_LIMITS.FREE.ASSISTANTS - (assistants?.length || 0)} assistants remaining`
                    }
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Questions Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Questions</CardTitle>
                <CardDescription>
                  Questions asked this month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">
                      {questionsThisMonth || 0}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {isPro ? "unlimited" : `of ${PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH}`}
                    </span>
                  </div>
                  {!isPro && (
                    <>
                      <Progress
                        value={((questionsThisMonth || 0) / PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH) * 100}
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground">
                        {PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH - (questionsThisMonth || 0)} questions remaining
                      </div>
                    </>
                  )}
                  {isPro && (
                    <div className="text-xs text-muted-foreground">
                      ∞ Unlimited questions with Pro plan
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upgrade Prompt for Free Users Near Limit */}
          {!isPro && (questionsThisMonth || 0) >= PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH * 0.8 && (
            <UpgradePrompt
              title="Approaching monthly limit"
              description="You're using most of your free questions. Upgrade to Pro for unlimited questions."
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