import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Process queue every 25 seconds to respect Firecrawl rate limits (3 req/min)
// This gives us a safe margin above the 20-second minimum
crons.interval(
  "process crawl queue",
  { seconds: 25 },
  internal.crawlQueue.processQueue
);

// Clean up old queue items every hour
crons.interval(
  "cleanup old queue items",
  { hours: 1 },
  internal.crawlQueue.cleanupOldQueueItems
);

export default crons;