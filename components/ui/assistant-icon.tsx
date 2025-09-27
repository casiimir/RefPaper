"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssistantIconProps {
  docsUrl: string;
  className?: string;
}

export function AssistantIcon({
  docsUrl,
  className = "w-6 h-6",
}: AssistantIconProps) {
  const [imageError, setImageError] = useState(false);

  const domain = new URL(docsUrl).hostname;
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

  if (imageError) {
    return <FileText className={cn("text-muted-foreground", className)} />;
  }

  return (
    <img
      src={faviconUrl}
      alt={`${domain} favicon`}
      className={cn("rounded object-cover", className)}
      onError={() => setImageError(true)}
    />
  );
}
