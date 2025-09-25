// Unified document types for firecrawl and pinecone integration

// Base document structure after crawling and processing
export interface Document {
  content: string;
  sourceUrl: string;
  title: string;
  description?: string;
  metadata: DocumentMetadata;
}

// Document metadata
export interface DocumentMetadata {
  hasCode: boolean;
  hasImages: boolean;
  contentLength: number;
  crawledAt: string;
  // Additional fields from original types
  url?: string;
  docIndex?: number;
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
  fullContent: string;
  contentPreview: string;
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
  };
}

// Assistant creation result
export interface AssistantCreationResult {
  namespace: string;
  documentsCount: number;
  chunksCount: number;
  duration: string;
}

// Chat message
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Chat response
export interface ChatResponse {
  answer: string;
  sources: Array<{
    title: string;
    sourceUrl: string;
    preview: string;
  }>;
  query: string;
  tokensUsed?: number;
}

// Stream chat response
export interface StreamChatResponse {
  stream: any;
  sources: Array<{
    title: string;
    sourceUrl: string;
    preview: string;
  }>;
}

// Search options
export interface SearchOptions {
  topK?: number;
  minScore?: number;
  filter?: Record<string, any> | null;
}

// Chat options
export interface ChatOptions {
  systemPrompt?: string | null;
  maxTokens?: number;
  stream?: boolean;
}

// Progress callback for long operations
export interface ProgressCallback {
  onProgress?: (stage: string, completed: number, total: number) => void;
}

// Configuration
export interface DocumentProcessingConfig {
  chunkSize?: number;
  chunkOverlap?: number;
  minChunkSize?: number;
}