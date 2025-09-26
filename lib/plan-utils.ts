import { api } from "@/convex/_generated/api";
import { ERROR_MESSAGES, PLAN_LIMITS } from "./constants";
import type { AuthenticatedContext } from "./api-middleware";

export interface LimitCheckResult {
  canProceed: boolean;
  error?: {
    message: string;
    type: "question_limit" | "assistant_limit";
    questionsUsed?: number;
    limit?: number;
    upgradeRequired: boolean;
  };
}

/**
 * Check if user can create new assistants based on plan limits
 */
export async function checkAssistantCreationLimits(
  context: AuthenticatedContext
): Promise<LimitCheckResult> {
  const { convex, isPro } = context;

  // Get current usage
  const [assistants, questionsThisMonth] = await Promise.all([
    convex.query(api.assistants.getAssistants, {}),
    isPro ? Promise.resolve(0) : convex.query(api.usage.getCurrentMonthUsage, {}),
  ]);

  if (!isPro) {
    // Check monthly question limit first (more restrictive)
    if (questionsThisMonth >= PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH) {
      return {
        canProceed: false,
        error: {
          message: ERROR_MESSAGES.MONTHLY_LIMIT_REACHED,
          type: "question_limit",
          questionsUsed: questionsThisMonth,
          limit: PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH,
          upgradeRequired: true,
        },
      };
    }

    // Check assistant limit
    if (assistants.length >= PLAN_LIMITS.FREE.ASSISTANTS) {
      return {
        canProceed: false,
        error: {
          message: ERROR_MESSAGES.ASSISTANT_LIMIT_FREE,
          type: "assistant_limit",
          upgradeRequired: true,
        },
      };
    }
  } else {
    // Pro plan: check assistant limit
    if (assistants.length >= PLAN_LIMITS.PRO.ASSISTANTS) {
      return {
        canProceed: false,
        error: {
          message: ERROR_MESSAGES.ASSISTANT_LIMIT_PRO,
          type: "assistant_limit",
          upgradeRequired: false,
        },
      };
    }
  }

  return { canProceed: true };
}

/**
 * Check if user can send chat messages based on plan limits
 */
export async function checkChatMessageLimits(
  context: AuthenticatedContext
): Promise<LimitCheckResult> {
  const { convex, isPro } = context;

  if (isPro) {
    return { canProceed: true };
  }

  // Check if free user has reached monthly limit
  const questionsThisMonth = await convex.query(api.usage.getCurrentMonthUsage, {});

  if (questionsThisMonth >= PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH) {
    return {
      canProceed: false,
      error: {
        message: ERROR_MESSAGES.MONTHLY_LIMIT_REACHED,
        type: "question_limit",
        questionsUsed: questionsThisMonth,
        limit: PLAN_LIMITS.FREE.QUESTIONS_PER_MONTH,
        upgradeRequired: true,
      },
    };
  }

  return { canProceed: true };
}