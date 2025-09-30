import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
import ConvexClientProvider from "@/components/providers/ConvexClientProvider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TranslationProvider } from "@/components/providers/TranslationProvider";
import { WelcomeEmailProvider } from "@/components/providers/WelcomeEmailProvider";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { getDictionary, defaultLocale } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "REFpaper",
  description:
    "Turn documentation into an AI knowledge assistant. REFpaper helps teams, startups and enterprises boost support, reduce costs, and scale knowledge.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const dictionary = await getDictionary(defaultLocale);

  return (
    <html lang={defaultLocale} suppressHydrationWarning>
      <body>
        <ClerkProvider
          appearance={{
            baseTheme: shadcn,
          }}
        >
          <ConvexClientProvider>
            <ThemeProvider defaultTheme="system" storageKey="refpaper-theme">
              <TranslationProvider
                dictionary={dictionary}
                locale={defaultLocale}
              >
                <WelcomeEmailProvider>
                  <LayoutWrapper>{children}</LayoutWrapper>
                </WelcomeEmailProvider>
              </TranslationProvider>
            </ThemeProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
