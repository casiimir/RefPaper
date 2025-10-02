"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Hook to automatically send welcome email to new users
 * Triggers only once when user signs up for the first time
 */
export function useWelcomeEmail() {
  const { isSignedIn, user } = useUser();
  const triggerWelcomeEmail = useMutation(api.welcome.triggerWelcomeEmail);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (isSignedIn && user && !hasTriggeredRef.current && user.createdAt) {
      const now = new Date();
      const userCreatedAt = new Date(user.createdAt);
      const timeDiffMinutes =
        (now.getTime() - userCreatedAt.getTime()) / (1000 * 60);

      // If user was created within the last 30 seconds, consider it a new signup
      if (timeDiffMinutes <= 0.5) {
        triggerWelcomeEmail().then((result) => {});

        hasTriggeredRef.current = true;
      }
    }
  }, [isSignedIn, user, triggerWelcomeEmail]);
}
