export interface CrawlConfig {
  formats: string[];
  limit: number;
  maxDepth: number;
  waitFor: number;
  excludePaths: string[];
  removeTags: string[];
  onlyMainContent: boolean;
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
