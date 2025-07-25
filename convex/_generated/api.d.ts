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
import type * as aiSuggestions from "../aiSuggestions.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as meals from "../meals.js";
import type * as myFunctions from "../myFunctions.js";
import type * as userPreferences from "../userPreferences.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  aiSuggestions: typeof aiSuggestions;
  auth: typeof auth;
  http: typeof http;
  meals: typeof meals;
  myFunctions: typeof myFunctions;
  userPreferences: typeof userPreferences;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
