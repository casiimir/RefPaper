/**
 * Utility per generare colori consistenti per gli assistenti
 * basati sul loro ID univoco
 */

export function getAssistantGradient(assistantId: string): string {
  const gradients = [
    "from-primary/10 to-primary/5",
    "from-secondary/10 to-secondary/5",
    "from-accent/10 to-accent/5",
    "from-muted/20 to-muted/5",
    "from-primary/8 to-secondary/8",
    "from-blue-500/10 to-blue-600/5",
    "from-green-500/10 to-green-600/5",
    "from-purple-500/10 to-purple-600/5",
  ];

  const hash = assistantId.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  return gradients[Math.abs(hash) % gradients.length];
}

export function getAssistantBorderColor(assistantId: string): string {
  const borderColors = [
    "border-primary/20",
    "border-secondary/20",
    "border-accent/20",
    "border-muted/30",
    "border-primary/15",
    "border-blue-500/20",
    "border-green-500/20",
    "border-purple-500/20",
  ];

  const hash = assistantId.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  return borderColors[Math.abs(hash) % borderColors.length];
}

export function getAssistantShadowColor(assistantId: string): string {
  const shadowColors = [
    "shadow-primary/10",
    "shadow-secondary/10",
    "shadow-accent/10",
    "shadow-muted/20",
    "shadow-primary/8",
    "shadow-blue-500/10",
    "shadow-green-500/10",
    "shadow-purple-500/10",
  ];

  const hash = assistantId.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  return shadowColors[Math.abs(hash) % shadowColors.length];
}

/**
 * Ottiene un set completo di stili per un assistente
 */
export function getAssistantTheme(assistantId: string) {
  return {
    gradient: getAssistantGradient(assistantId),
    border: getAssistantBorderColor(assistantId),
    shadow: getAssistantShadowColor(assistantId),
  };
}