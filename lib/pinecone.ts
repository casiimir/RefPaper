import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import {
  Document,
  DocumentChunk,
  DocumentVector,
  SearchResult,
  AssistantCreationResult,
} from "@/types/document";
import {
  SearchOptions,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  StreamChatResponse,
  ProgressCallback,
  PineconeConfig,
} from "@/types/pinecone";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Configuration
const CONFIG: PineconeConfig = {
  INDEX_NAME: process.env.PINECONE_INDEX_NAME || "refpaper",
  ENVIRONMENT: process.env.PINECONE_ENVIRONMENT || "us-east-1",
  EMBEDDING_MODEL:
    process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
  CHAT_MODEL: process.env.OPENAI_CHAT_MODEL || "gpt-5-nano",
  EMBEDDING_DIMENSION: 1536,
  CHUNK_SIZE: 1500,
  CHUNK_OVERLAP: 200,
  MIN_CHUNK_SIZE: 100,
  TOP_K_SEARCH: 10,
  MIN_SCORE_THRESHOLD: 0.5,
  MAX_CONCURRENT_EMBEDDINGS: 20,
  MAX_CONCURRENT_UPSERTS: 5,
};

// Initialize clients
const initPinecone = (): Pinecone => {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error("PINECONE_API_KEY is required");
  }
  return new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
};

const initOpenAI = (): OpenAI => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

// Index management
const getOrCreateIndex = async (indexName?: string) => {
  const pinecone = initPinecone();
  const name = indexName || CONFIG.INDEX_NAME;

  if (!name) {
    throw new Error("Index name is required");
  }

  const indexes = await pinecone.listIndexes();
  const indexExists = indexes.indexes?.some((idx) => idx.name === name);

  if (!indexExists) {
    if (!CONFIG.ENVIRONMENT) {
      throw new Error("PINECONE_ENVIRONMENT is required for index creation");
    }

    await pinecone.createIndex({
      name,
      dimension: CONFIG.EMBEDDING_DIMENSION,
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: CONFIG.ENVIRONMENT,
        },
      },
    });

    await waitForIndexReady(pinecone, name);
  }

  return pinecone.index(name);
};

const waitForIndexReady = async (
  pinecone: Pinecone,
  indexName: string,
  maxAttempts: number = 30
): Promise<boolean> => {
  for (let i = 0; i < maxAttempts; i++) {
    const indexes = await pinecone.listIndexes();
    const index = indexes.indexes?.find((idx) => idx.name === indexName);

    if (index?.status?.ready) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`Index creation timeout for ${indexName}`);
};

// Document processing
const smartChunk = (
  text: string,
  chunkSize: number = CONFIG.CHUNK_SIZE,
  overlap: number = CONFIG.CHUNK_OVERLAP
): string[] => {
  const chunks: string[] = [];

  // Preserve code blocks
  const codeBlockRegex = /```[\s\S]*?```/g;
  const codeBlocks = text.match(codeBlockRegex) || [];

  // Replace code blocks temporarily
  let processedText = text;
  codeBlocks.forEach((block, idx) => {
    processedText = processedText.replace(block, `__CODE_BLOCK_${idx}__`);
  });

  // Split into sentences
  const sentences = processedText.match(/[^.!?]+[.!?]+/g) || [processedText];

  let currentChunk = "";
  let currentLength = 0;

  for (const sentence of sentences) {
    // Restore code blocks
    let restoredSentence = sentence;
    codeBlocks.forEach((block, idx) => {
      restoredSentence = restoredSentence.replace(
        `__CODE_BLOCK_${idx}__`,
        block
      );
    });

    const sentenceLength = restoredSentence.length;

    if (currentLength + sentenceLength > chunkSize && currentChunk) {
      chunks.push(currentChunk.trim());

      // Add overlap
      const overlapText = currentChunk.slice(-overlap);
      currentChunk = overlapText + restoredSentence;
      currentLength = overlapText.length + sentenceLength;
    } else {
      currentChunk += " " + restoredSentence;
      currentLength += sentenceLength;
    }
  }

  if (currentChunk.trim().length > CONFIG.MIN_CHUNK_SIZE) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};

