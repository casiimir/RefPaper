"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { BinaryParticles } from "@/components/ui/binary-particles";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();

  // Hide navbar and footer for assistant pages (full-screen chat experience)
  const isAssistantPage = pathname?.startsWith("/assistant/");

  // Hide footer for dashboard and settings pages (app pages)
  const isAppPage =
    pathname?.startsWith("/dashboard") || pathname?.startsWith("/settings");

  if (isAssistantPage) {
    return <div className="h-screen w-full overflow-hidden">{children}</div>;
  }

  // App pages layout (no footer, with particles)
  if (isAppPage) {
    return (
      <div className="min-h-screen flex flex-col relative">
        <BinaryParticles particleCount={30} />
        <Navbar />
        <main className="flex-1 pt-14 relative z-10">{children}</main>
      </div>
    );
  }

  // Default layout with navbar and footer (marketing pages, with particles)
  return (
    <div className="min-h-screen flex flex-col relative">
      <BinaryParticles particleCount={40} />
      <Navbar />
      <main className="flex-1 pt-14 relative z-10">{children}</main>
      <Footer />
    </div>
  );
}
