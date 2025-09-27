"use client";

import { useState, useCallback } from "react";

export interface ChatMetrics {
  query: string;
  queryTokens: number;
  searchResults: number;
  contextTokens: number;
  responseTokens: number;
  totalTokens: number;
  timestamp: number;
  duration?: number;
  model: string;
  embeddingTime?: number;
  searchTime?: number;
  generationTime?: number;
  contextChunks?: any[];
  rawResponse?: any;
}

interface ChatDebugState {
  metrics: ChatMetrics[];
  isRecording: boolean;
  currentSession: {
    startTime?: number;
    queryStartTime?: number;
    embeddingStartTime?: number;
    searchStartTime?: number;
    generationStartTime?: number;
  };
}

// Helper to estimate tokens
const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};

export function useChatDebug() {
  const [state, setState] = useState<ChatDebugState>({
    metrics: [],
    isRecording: process.env.NODE_ENV === 'development',
    currentSession: {}
  });

  // Start tracking a new query
  const startQuery = useCallback((query: string) => {
    if (!state.isRecording) return;

    setState(prev => ({
      ...prev,
      currentSession: {
        startTime: Date.now(),
        queryStartTime: Date.now()
      }
    }));
  }, [state.isRecording]);

  // Track embedding phase
  const startEmbedding = useCallback(() => {
    if (!state.isRecording) return;

    setState(prev => ({
      ...prev,
      currentSession: {
        ...prev.currentSession,
        embeddingStartTime: Date.now()
      }
    }));
  }, [state.isRecording]);

  // Track search phase
  const startSearch = useCallback(() => {
    if (!state.isRecording) return;

    setState(prev => ({
      ...prev,
      currentSession: {
        ...prev.currentSession,
        searchStartTime: Date.now()
      }
    }));
  }, [state.isRecording]);

  // Track generation phase
  const startGeneration = useCallback(() => {
    if (!state.isRecording) return;

    setState(prev => ({
      ...prev,
      currentSession: {
        ...prev.currentSession,
        generationStartTime: Date.now()
      }
    }));
  }, [state.isRecording]);

  // Complete and record metrics
  const completeQuery = useCallback((data: {
    query: string;
    response: string;
    contextChunks: any[];
    model?: string;
    rawResponse?: any;
  }) => {
    if (!state.isRecording || !state.currentSession.startTime) return;

    const now = Date.now();
    const { query, response, contextChunks, model = "gpt-5-nano", rawResponse } = data;

    // Calculate tokens
    const queryTokens = estimateTokens(query);
    const contextTokens = contextChunks.reduce((sum, chunk) => sum + estimateTokens(chunk.content || ''), 0);
    const responseTokens = estimateTokens(response);

    // Calculate timings
    const totalDuration = now - state.currentSession.startTime;
    const embeddingTime = state.currentSession.searchStartTime && state.currentSession.embeddingStartTime
      ? state.currentSession.searchStartTime - state.currentSession.embeddingStartTime
      : undefined;
    const searchTime = state.currentSession.generationStartTime && state.currentSession.searchStartTime
      ? state.currentSession.generationStartTime - state.currentSession.searchStartTime
      : undefined;
    const generationTime = state.currentSession.generationStartTime
      ? now - state.currentSession.generationStartTime
      : undefined;

    const metrics: ChatMetrics = {
      query,
      queryTokens,
      searchResults: contextChunks.length,
      contextTokens,
      responseTokens,
      totalTokens: queryTokens + contextTokens + responseTokens,
      timestamp: state.currentSession.startTime,
      duration: totalDuration,
      model,
      embeddingTime,
      searchTime,
      generationTime,
      contextChunks,
      rawResponse
    };

    setState(prev => ({
      ...prev,
      metrics: [metrics, ...prev.metrics.slice(0, 49)], // Keep last 50
      currentSession: {}
    }));
  }, [state.isRecording, state.currentSession]);

  // Control functions
  const toggleRecording = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRecording: !prev.isRecording
    }));
  }, []);

  const clearMetrics = useCallback(() => {
    setState(prev => ({
      ...prev,
      metrics: [],
      currentSession: {}
    }));
  }, []);

  // Computed stats
  const stats = {
    totalQueries: state.metrics.length,
    avgResponseTime: state.metrics.length > 0
      ? Math.round(state.metrics.reduce((sum, m) => sum + (m.duration || 0), 0) / state.metrics.length)
      : 0,
    totalTokensUsed: state.metrics.reduce((sum, m) => sum + m.totalTokens, 0),
    avgTokensPerQuery: state.metrics.length > 0
      ? Math.round(state.metrics.reduce((sum, m) => sum + m.totalTokens, 0) / state.metrics.length)
      : 0,
    totalInputTokens: state.metrics.reduce((sum, m) => sum + m.queryTokens + m.contextTokens, 0),
    totalOutputTokens: state.metrics.reduce((sum, m) => sum + m.responseTokens, 0),
    estimatedCost: (() => {
      // GPT-5 nano pricing (corrected)
      const inputCostPer1M = 0.050; // $0.050 per 1M input tokens
      const outputCostPer1M = 0.400; // $0.400 per 1M output tokens
      const inputTokens = state.metrics.reduce((sum, m) => sum + m.queryTokens + m.contextTokens, 0);
      const outputTokens = state.metrics.reduce((sum, m) => sum + m.responseTokens, 0);
      return (inputTokens / 1000000 * inputCostPer1M) + (outputTokens / 1000000 * outputCostPer1M);
    })()
  };

  return {
    metrics: state.metrics,
    isRecording: state.isRecording,
    stats,
    // Control functions
    toggleRecording,
    clearMetrics,
    // Tracking functions
    startQuery,
    startEmbedding,
    startSearch,
    startGeneration,
    completeQuery
  };
}

export default useChatDebug;