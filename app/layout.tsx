import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "RefPaper",
  description:
    "Turn documentation into an AI knowledge assistant. RefPaper helps teams, startups and enterprises boost support, reduce costs, and scale knowledge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ClerkProvider>
        <ConvexClientProvider>
          <body>{children}</body>
        </ConvexClientProvider>
      </ClerkProvider>
    </html>
  );
}
