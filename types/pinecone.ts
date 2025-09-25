export interface PineconeConfig {
  INDEX_NAME: string | undefined;
  ENVIRONMENT: string | undefined;
  EMBEDDING_MODEL: string | undefined;
  CHAT_MODEL: string | undefined;
  EMBEDDING_DIMENSION: number;
  CHUNK_SIZE: number;
  CHUNK_OVERLAP: number;
  MIN_CHUNK_SIZE: number;
  TOP_K_SEARCH: number;
  MIN_SCORE_THRESHOLD: number;
  MAX_CONCURRENT_EMBEDDINGS: number;
  MAX_CONCURRENT_UPSERTS: number;
}

export interface ProcessedDocument {
  content: string;
  sourceUrl: string;
  title: string;
  description?: string;
}

export interface DocumentChunk {
  id: string;
  text: string;
  metadata: ChunkMetadata;
}

export interface ChunkMetadata {
  sourceUrl: string;
  title: string;
  docIndex: number;
  chunkIndex: number;
  totalChunks: number;
  fullContent: string;
  contentPreview: string;
}

export interface PineconeVector {
  id: string;
  values: number[];
  metadata: ChunkMetadata;
}

export interface SearchMatch {
  id: string;
  score: number;
  content: string;
  metadata: {
    title: string;
    sourceUrl: string;
    preview: string;
  };
}

export interface SearchOptions {
  topK?: number;
  minScore?: number;
  filter?: Record<string, any> | null;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  systemPrompt?: string | null;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

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

export interface StreamChatResponse {
  stream: any;
  sources: Array<{
    title: string;
    sourceUrl: string;
    preview: string;
  }>;
}

export interface AssistantResult {
  namespace: string;
  documentsCount: number;
  chunksCount: number;
  duration: string;
}

export interface IndexStats {
  totalRecordCount?: number;
  dimension: number;
}

export interface ProgressCallback {
  onProgress?: (stage: string, current: number, total: number) => void;
}
