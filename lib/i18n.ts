import { notFound } from "next/navigation";

// Define supported locales
export const locales = ["en", "it", "fr", "es"] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = "en";

// Locale validation
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// Get locale from pathname or default
export function getLocale(pathname: string): Locale {
  const segments = pathname.split("/").filter(Boolean);
  const potentialLocale = segments[0];

  if (potentialLocale && isValidLocale(potentialLocale)) {
    return potentialLocale;
  }

  return defaultLocale;
}

// Dictionary loader - dynamic imports for better performance
const dictionaries = {
  en: () => import("@/messages/en.json").then((module) => module.default),
  it: () => import("@/messages/it.json").then((module) => module.default),
  fr: () => import("@/messages/fr.json").then((module) => module.default),
  es: () => import("@/messages/es.json").then((module) => module.default),
} as const;

export async function getDictionary(locale: Locale) {
  if (!isValidLocale(locale)) {
    notFound();
  }

  try {
    return await dictionaries[locale]();
  } catch (error) {
    console.error(`Failed to load dictionary for locale: ${locale}`, error);
    // Fallback to default locale
    if (locale !== defaultLocale) {
      return await dictionaries[defaultLocale]();
    }
    throw error;
  }
}

// Type-safe translation function
export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;

// Helper function to get nested translation values
export function getTranslation(
  dict: Dictionary,
  key: string,
  params: Record<string, string | number> = {}
): string {
  const keys = key.split(".");
  let value: unknown = dict;

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      value = undefined;
      break;
    }
  }

  if (typeof value !== "string") {
    console.warn(`Translation key not found: ${key}`);
    return key; // Return the key itself as fallback
  }

  // Simple parameter interpolation
  return Object.entries(params).reduce(
    (text, [param, val]) => text.replace(`{${param}}`, String(val)),
    value
  );
}

// Language configuration
export const languages = {
  en: {
    name: "English",
    flag: "🇺🇸",
    dir: "ltr" as const,
  },
  it: {
    name: "Italiano",
    flag: "🇮🇹",
    dir: "ltr" as const,
  },
  fr: {
    name: "Français",
    flag: "🇫🇷",
    dir: "ltr" as const,
  },
  es: {
    name: "Español",
    flag: "🇪🇸",
    dir: "ltr" as const,
  },
} as const;

// Storage key for persisting locale preference
export const LOCALE_STORAGE_KEY = "refpaper-locale";

// Get locale from storage (client-side only)
export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;

  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && isValidLocale(stored)) {
      return stored;
    }
  } catch (error) {
    console.warn("Failed to get stored locale:", error);
  }

  return defaultLocale;
}

// Set locale in storage (client-side only)
export function setStoredLocale(locale: Locale): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch (error) {
    console.warn("Failed to store locale:", error);
  }
}
