"use client";

import Link from "next/link";
import { useUser, SignOutButton, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { User, LayoutDashboard } from "lucide-react";
import { useTranslation } from "@/components/providers/TranslationProvider";

export function Navbar() {
  const { isSignedIn, user } = useUser();
  const { t } = useTranslation();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl">{t("app.name")}</span>
        </Link>

        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          <ThemeToggle />

          {isSignedIn ? (
            <div className="flex items-center space-x-3">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="p-2">
                  <LayoutDashboard className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="p-2">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <SignOutButton>
                <Button variant="outline" size="sm">
                  {t("navigation.signOut")}
                </Button>
              </SignOutButton>
            </div>
          ) : (
            <SignInButton>
              <Button size="sm">{t("navigation.signIn")}</Button>
            </SignInButton>
          )}
        </div>
      </div>
    </nav>
  );
}
