"use client";

import { Unauthenticated } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/providers/TranslationProvider";

export default function Home() {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-2xl mx-auto px-4">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {t("app.name")}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            {t("app.tagline")}
            <br />
            {t("app.subtitle")}
          </p>
          <Unauthenticated>
            <SignInButton>
              <Button size="lg" className="text-lg px-8 py-6 font-semibold">
                {t("app.ctaButton")}
              </Button>
            </SignInButton>
          </Unauthenticated>
        </div>
      </div>
    </>
  );
}
