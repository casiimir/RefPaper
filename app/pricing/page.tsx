"use client";

import { PricingTable } from "@clerk/nextjs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Zap, MessageSquare, Bot } from "lucide-react";
import { useTranslation } from "@/components/providers/TranslationProvider";

export default function PricingPage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: <Bot className="w-8 h-8 text-primary" />,
      title: t("pricing.features.aiPowered.title"),
      description: t("pricing.features.aiPowered.description"),
    },
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: t("pricing.features.lightningFast.title"),
      description: t("pricing.features.lightningFast.description"),
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-primary" />,
      title: t("pricing.features.naturalConversations.title"),
      description: t("pricing.features.naturalConversations.description"),
    },
  ];

  const faqs = [
    {
      question: t("pricing.faqs.freePlan.question"),
      answer: t("pricing.faqs.freePlan.answer"),
    },
    {
      question: t("pricing.faqs.whatCounts.question"),
      answer: t("pricing.faqs.whatCounts.answer"),
    },
    {
      question: t("pricing.faqs.upgradeDowngrade.question"),
      answer: t("pricing.faqs.upgradeDowngrade.answer"),
    },
    {
      question: t("pricing.faqs.documentationTypes.question"),
      answer: t("pricing.faqs.documentationTypes.answer"),
    },
    {
      question: t("pricing.faqs.sizeLimit.question"),
      answer: t("pricing.faqs.sizeLimit.answer"),
    },
    {
      question: t("pricing.faqs.enterprise.question"),
      answer: t("pricing.faqs.enterprise.answer"),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {t("pricing.title")}
            <span className="text-primary block">
              {t("pricing.titleHighlight")}
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t("pricing.subtitle")}
          </p>
        </div>

        {/* Clerk Pricing Table */}
        <div className="mb-16">
          <div
            style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 1rem" }}
          >
            <PricingTable
              appearance={{
                variables: {
                  colorPrimary: "var(--primary)",
                  fontFamily: "var(--font-sans)",
                  borderRadius: "0.5rem",
                },
                elements: {
                  button: {
                    backgroundColor: "var(--primary)",
                    color: "var(--secondary)",
                    border: "none",
                    fontWeight: "600",
                    "&:hover": {
                      backgroundColor: "var(--secondary) / 0.9",
                      color: "var(--primary)",
                    },
                  },
                },
              }}
              newSubscriptionRedirectUrl="/dashboard"
            />
          </div>
        </div>

        <div className="my-16 w-80 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-6 animate-pulse-slow"></div>

        {/* Features Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              <span>{t("homepage.features.title")} </span>
              <span className="py-2 pl-4 bg-primary text-secondary">Ref</span>
              <span className="py-2 pr-4 bg-primary text-secondary font-light">
                Paper
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("pricing.whyChooseDescription")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="my-16 w-80 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-6 animate-pulse-slow"></div>

        {/* FAQ Section */}
        <div className="mb-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t("pricing.faqTitle")}</h2>
            <p className="text-xl text-muted-foreground">
              {t("pricing.faqDescription")}
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}
