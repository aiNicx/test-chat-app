/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agent from "../agent.js";
import type * as chat from "../chat.js";
import type * as chatActions from "../chatActions.js";
import type * as chunking from "../chunking.js";
import type * as embedding from "../embedding.js";
import type * as http from "../http.js";
import type * as knowledge from "../knowledge.js";
import type * as knowledgeActions from "../knowledgeActions.js";
import type * as myFunctions from "../myFunctions.js";
import type * as setupKnowledge from "../setupKnowledge.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  agent: typeof agent;
  chat: typeof chat;
  chatActions: typeof chatActions;
  chunking: typeof chunking;
  embedding: typeof embedding;
  http: typeof http;
  knowledge: typeof knowledge;
  knowledgeActions: typeof knowledgeActions;
  myFunctions: typeof myFunctions;
  setupKnowledge: typeof setupKnowledge;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
