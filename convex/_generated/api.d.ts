/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as assistantActions from "../assistantActions.js";
import type * as assistants from "../assistants.js";
import type * as crawlQueue from "../crawlQueue.js";
import type * as crons from "../crons.js";
import type * as documents from "../documents.js";
import type * as messages from "../messages.js";
import type * as usage from "../usage.js";
import type * as welcome from "../welcome.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  assistantActions: typeof assistantActions;
  assistants: typeof assistants;
  crawlQueue: typeof crawlQueue;
  crons: typeof crons;
  documents: typeof documents;
  messages: typeof messages;
  usage: typeof usage;
  welcome: typeof welcome;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
