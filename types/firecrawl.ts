export interface CrawlConfig {
  limit: number;
  maxDiscoveryDepth: number;
  excludePaths: string[];
  includePaths?: string[];
  allowSubdomains?: boolean;
  crawlEntireDomain?: boolean;
  scrapeOptions: {
    formats: ("markdown" | "html" | "rawHtml" | "links" | "images" | "screenshot" | "summary" | "changeTracking" | "json" | "attributes")[];
    includeTags?: string[];
    excludeTags?: string[];
    onlyMainContent: boolean;
    waitFor?: number;
    blockAds?: boolean;
    removeBase64Images?: boolean;
    fastMode?: boolean;
  };
}


export interface RawPage {
  markdown?: string;
  sourceUrl?: string;
  url?: string;
  metadata?: {
    url?: string;
    title?: string;
    description?: string;
  };
}

export interface CrawlResponse {
  status: string;
  data?: RawPage[];
  jobId?: string;
  id?: string;
}

export interface CrawlStatus {
  status: string;
  data?: RawPage[];
  error?: string;
}
