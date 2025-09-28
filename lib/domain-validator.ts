// Domain validation to prevent crawling of generic websites

export const BLOCKED_DOMAINS = [
  // Search engines
  "google.com",
  "bing.com",
  "yahoo.com",
  "duckduckgo.com",
  "baidu.com",
  "yandex.com",

  // Social media
  "facebook.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "linkedin.com",
  "youtube.com",
  "tiktok.com",
  "snapchat.com",
  "pinterest.com",
  "reddit.com",
  "discord.com",
  "telegram.org",

  // E-commerce
  "amazon.com",
  "ebay.com",
  "aliexpress.com",
  "shopify.com",
  "etsy.com",
  "walmart.com",
  "target.com",

  // General platforms
  "github.com",
  "stackoverflow.com",
  "wikipedia.org",
  "medium.com",
  "wordpress.com",
  "blogger.com",
  "tumblr.com",
  "wix.com",
  "squarespace.com",

  // News & Media
  "cnn.com",
  "bbc.com",
  "nytimes.com",
  "washingtonpost.com",
  "theguardian.com",
  "reuters.com",
  "bloomberg.com",
  "techcrunch.com",

  // Cloud platforms (root domains)
  "aws.amazon.com",
  "cloud.google.com",
  "azure.microsoft.com",
  "digitalocean.com",
  "heroku.com",
  "vercel.com",
  "netlify.com",
  "cloudflare.com",

  // General websites
  "apple.com",
  "microsoft.com",
  "oracle.com",
  "ibm.com",
  "netflix.com",
  "spotify.com",
  "paypal.com",
  "stripe.com",

  // Forum/Community platforms
  "discourse.org",
  "phpbb.com",
  "vbulletin.com",
  "fandom.com",
  "wikia.com",

  // File sharing/hosting
  "dropbox.com",
  "drive.google.com",
  "onedrive.live.com",
  "box.com",
  "mega.nz",

  // Adult content (preventive)
  "pornhub.com",
  "xvideos.com",
  "xhamster.com",
  "redtube.com",

  // Gambling sites (preventive)
  "bet365.com",
  "888.com",
  "pokerstars.com",

  // Generic landing pages
  "godaddy.com",
  "namecheap.com",
  "bluehost.com",
  "hostgator.com",
] as const;

// Domains that should show warnings but are not blocked
export const WARNING_DOMAINS = [
  "docs.aws.amazon.com",
  "docs.microsoft.com",
  "developers.google.com",
  "developer.mozilla.org",
  "nodejs.org",
  "python.org",
] as const;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export function validateDomain(url: string): ValidationResult {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Remove www. prefix for comparison
    const cleanHostname = hostname.replace(/^www\./, "");

    // Check for blocked domains
    if (BLOCKED_DOMAINS.includes(cleanHostname as typeof BLOCKED_DOMAINS[number])) {
      return {
        isValid: false,
        error: `Cannot crawl ${hostname} - this is a generic platform. Please provide a specific documentation URL.`,
      };
    }

    // Check for warning domains
    if (WARNING_DOMAINS.some((domain) => hostname.includes(domain))) {
      return {
        isValid: true,
        warning: `This documentation site is very large. Crawling will be limited. Try with subpages.`,
      };
    }

    // Additional checks for suspicious patterns
    if (isGenericPattern(hostname)) {
      return {
        isValid: false,
        error: `This appears to be a generic website. Please provide a specific documentation URL like docs.example.com or example.com/docs`,
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: "Please provide a valid URL (including https://)",
    };
  }
}

// Check for generic patterns that might indicate non-documentation sites
function isGenericPattern(hostname: string): boolean {
  const suspiciousPatterns = [
    // Generic subdomains that are unlikely to be docs
    /^(shop|store|buy|sell|pay|checkout|cart|order)\./,
    /^(login|signin|signup|register|auth|account)\./,
    /^(mail|email|webmail|smtp|pop|imap)\./,
    /^(ftp|files|download|upload|cdn|static|assets)\./,
    /^(admin|panel|dashboard|console|control)\./,
    /^(test|testing|staging|dev|development|beta|alpha)\./,
    /^(blog|news|press|media|marketing)\./,

    // Generic TLDs that are often used for non-documentation
    /\.(tk|ml|ga|cf)$/,

    // Suspicious patterns in domain names
    /\d{1,3}-\d{1,3}-\d{1,3}-\d{1,3}/, // IP-like patterns
    /^[a-z]\.[a-z]$/, // Single letter domains
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(hostname));
}

export function isDocumentationUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();

    // Check for documentation indicators in hostname
    const docHostnamePatterns = [
      /^docs?\./,
      /^documentation\./,
      /^api\./,
      /^developer\./,
      /^dev\./,
      /^help\./,
      /^support\./,
      /^guide\./,
      /^manual\./,
      /^reference\./,
    ];

    if (docHostnamePatterns.some((pattern) => pattern.test(hostname))) {
      return true;
    }

    // Check for documentation indicators in path
    const docPathPatterns = [
      /^\/docs?\//,
      /^\/documentation\//,
      /^\/api\//,
      /^\/help\//,
      /^\/support\//,
      /^\/guide\//,
      /^\/manual\//,
      /^\/reference\//,
      /^\/wiki\//,
      /^\/kb\//,
      /^\/knowledge\//,
    ];

    return docPathPatterns.some((pattern) => pattern.test(pathname));
  } catch (error) {
    return false;
  }
}

export default validateDomain;
