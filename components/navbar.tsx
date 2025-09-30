"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useUser, SignOutButton, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { User, LayoutDashboard } from "lucide-react";
import { useTranslation } from "@/components/providers/TranslationProvider";
import { useTheme } from "@/components/providers/theme-provider";

export function Navbar() {
  const { isSignedIn } = useUser();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine logo based on theme (only after mounting to avoid hydration mismatch)
  const isDarkMode =
    mounted &&
    (theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches));

  const logoSrc = isDarkMode ? "/logo-white.png" : "/logo-black.png";
  const logoAlt = isDarkMode ? "RefPaper logo white" : "RefPaper logo black";

  return (
    <nav className="fixed top-0 left-0 right-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container px-4 h-14 flex items-center justify-between min-w-full">
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src={logoSrc}
            width="100"
            height="32"
            alt={logoAlt}
            className="transition-opacity duration-300"
          />
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
