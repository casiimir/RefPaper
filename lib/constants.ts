// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized",
  ASSISTANT_NOT_READY: "Assistant is not ready yet",
  ASSISTANT_NOT_FOUND: "Assistant not found or unauthorized",
  MONTHLY_LIMIT_REACHED:
    "Monthly question limit reached. Upgrade to Pro for unlimited questions.",
  ASSISTANT_LIMIT_FREE:
    "Free plan limited to 3 assistants. Upgrade to Pro for 20 assistants.",
  ASSISTANT_LIMIT_PRO: "Pro plan limited to 20 assistants total.",
  MESSAGE_REQUIRED: "Message is required",
  NAME_DOCSURL_REQUIRED: "Name and docsUrl are required",
  FAILED_TO_SEND: "Failed to send message",
  FAILED_TO_CREATE: "Failed to create assistant",
} as const;

// Plan limits
export const PLAN_LIMITS = {
  FREE: {
    ASSISTANTS: 3,
    QUESTIONS_PER_MONTH: 20,
  },
  PRO: {
    ASSISTANTS: 20,
    QUESTIONS_PER_MONTH: Infinity,
  },
} as const;

// UI Messages
export const UI_MESSAGES = {
  MONTHLY_LIMIT_TITLE: "Monthly question limit reached!",
  ASSISTANT_LIMIT_TITLE: "Assistant limit reached!",
  UPGRADE_DESCRIPTION: "You need to upgrade to Pro to create new assistants.",
  UPGRADE_QUESTIONS_DESCRIPTION:
    "You've used all 20 free questions this month. You can no longer create new assistants or ask questions until you upgrade.",
} as const;