const processDocumentsWithIds = (
  documents: Document[],
  documentIds: string[]
): DocumentChunk[] => {
  const allChunks: DocumentChunk[] = [];

  documents.forEach((doc, docIndex) => {
    const chunks = smartChunk(doc.content);
    const documentId = documentIds[docIndex];

    chunks.forEach((chunk, chunkIndex) => {
      allChunks.push({
        id: `doc_${docIndex}_chunk_${chunkIndex}`,
        text: chunk,
        metadata: {
          sourceUrl: doc.sourceUrl,
          title: doc.title || "Untitled",
          docIndex,
          chunkIndex,
          totalChunks: chunks.length,
          documentId: documentId,
          contentPreview: chunk.substring(0, 200),
        },
      });
    });
  });

  return allChunks;
};

// Embeddings
const createEmbeddings = async (
  texts: string[],
  callbacks?: ProgressCallback
): Promise<number[][]> => {
  const openai = initOpenAI();
  const embeddings: number[][] = [];
  const batchSize = CONFIG.MAX_CONCURRENT_EMBEDDINGS;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const response = await openai.embeddings.create({
      model: CONFIG.EMBEDDING_MODEL,
      input: batch,
    });

    embeddings.push(...response.data.map((d) => d.embedding));

    const completed = Math.min(i + batchSize, texts.length);
    callbacks?.onProgress?.("embedding", completed, texts.length);
  }

  return embeddings;
};

const createQueryEmbedding = async (query: string): Promise<number[]> => {
  const openai = initOpenAI();
  const response = await openai.embeddings.create({
    model: CONFIG.EMBEDDING_MODEL,
    input: query,
  });

  return response.data[0].embedding;
};

// Pinecone operations
export const generateNamespace = (prefix: string = "assistant"): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${randomId}`;
};

const upsertVectors = async (
  index: any,
  namespace: string,
  vectors: DocumentVector[],
  callbacks?: ProgressCallback
): Promise<void> => {
  const batchSize = CONFIG.MAX_CONCURRENT_UPSERTS;

  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.namespace(namespace).upsert(batch);

    const completed = Math.min(i + batchSize, vectors.length);
    callbacks?.onProgress?.("upserting", completed, vectors.length);
  }
};

// High-level API functions
export const createAssistantWithConvexDocs = async (
  documents: Document[],
  documentIds: string[],
  assistantName: string = "assistant",
  callbacks?: ProgressCallback
): Promise<AssistantCreationResult> => {
  const startTime = Date.now();
  const index = await getOrCreateIndex();
  const namespace = generateNamespace(assistantName);

  callbacks?.onProgress?.("processing", 0, 4);

  // Step 1: Process documents into chunks with document references
  const chunks = processDocumentsWithIds(documents, documentIds);
  callbacks?.onProgress?.("processing", 1, 4);

  // Step 2: Create embeddings
  const texts = chunks.map((chunk) => chunk.text);
  const embeddings = await createEmbeddings(texts, callbacks);
  callbacks?.onProgress?.("processing", 2, 4);

  // Step 3: Prepare vectors with minimal metadata (exclude content preview to reduce size)
  const vectors: DocumentVector[] = chunks.map((chunk, idx) => ({
    id: chunk.id,
    values: embeddings[idx],
    metadata: {
      sourceUrl: chunk.metadata.sourceUrl,
      title: chunk.metadata.title,
      docIndex: chunk.metadata.docIndex,
      chunkIndex: chunk.metadata.chunkIndex,
      totalChunks: chunk.metadata.totalChunks,
      documentId: chunk.metadata.documentId,
    },
  }));

  // Step 4: Upsert to Pinecone
  await upsertVectors(index, namespace, vectors, callbacks);
  callbacks?.onProgress?.("processing", 4, 4);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  return {
    namespace,
    documentsCount: documents.length,
    chunksCount: chunks.length,
    duration,
  };
};

export const searchDocuments = async (
  query: string,
  namespace: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> => {
  const {
    topK = CONFIG.TOP_K_SEARCH,
    minScore = CONFIG.MIN_SCORE_THRESHOLD,
    filter = null,
  } = options;

  const index = await getOrCreateIndex();

  // Create query embedding
  const queryEmbedding = await createQueryEmbedding(query);

  // Search Pinecone
  const searchResponse = await index.namespace(namespace).query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
    includeValues: false,
    ...(filter && { filter }),
  });

  // Filter by minimum score
  const relevantMatches = searchResponse.matches.filter(
    (match: any) => match.score >= minScore
  );

  // If no high-score matches, return top results anyway
  if (relevantMatches.length === 0 && searchResponse.matches.length > 0) {
    return searchResponse.matches.slice(0, 3).map(formatMatch);
  }

  return relevantMatches.map(formatMatch);
};

const formatMatch = (match: any): SearchResult => ({
  id: match.id,
  score: match.score,
  content: "", // Will be filled from file storage via documentId
  metadata: {
    title: match.metadata.title,
    sourceUrl: match.metadata.sourceUrl,
    preview: match.metadata.title, // Use title as preview for now
    documentId: match.metadata.documentId, // Reference to full content
  },
});

const buildContext = (searchResults: SearchResult[]): string =>
  searchResults
    .map((result, idx) => {
      const relevance = (result.score * 100).toFixed(1);
      return `[Source ${idx + 1}] (Relevance: ${relevance}%)\n${
        result.content
      }\n`;
    })
    .join("\n---\n\n");

const buildMessages = (
  query: string,
  context: string,
  conversationHistory: ChatMessage[] = [],
  systemPrompt?: string | null
): ChatMessage[] => {
  const defaultSystemPrompt = `You are a helpful documentation assistant. Answer questions based on the provided context from the documentation. Provide a markdown formatting.

