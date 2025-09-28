"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useTranslation } from "@/components/providers/TranslationProvider";

export default function NotFound() {
  const { t } = useTranslation();
  const [glitchText, setGlitchText] = useState("404");
  const [particleCount, setParticleCount] = useState(0);
  const [matrixRain, setMatrixRain] = useState<
    Array<{ id: number; delay: number; duration: number }>
  >([]);
  const [isClient, setIsClient] = useState(false);

  // Matrix-style glitch effect for 404 text
  useEffect(() => {
    const glitchChars = "01141001014010010110100101101001404";
    const originalText = "404";

    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        let glitched = "";
        for (let i = 0; i < originalText.length; i++) {
          if (Math.random() > 0.6) {
            glitched +=
              glitchChars[Math.floor(Math.random() * glitchChars.length)];
          } else {
            glitched += originalText[i];
          }
        }
        setGlitchText(glitched);

        setTimeout(() => setGlitchText(originalText), 120);
      }
    }, 240);

    return () => clearInterval(interval);
  }, []);

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Matrix rain effect
  useEffect(() => {
    if (!isClient) return;

    const rainDrops = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      delay: (i * 0.2) % 5,
      duration: 8 + (i % 3),
    }));
    setMatrixRain(rainDrops);

    const timer = setTimeout(() => setParticleCount(100), 200);
    return () => clearTimeout(timer);
  }, [isClient]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating binary particles */}
        {isClient &&
          Array.from({ length: particleCount }).map((_, i) => (
            <div
              key={i}
              className="absolute text-xs text-primary/40 font-mono animate-float-random select-none"
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 23) % 100}%`,
                animationDelay: `${(i * 0.1) % 5}s`,
                animationDuration: `${8 + (i % 6)}s`,
              }}
            >
              {i % 2 === 0 ? "1" : "0"}
            </div>
          ))}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-4 text-center py-12">
        <div className="mb-12">
          <h1 className="text-[8rem] md:text-[12rem] font-bold text-primary filter drop-shadow-lg tracking-wider leading-none">
            {glitchText}
          </h1>
          <div className="w-80 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-6 animate-pulse-slow"></div>
        </div>

        <div className="max-w-lg mx-auto mb-12 space-y-6">
          <h2 className="text-xl font-bold text-primary font-mono tracking-wide">
            SYSTEM ERROR
          </h2>
          <div className="border border-primary/20 bg-primary/5 p-6 rounded-lg font-mono text-sm">
            <div className="text-primary/80 mb-2">&gt; ERROR_CODE: 404</div>
            <div className="text-primary/80 mb-2">
              &gt; STATUS: RESOURCE_NOT_FOUND
            </div>
            <div className="text-primary/60 text-xs leading-relaxed">
              {t("notFound.title")}
            </div>
          </div>
        </div>

        {/* System Recovery */}
        <div className="flex flex-col gap-4 mb-8">
          <Button
            asChild
            className="bg-primary hover:bg-primary/80 text-primary-foreground font-mono tracking-wide"
          >
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              {t("notFound.backHome")}
            </Link>
          </Button>
        </div>

        {/* System Navigation */}
        <div className="max-w-md mx-auto">
          <p className="text-sm text-primary/60 mb-4 font-mono">
            &gt; {t("notFound.tryThese")}:
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs hover:bg-primary/10 text-primary/70 font-mono"
            >
              <Link href="/pricing">{t("navigation.pricing")}</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-xs hover:bg-primary/10 text-primary/70 font-mono"
            >
              <Link href="/#features">{t("navigation.features")}</Link>
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes matrix-fall {
          0% {
            transform: translateY(-100vh);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0;
          }
        }

        @keyframes float-random {
          0% {
            transform: translateY(0px) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-40px) scale(1.1);
            opacity: 0.6;
          }
          100% {
            transform: translateY(0px) scale(1);
            opacity: 0.3;
          }
        }

        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.8;
          }
        }

        .animate-matrix-fall {
          animation: matrix-fall linear infinite;
        }
        .animate-float-random {
          animation: float-random 6s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
