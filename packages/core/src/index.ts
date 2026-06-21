/**
 * @sourdex/core — shared types, domain models, enums, utilities, error types and
 * capability contracts. Inner-most layer: depends on nothing else in the repo
 * (PRD §9.2). No UI, DB, AI or server logic lives here.
 */
export const SOURDEX_CORE_VERSION = "0.0.0";

export * from "./types/index.js";
export * from "./errors/index.js";
export * from "./utils/index.js";
export * from "./contracts/index.js";