Rules:
1. Only answer based on the provided context
2. If the context doesn't contain the answer, say so clearly and stop there
3. Be concise but thorough
4. Include code examples when relevant
5. Do not offer to explain things beyond the provided context`;

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: systemPrompt || defaultSystemPrompt,
    },
  ];

  // Add conversation history
  conversationHistory.forEach((entry) => {
    messages.push({
      role: entry.role,
      content: entry.content,
    });
  });

  // Add current query with context
  messages.push({
    role: "user",
    content: `Context from documentation:\n${context}\n\nQuestion: ${query}`,
  });

  return messages;
};

export const queryAssistant = async (
  namespace: string,
  query: string,
  conversationHistory: ChatMessage[] = [],
  options: ChatOptions = {},
  convexClient?: ConvexHttpClient
): Promise<ChatResponse | StreamChatResponse> => {
  const { systemPrompt = null, maxTokens = 1000, stream = false } = options;

  // Search for relevant documents
  const searchResults = await searchDocuments(query, namespace);

  if (searchResults.length === 0) {
    return {
      answer:
        "I couldn't find relevant information to answer your question. Please try rephrasing or ask about something else.",
      sources: [],
      query,
    };
  }

  // Get full content from Convex if client provided
  let enhancedResults = searchResults;
  if (convexClient) {
    try {
      const documentIds = searchResults
        .map((r) => r.metadata.documentId)
        .filter(Boolean) as string[];

      if (documentIds.length > 0) {
        const documents = await convexClient.query(
          api.documents.getDocumentsByIds,
          { documentIds: documentIds as any }
        );

        // Enhance results with full content
        enhancedResults = searchResults.map((result) => {
          const doc = documents.find(
            (d: any) => d && d._id === result.metadata.documentId
          );
          if (doc) {
            return {
              ...result,
              content: doc.fullContent || "",
            };
          }
          return result;
        });
      }
    } catch (error) {
      console.warn(
        "Failed to fetch full content from Convex, using previews:",
        error
      );
    }
  }

  // Build context and messages
  const context = buildContext(enhancedResults);
  const messages = buildMessages(
    query,
    context,
    conversationHistory,
    systemPrompt
  );

  // Get completion from OpenAI

  const openai = initOpenAI();
  const completion = await openai.chat.completions.create({
    model: CONFIG.CHAT_MODEL!,
    messages,
    max_completion_tokens: maxTokens,
    stream,
    reasoning_effort: "low",
  });

  const sources = searchResults.map((r) => r.metadata);

  if (stream) {
    return {
      stream: completion,
      sources,
    };
  }

  const response = completion as OpenAI.Chat.Completions.ChatCompletion;

  return {
    answer: response.choices[0].message.content || "",
    sources,
    query,
    tokensUsed: response.usage?.total_tokens,
  };
};
