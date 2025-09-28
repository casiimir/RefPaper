// Document types for content processing and storage

// Base document structure after crawling and processing
export interface Document {
  content: string;
  sourceUrl: string;
  title: string;
  description?: string;
  metadata: DocumentMetadata;
}

// Document metadata from crawling process
export interface DocumentMetadata {
  hasCode: boolean;
  hasImages: boolean;
  contentLength: number;
  crawledAt: string;
}

// Document chunk for vector storage
export interface DocumentChunk {
  id: string;
  text: string;
  metadata: ChunkMetadata;
}

// Chunk metadata
export interface ChunkMetadata {
  sourceUrl: string;
  title: string;
  docIndex: number;
  chunkIndex: number;
  totalChunks: number;
  documentId: string;
  contentPreview: string; // Required to match index signature
  [key: string]: string | number | boolean; // Index signature for Pinecone compatibility (no undefined)
}

// Vector representation for Pinecone
export interface DocumentVector {
  id: string;
  values: number[];
  metadata: ChunkMetadata;
}

// Search result from vector database
export interface SearchResult {
  id: string;
  score: number;
  content: string;
  metadata: {
    title: string;
    sourceUrl: string;
    preview: string;
    documentId?: string;
  };
  originalScore?: number; // For reranking debugging
}

// Assistant creation result
export interface AssistantCreationResult {
  namespace: string;
  documentsCount: number;
  chunksCount: number;
  duration: string;
}


// Configuration
export interface DocumentProcessingConfig {
  chunkSize?: number;
  chunkOverlap?: number;
  minChunkSize?: number;
}

