"use client";

import { Unauthenticated, Authenticated } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
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
  Clock,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "@/components/providers/TranslationProvider";
import { DemoDialog } from "@/components/DemoDialog";

export default function Home() {
  const { t } = useTranslation();

  const features = [
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: t("homepage.features.instant.title"),
      description: t("homepage.features.instant.description"),
    },
    {
      icon: <Bot className="h-8 w-8 text-primary" />,
      title: t("homepage.features.intelligent.title"),
      description: t("homepage.features.intelligent.description"),
    },
    {
      icon: <Globe className="h-8 w-8 text-primary" />,
      title: t("homepage.features.multilingual.title"),
      description: t("homepage.features.multilingual.description"),
    },
    {
      icon: <Search className="h-8 w-8 text-primary" />,
      title: t("homepage.features.crawling.title"),
      description: t("homepage.features.crawling.description"),
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-primary" />,
      title: t("homepage.features.unlimited.title"),
      description: t("homepage.features.unlimited.description"),
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: t("homepage.features.realtime.title"),
      description: t("homepage.features.realtime.description"),
    },
  ];

  const benefits = [
    "Reduce support tickets by 70%",
    "24/7 instant documentation help",
    "Multiple language support",
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-6 px-4 py-2">
            <Sparkles className="h-4 w-4 mr-2" />
            {t("homepage.hero.badge")}
          </Badge>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            {t("homepage.hero.title")}{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t("homepage.hero.titleHighlight")}
            </span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            {t("homepage.hero.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Unauthenticated>
              <SignInButton>
                <Button size="lg" className="text-lg px-8 py-4 font-semibold">
                  {t("homepage.hero.ctaPrimary")}
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
            <DemoDialog />
          </div>

          {/* Benefits List */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-primary/3 py-20" id="features">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span>{t("homepage.features.title")} </span>
              <span className="py-2 pl-4 bg-primary text-secondary">Ref</span>
              <span className="py-2 pr-4 bg-primary text-secondary font-light">
                Paper
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("homepage.features.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="text-center hover:shadow-lg transition-shadow border-none bg-background"
              >
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto bg-primary/3 rounded-2xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t("homepage.cta.title")}
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              {t("homepage.cta.subtitle")}
            </p>
            <Unauthenticated>
              <SignInButton>
                <Button size="lg" className="text-lg px-8 py-4 font-semibold">
                  {t("homepage.cta.button")}
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
          </div>
        </div>
      </section>
    </>
  );
}
