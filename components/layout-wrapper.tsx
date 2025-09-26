"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();

  // Hide navbar and footer for assistant pages (full-screen chat experience)
  const isAssistantPage = pathname?.startsWith("/assistant/");

  if (isAssistantPage) {
    return (
      <div className="h-screen w-full overflow-hidden">
        {children}
      </div>
    );
  }

  // Default layout with navbar and footer
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}