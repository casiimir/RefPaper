export interface Assistant {
  _id: string;
  name: string;
  description?: string;
  docsUrl: string;
  status: "creating" | "queued" | "crawling" | "processing" | "ready" | "error";
  totalPages?: number;
  processedPages?: number;
  pineconeNamespace?: string;
  errorMessage?: string;
  createdAt?: number;
}