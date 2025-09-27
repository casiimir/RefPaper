export interface Assistant {
  _id: string;
  name: string;
  description?: string;
  docsUrl: string;
  status: string;
  totalPages?: number;
  processedPages?: number;
  pineconeNamespace?: string;
  createdAt?: number;
}