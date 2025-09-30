"use client";

import { useWelcomeEmail } from "@/hooks/useWelcomeEmail";

/**
 * Provider component that automatically triggers welcome emails for new users
 * Should be placed high in the component tree to ensure it runs on every page
 */
export function WelcomeEmailProvider({ children }: { children: React.ReactNode }) {
  // This hook will automatically detect new signups and send welcome emails
  useWelcomeEmail();

  return <>{children}</>;
}