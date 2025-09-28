"use client";

import { useState, useEffect } from "react";

interface BinaryParticlesProps {
  particleCount?: number;
  className?: string;
}

export function BinaryParticles({
  particleCount = 50,
  className = "",
}: BinaryParticlesProps) {
  const [particles, setParticles] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const timer = setTimeout(() => setParticles(particleCount), 200);
    return () => clearTimeout(timer);
  }, [isClient, particleCount]);

  if (!isClient) return null;

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      {Array.from({ length: particles }).map((_, i) => {
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const delay = Math.random() * 5;
        const chars = ["1", "0", "1", "0", "1", "1", "0", "0", "1"];
        const char = chars[i % chars.length];

        return (
          <div
            key={i}
            className="absolute text-xs text-primary/50 font-mono select-none animate-matrix-fade"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              animationDelay: `${delay}s`,
            }}
          >
            {char}
          </div>
        );
      })}
    </div>
  );
}
