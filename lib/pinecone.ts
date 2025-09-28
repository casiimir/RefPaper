import { Pinecone, Index, RecordMetadata, ScoredPineconeRecord } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import {
  Document,
  DocumentChunk,
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
import { Id } from "@/convex/_generated/dataModel";

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
  TOP_K_SEARCH: 3,
  TOP_K_BEFORE_RERANK: 8, // Retrieve more, then rerank to top 3
  MIN_SCORE_THRESHOLD: 0.5,
  RERANK_MODEL: "bge-reranker-v2-m3",
  MAX_CONCURRENT_EMBEDDINGS: 10, // Reduced from 20 to avoid rate limits
  MAX_CONCURRENT_UPSERTS: 10, // Increased from 5 for better throughput
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

// Utility function to estimate token count (rough approximation)
const estimateTokenCount = (text: string): number => {
  // Rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
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

// Delete namespace from Pinecone index
export const deleteNamespace = async (namespace: string): Promise<void> => {
  if (!namespace) {
    throw new Error("Namespace is required for deletion");
  }

  try {
    const index = await getOrCreateIndex();
    await index.deleteNamespace(namespace);
  } catch (error: unknown) {
    // Check if it's a 404 error (namespace doesn't exist)
    const errorObj = error as { name?: string; message?: string };
    if (errorObj?.name === 'PineconeNotFoundError' || errorObj?.message?.includes('404')) {
      // Namespace already deleted or never existed - this is fine
      return;
    }
    console.error(`Failed to delete Pinecone namespace ${namespace}:`, error);
    // Don't throw error to avoid blocking assistant deletion if Pinecone fails
    // The assistant deletion should succeed even if namespace cleanup fails
  }
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
export const generateNamespace = (assistantId: string): string => {
  // Use assistant ID directly as namespace for better organization and performance
  return `assistant_${assistantId}`;
};

const upsertVectors = async (
  index: Index,
  namespace: string,
  vectors: Array<{ id: string; values: number[]; metadata: RecordMetadata }>,
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
  assistantId: string,
  callbacks?: ProgressCallback
): Promise<AssistantCreationResult> => {
  const startTime = Date.now();
  const index = await getOrCreateIndex();
  const namespace = generateNamespace(assistantId);


  callbacks?.onProgress?.("processing", 0, 4);

  // Step 1: Process documents into chunks with document references
  const chunks = processDocumentsWithIds(documents, documentIds);
  callbacks?.onProgress?.("processing", 1, 4);

  // Step 1.5: Validate per-document token count before proceeding
  const MAX_TOKENS_PER_PAGE = 50000; // 50k token limit per single page

  // Group chunks by document and calculate tokens per document
  const documentTokens = new Map<number, number>();
  chunks.forEach((chunk) => {
    const docIndex = chunk.metadata.docIndex;
    const currentTokens = documentTokens.get(docIndex) || 0;
    documentTokens.set(
      docIndex,
      currentTokens + estimateTokenCount(chunk.text)
    );
  });

  // Check if any single document exceeds the limit
  for (const [docIndex, tokens] of documentTokens.entries()) {
    if (tokens > MAX_TOKENS_PER_PAGE) {
      const documentUrl = documents[docIndex]?.sourceUrl || "Unknown URL";
      throw new Error(
        `DOCUMENTATION_TOO_LARGE: The page "${documentUrl}" structure exceeds. Please try using more specific subpages like /getting-started, /api/reference, or /tutorials instead of this large page.`
      );
    }
  }

  // Step 2: Create embeddings
  const texts = chunks.map((chunk) => chunk.text);
  const embeddings = await createEmbeddings(texts, callbacks);
  callbacks?.onProgress?.("processing", 2, 4);

  // Step 3: Prepare vectors with minimal metadata (exclude content preview to reduce size)
  const vectors = chunks.map((chunk, idx) => ({
    id: chunk.id,
    values: embeddings[idx],
    metadata: {
      sourceUrl: chunk.metadata.sourceUrl,
      title: chunk.metadata.title,
      docIndex: chunk.metadata.docIndex,
      chunkIndex: chunk.metadata.chunkIndex,
      totalChunks: chunk.metadata.totalChunks,
      documentId: chunk.metadata.documentId,
      contentPreview: chunk.metadata.contentPreview,
    } as RecordMetadata,
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

  // Search Pinecone with more results for reranking
  const searchResponse = await index.namespace(namespace).query({
    vector: queryEmbedding,
    topK: CONFIG.TOP_K_BEFORE_RERANK, // Get 8 results
    includeMetadata: true,
    includeValues: false,
    ...(filter && { filter }),
  });

  // Filter by minimum score first
  const relevantMatches = searchResponse.matches.filter(
    (match: ScoredPineconeRecord) => (match.score ?? 0) >= minScore
  );

  if (relevantMatches.length === 0) {
    // If no high-score matches, return top 3 without reranking
    return searchResponse.matches.slice(0, topK).map(formatMatch);
  }

  // If we have enough results, apply reranking
  if (relevantMatches.length > topK) {
    try {
      const pinecone = initPinecone();

      // For reranking, we need the actual content, not just titles
      // Since we don't store full content in Pinecone metadata, use titles + preview
      const documentsForRerank = relevantMatches.map((match: ScoredPineconeRecord) => {
        // Combine title and available metadata for better reranking
        const metadata = match.metadata as RecordMetadata | undefined;
        const title = metadata?.title as string || '';
        const preview = metadata?.preview as string || '';
        const text = `${title}\n${preview}`.trim() || match.id;

        return {
          id: match.id,
          text: text,
          score: match.score,
          metadata: match.metadata
        };
      });

      // Apply reranking
      const rerankResponse = await pinecone.inference.rerank(
        CONFIG.RERANK_MODEL,
        query,
        documentsForRerank.map(doc => ({ text: doc.text })),
        {
          topN: topK,
          returnDocuments: true
        }
      );

      // Map reranked results back to our format
      const rerankedResults = rerankResponse.data.map((item: { index: number; score: number }) => {
        const originalMatch = relevantMatches[item.index];
        return {
          ...formatMatch(originalMatch),
          score: item.score, // Use rerank score
          originalScore: originalMatch.score, // Keep original for debugging
        };
      });


      return rerankedResults;

    } catch (error) {
      console.warn('Reranking failed, falling back to original results:', error);
      // Fallback to original results without reranking
      return relevantMatches.slice(0, topK).map(formatMatch);
    }
  }

  // If we have few results, just return them
  return relevantMatches.slice(0, topK).map(formatMatch);
};

const formatMatch = (match: ScoredPineconeRecord): SearchResult => {
  const metadata = match.metadata as RecordMetadata | undefined;
  return {
    id: match.id,
    score: match.score ?? 0,
    content: "", // Will be filled from file storage via documentId
    metadata: {
      title: metadata?.title as string || "Untitled",
      sourceUrl: metadata?.sourceUrl as string || "",
      preview: metadata?.title as string || "Documentation snippet", // Use title as preview for now
      documentId: metadata?.documentId as string || "", // Reference to full content
    },
  };
};

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
  const defaultSystemPrompt = `You are a helpful documentation assistant. Answer questions based on the provided context from the documentation.

Rules:
1. Only answer based on the provided context
2. If the context doesn't contain the answer, say so clearly and stop there
3. Be concise but thorough
4. Use proper markdown formatting for everything:
   - Use \`\`\`language for code blocks with language specification (e.g., \`\`\`javascript)
   - Use \`inline code\` for small code snippets
   - Use ## headings for main sections, ### for subsections
   - Use blank lines between paragraphs for readability
5. Include code examples when relevant
6. Do not offer to explain things beyond the provided context
7. IMPORTANT: End your response naturally without follow-up questions, suggestions, or invitations for more questions`;

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
          { documentIds: documentIds as Id<"documents">[] }
        );

        // Enhance results with full content
        enhancedResults = searchResults.map((result) => {
          const doc = documents.find(
            (d: { _id: string; fullContent?: string }) => d && d._id === result.metadata.documentId
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

  // Deduplicate sources by sourceUrl to avoid showing the same link multiple times
  const uniqueSources = searchResults
    .map((r) => r.metadata)
    .filter(
      (source, index, array) =>
        array.findIndex((s) => s.sourceUrl === source.sourceUrl) === index
    );

  if (stream) {
    return {
      stream: completion,
      sources: uniqueSources,
    };
  }

  const response = completion as OpenAI.Chat.Completions.ChatCompletion;

  return {
    answer: response.choices[0].message.content || "",
    sources: uniqueSources,
    query,
    tokensUsed: response.usage?.total_tokens,
  };
};
