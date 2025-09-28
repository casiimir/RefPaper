"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bug, RefreshCw, Clock, FileText, Zap, Database } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Assistant } from "@/types/assistant";

interface DebugDialogProps {
  assistant?: Assistant;
}


// Helper to format numbers
const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

// Helper to calculate progress percentage
const getProgressPercentage = (current?: number, total?: number): number => {
  if (!current || !total) return 0;
  return Math.round((current / total) * 100);
};

export function DebugDialog({ assistant }: DebugDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Only show in development
  const assistants = useQuery(api.assistants.getAssistants);
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev) return null;

  const refresh = () => {
    window.location.reload();
  };

  const selectedAssistant = assistant || (assistants && assistants[0]);

  if (!selectedAssistant) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="fixed bottom-4 right-4 z-50">
            <Bug className="w-4 h-4 mr-1" />
            Debug
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5" />
              Development Debug Panel
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-muted-foreground">
            No assistants found
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Calculate estimated metrics
  const estimatedPagesTokens = selectedAssistant.totalPages
    ? selectedAssistant.totalPages * 2000 // Estimate 2k tokens per page
    : 0;

  const chunkEstimate = Math.ceil(estimatedPagesTokens / 375); // ~375 tokens per chunk
  const maxTokensPerPage = 50000; // Our limit
  const embeddingLimit = 8192; // OpenAI limit

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="fixed bottom-4 right-4 z-50">
          <Bug className="w-4 h-4 mr-1" />
          Debug
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            Development Debug Panel
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={refresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assistant Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Assistant Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Name</div>
                  <div className="text-sm text-muted-foreground">{selectedAssistant.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Status</div>
                  <Badge className={
                    selectedAssistant.status === 'ready' ? 'bg-green-100 text-green-800' :
                    selectedAssistant.status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }>
                    {selectedAssistant.status}
                  </Badge>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Documentation URL</div>
                <div className="text-xs text-muted-foreground break-all">
                  {selectedAssistant.docsUrl}
                </div>
              </div>

              {selectedAssistant.errorMessage && (
                <div>
                  <div className="text-sm font-medium text-red-600">Error Message</div>
                  <div className="text-xs text-red-500 break-all">
                    {selectedAssistant.errorMessage}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Crawling Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Crawling Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {formatNumber(selectedAssistant.processedPages || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {formatNumber(selectedAssistant.totalPages || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Pages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {getProgressPercentage(selectedAssistant.processedPages, selectedAssistant.totalPages)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Progress</div>
                </div>
              </div>

              <Progress
                value={getProgressPercentage(selectedAssistant.processedPages, selectedAssistant.totalPages)}
                className="h-2"
              />

              <div className="h-px bg-border my-4" />

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="font-medium">Plan Limits</div>
                  <div className="text-muted-foreground">Free: 20 pages</div>
                  <div className="text-muted-foreground">Pro: 150 pages</div>
                </div>
                <div>
                  <div className="font-medium">Crawl Depth</div>
                  <div className="text-muted-foreground">Free: 3 levels</div>
                  <div className="text-muted-foreground">Pro: 15 levels</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Token Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Token Analysis (Estimates)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-lg font-bold">
                    {formatNumber(estimatedPagesTokens)}
                  </div>
                  <div className="text-sm text-muted-foreground">Est. Total Tokens</div>
                  <div className="text-xs text-muted-foreground">
                    ~2k tokens/page × {selectedAssistant.totalPages || 0} pages
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold">
                    {formatNumber(chunkEstimate)}
                  </div>
                  <div className="text-sm text-muted-foreground">Est. Chunks</div>
                  <div className="text-xs text-muted-foreground">
                    ~375 tokens/chunk
                  </div>
                </div>
              </div>

              <div className="h-px bg-border my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Token Limits:</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="font-medium text-orange-600">Per Page Limit</div>
                    <div className="text-muted-foreground">
                      {formatNumber(maxTokensPerPage)} tokens
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-red-600">Embedding Limit</div>
                    <div className="text-muted-foreground">
                      {formatNumber(embeddingLimit)} tokens
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              {estimatedPagesTokens > maxTokensPerPage && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <div className="text-sm font-medium text-orange-800">
                    ⚠️ Potential Token Limit Issue
                  </div>
                  <div className="text-xs text-orange-600">
                    Estimated tokens may exceed per-page limit
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pinecone Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Pinecone Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">Namespace</div>
                  <div className="text-muted-foreground font-mono text-xs">
                    {selectedAssistant.pineconeNamespace || 'Not created'}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Embedding Model</div>
                  <div className="text-muted-foreground">text-embedding-3-small</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <div>Chunk Size: 1500 chars (~375 tokens)</div>
                <div>Chunk Overlap: 200 chars</div>
                <div>Top-K Search: 3 results</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DebugDialog;