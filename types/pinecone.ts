// Pinecone and AI-related types

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

// Pinecone configuration
export interface PineconeConfig {
  INDEX_NAME: string;
  ENVIRONMENT: string;
  EMBEDDING_MODEL: string;
  CHAT_MODEL: string;
  EMBEDDING_DIMENSION: number;
  CHUNK_SIZE: number;
  CHUNK_OVERLAP: number;
  MIN_CHUNK_SIZE: number;
  TOP_K_SEARCH: number;
  TOP_K_BEFORE_RERANK: number;
  MIN_SCORE_THRESHOLD: number;
  RERANK_MODEL: string;
  MAX_CONCURRENT_EMBEDDINGS: number;
  MAX_CONCURRENT_UPSERTS: number;
}