export interface Assistant {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  docsUrl: string;
  status: "creating" | "queued" | "crawling" | "processing" | "ready" | "error";
  totalPages?: number;
  processedPages?: number;
  pineconeNamespace?: string;
  errorMessage?: string;
  createdAt?: number;
  updatedAt: number;
  lastCrawledAt?: number;
  isPublic?: boolean;
  publicShareId?: string;
}