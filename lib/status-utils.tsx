import { Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";

export function getStatusIcon(status: string) {
  switch (status) {
    case "creating":
    case "crawling":
    case "processing":
      return <Loader2 className="w-4 h-4 animate-spin" />;
    case "ready":
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case "error":
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case "creating":
      return "Creating";
    case "crawling":
      return "Crawling";
    case "processing":
      return "Processing";
    case "ready":
      return "Ready";
    case "error":
      return "Error";
    default:
      return status;
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case "creating":
    case "crawling":
    case "processing":
      return "bg-blue-500/10 text-blue-500 border-blue-200";
    case "ready":
      return "bg-green-500/10 text-green-500 border-green-200";
    case "error":
      return "bg-red-500/10 text-red-500 border-red-200";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-200";
  }
}

export function isProcessingStatus(status: string) {
  return ["creating", "crawling", "processing"].includes(status);
}

export function isReadyStatus(status: string) {
  return status === "ready";
}

export function isErrorStatus(status: string) {
  return status === "error";
}
