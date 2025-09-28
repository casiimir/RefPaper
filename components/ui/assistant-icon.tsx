"use client";

import { useState } from "react";
import Image from "next/image";
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

  let domain: string;
  let faviconUrl: string;

  try {
    const parsedUrl = new URL(docsUrl);
    domain = parsedUrl.hostname;
    faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch (error) {
    return <FileText className={cn("text-muted-foreground", className)} />;
  }

  if (imageError) {
    return <FileText className={cn("text-muted-foreground", className)} />;
  }

  return (
    <div className={cn("relative overflow-hidden rounded", className)}>
      <Image
        src={faviconUrl}
        alt={`${domain} favicon`}
        width={32}
        height={32}
        className="object-cover"
        onError={() => setImageError(true)}
        unoptimized
      />
    </div>
  );
}
