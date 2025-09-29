"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTheme } from "@/components/providers/theme-provider";

interface ChatRobotProps {
  isVisible: boolean;
}

export function ChatRobot({ isVisible }: ChatRobotProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine robot GIF based on theme
  const isDarkMode =
    mounted &&
    (theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches));

  const robotSrc = isDarkMode
    ? "/robot-chat-white.gif"
    : "/robot-chat-black.gif";

  if (!isVisible || !mounted) return null;

  return (
    <div className="flex justify-center py-4 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 backdrop-blur-sm border">
        <Image
          src={robotSrc}
          width={32}
          height={32}
          alt="AI thinking"
          className="w-8 h-8"
        />
        <span className="text-sm text-muted-foreground">Thinking...</span>
      </div>
    </div>
  );
}
