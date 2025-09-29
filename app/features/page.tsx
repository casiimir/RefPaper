"use client";

import { SignInButton } from "@clerk/nextjs";
import { Unauthenticated, Authenticated } from "convex/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Zap,
  Globe,
  Search,
  MessageCircle,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Brain,
  Settings,
  Database,
  Rocket,
  Layers,
} from "lucide-react";
import { useTranslation } from "@/components/providers/TranslationProvider";

export default function FeaturesPage() {
  const { t } = useTranslation();

  const coreFeatures = [
    {
      icon: <Bot className="h-12 w-12 text-primary" />,
      title: t("features.core.aiPowered.title"),
      description: t("features.core.aiPowered.description"),
    },
    {
      icon: <Rocket className="h-12 w-12 text-primary" />,
      title: t("features.core.instantSetup.title"),
      description: t("features.core.instantSetup.description"),
    },
    {
      icon: <Search className="h-12 w-12 text-primary" />,
      title: t("features.core.smartCrawling.title"),
      description: t("features.core.smartCrawling.description"),
    },
    {
      icon: <Globe className="h-12 w-12 text-primary" />,
      title: t("features.core.multilingual.title"),
      description: t("features.core.multilingual.description"),
    },
  ];

  const advancedFeatures = [
    {
      icon: <Brain className="h-12 w-12 text-primary" />,
      title: t("features.advanced.contextAware.title"),
      description: t("features.advanced.contextAware.description"),
    },
    {
      icon: <MessageCircle className="h-12 w-12 text-primary" />,
      title: t("features.advanced.unlimitedConversations.title"),
      description: t("features.advanced.unlimitedConversations.description"),
    },
    {
      icon: <Zap className="h-12 w-12 text-primary" />,
      title: t("features.advanced.realtime.title"),
      description: t("features.advanced.realtime.description"),
    },
    {
      icon: <Settings className="h-12 w-12 text-primary" />,
      title: t("features.advanced.customization.title"),
      description: t("features.advanced.customization.description"),
    },
  ];

  const integrationFeatures = [
    {
      icon: <Database className="h-12 w-12 text-primary" />,
      title: t("features.integration.embeddings.title"),
      description: t("features.integration.embeddings.description"),
    },
    {
      icon: <Brain className="h-12 w-12 text-primary" />,
      title: t("features.integration.smartParsing.title"),
      description: t("features.integration.smartParsing.description"),
    },
    {
      icon: <Zap className="h-12 w-12 text-primary" />,
      title: t("features.integration.performance.title"),
      description: t("features.integration.performance.description"),
    },
    {
      icon: <CheckCircle className="h-12 w-12 text-primary" />,
      title: t("features.integration.reliability.title"),
      description: t("features.integration.reliability.description"),
    },
  ];

  const benefits = [
    t("features.benefits.0"),
    t("features.benefits.1"),
    t("features.benefits.2"),
    t("features.benefits.3"),
    t("features.benefits.4"),
    t("features.benefits.5"),
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-6 px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2" />
            {t("features.title")}
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            {t("features.hero.title")}{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t("features.hero.titleHighlight")}
            </span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            {t("features.hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Unauthenticated>
              <SignInButton>
                <Button size="lg" className="text-lg px-8 py-4 font-semibold">
                  {t("features.cta.button")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </SignInButton>
            </Unauthenticated>
            <Authenticated>
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-8 py-4 font-semibold">
                  {t("navigation.dashboard")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </Authenticated>
            <Link href="/pricing">
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-4 font-semibold"
              >
                {t("navigation.pricing")}
              </Button>
            </Link>
          </div>

          {/* Benefits List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3 text-left">
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">
              <Layers className="h-4 w-4 mr-2" />
              {t("features.sections.core.title")}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t("features.sections.core.subtitle")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Essential tools that make REFpaper powerful and easy to use
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {coreFeatures.map((feature, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 bg-gradient-to-br from-background to-muted/20"
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-2xl mb-2">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">
              <Brain className="h-4 w-4 mr-2" />
              {t("features.sections.advanced.title")}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t("features.sections.advanced.subtitle")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional features designed for teams that demand excellence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {advancedFeatures.map((feature, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 bg-gradient-to-br from-background to-primary/5"
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-2xl mb-2">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Features Section */}
      <section className="py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">
              <Settings className="h-4 w-4 mr-2" />
              {t("features.sections.integration.title")}
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t("features.sections.integration.subtitle")}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful integrations and workflow tools for enterprise teams
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {integrationFeatures.map((feature, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20 bg-gradient-to-br from-background to-secondary/10"
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-2xl mb-2">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed text-center">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              {t("features.cta.title")}
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              {t("features.cta.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Unauthenticated>
                <SignInButton>
                  <Button size="lg" className="text-lg px-8 py-4 font-semibold">
                    {t("features.cta.button")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </SignInButton>
              </Unauthenticated>
              <Authenticated>
                <Link href="/dashboard">
                  <Button size="lg" className="text-lg px-8 py-4 font-semibold">
                    {t("navigation.dashboard")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </Authenticated>
              <Link href="/pricing">
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-4 font-semibold bg-background"
                >
                  {t("navigation.pricing")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
