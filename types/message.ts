export interface Message {
  _id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    url: string;
    title: string;
    preview: string;
  }>;
  createdAt: number;
}