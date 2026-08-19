/**
 * RPC IDs for Google Gemini Notebook (formerly NotebookLM) internal endpoints
 * (batchexecute). Discovered via reverse engineering; cross-checked against
 * the empirical RPC map maintained by the notebooklm-py project.
 */
export const RPC_IDS = {
  LIST_NOTEBOOKS: "wXbhsf",
  CREATE_NOTEBOOK: "CCqFvf",
  GET_NOTEBOOK: "rLM1Ne",
  DELETE_NOTEBOOK: "WWINqb",
  // Generic notebook mutator (MutateProject): rename, chat settings, view level
  RENAME_NOTEBOOK: "s0tc2d",
  SUMMARIZE: "VfAZjd",
  SUGGEST_PROMPTS: "otmP3b",

  ADD_SOURCE: "izAoDd",
  GET_SOURCE: "hizoJc",
  DELETE_SOURCE: "tGMBJ",
  SYNC_DRIVE_SOURCE: "FLmJqe",
  CHECK_FRESHNESS: "yR9Yof",
  UPDATE_SOURCE: "b7Wfje",
  GET_SOURCE_GUIDE: "tr032e",

  QUERY: "Y0vGub", // RT=C Streaming

  START_FAST_RESEARCH: "Ljjv0c",
  START_DEEP_RESEARCH: "QA9ei",
  POLL_RESEARCH: "e3bVqc",
  IMPORT_RESEARCH: "LBwxtb",

  STUDIO_GENERATE: "R7cb6c",
  STUDIO_STATUS: "gArtLc",
  STUDIO_DELETE: "V5N4be",
  GET_INTERACTIVE_HTML: "v9rmvd",
  RENAME_ARTIFACT: "rc3d8d",
  EXPORT_ARTIFACT: "Krh3pd",

  GENERATE_MIND_MAP: "yyryJe",
  // Mind maps are note-backed: these three are the generic note RPCs.
  CREATE_NOTE: "CYK0Xb",
  UPDATE_NOTE: "cYAfTb",
  GET_NOTES: "cFji9",
  DELETE_NOTE: "AH0mwd",

  GET_LAST_CONVERSATION_ID: "hPTbtc",
  GET_CONVERSATION_TURNS: "khqZz",
  DELETE_CHAT_HISTORY: "J7Gthc",

  SHARE_NOTEBOOK: "QDyure",
  GET_SHARE_STATUS: "JFMDGd",
};

export const BASE_URL = "https://notebooklm.google.com";
export const BATCH_EXECUTE_PATH = "/_/LabsTailwindUi/data/batchexecute";
export const QUERY_PATH = "/_/LabsTailwindUi/data/google.internal.labs.tailwind.orchestration.v1.LabsTailwindOrchestrationService/GenerateFreeFormStreamed";

export const DEFAULT_QUERY_TIMEOUT = 120000; // 120s
export const SOURCE_ADD_TIMEOUT = 120000; // 120s for large sources

// Build label (may need periodic updates as Google changes this)
export const BUILD_LABEL = "boq_labs-tailwind-frontend_20260108.06_p0";

/**
 * Nested request-options wrapper required by migrated (Gemini 3.5 era)
 * backends for CREATE_NOTEBOOK and ADD_SOURCE. The older flat `[2], [1,...]`
 * tails are rejected there with gRPC status 3/5/9. Returns a fresh array per
 * call so nested structures are never shared between requests.
 */
export function templateBlock(): any[] {
  return [2, null, null, [1, null, null, null, null, null, null, null, null, null, [1]]];
}

/**
 * Client-options envelope observed on current web-UI CREATE_ARTIFACT calls
 * (templateBlock plus a capability projection).
 */
export function artifactClientOptions(): any[] {
  return [...templateBlock(), [[1, 4, 8, 2, 3, 6]]];
}

// ============================================================================
// Wire enums (label -> integer code), single source of truth for tool params.
// Values recovered from the NotebookLM web client / notebooklm-py.
// ============================================================================

export const AUDIO_FORMAT_CODES: Record<string, number> = {
  deep_dive: 1,
  brief: 2,
  critique: 3,
  debate: 4,
};

export const AUDIO_LENGTH_CODES: Record<string, number> = {
  short: 1,
  default: 2,
  long: 3,
};

export const VIDEO_STYLE_CODES: Record<string, number> = {
  auto: 1,
  classic: 2,
  whiteboard: 3,
  heritage: 4,
  paper_craft: 5,
  watercolor: 6,
  anime: 7,
  retro_print: 8,
  kawaii: 9,
};

export const INFOGRAPHIC_ORIENTATION_CODES: Record<string, number> = {
  landscape: 1,
  portrait: 2,
  square: 3,
};

export const QUIZ_QUANTITY_CODES: Record<string, number> = {
  fewer: 1,
  standard: 2,
  more: 3,
};

export const QUIZ_DIFFICULTY_CODES: Record<string, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

// Studio type-4 family variants (at options slot [9][1][0])
export const STUDIO_VARIANT = {
  FLASHCARDS: 1,
  QUIZ: 2,
  INTERACTIVE_MIND_MAP: 4,
};

// EXPORT_ARTIFACT destinations (exports go to the user's Google Drive)
export const EXPORT_FORMAT_CODES: Record<string, number> = {
  docs: 1,
  sheets: 2,
};

// Chat configuration codes (sent through the s0tc2d MutateProject envelope)
export const CHAT_GOAL_CODES: Record<string, number> = {
  default: 1,
  custom: 2,
  learning_guide: 3,
};

export const CHAT_RESPONSE_LENGTH_CODES: Record<string, number> = {
  default: 1,
  longer: 4,
  shorter: 5,
};

// Notebook share access levels
export const SHARE_ACCESS = {
  RESTRICTED: 0,
  ANYONE_WITH_LINK: 1,
};

// Collaborator permission codes for SHARE_NOTEBOOK
export const SHARE_PERMISSION_CODES: Record<string, number> = {
  editor: 2,
  viewer: 3,
};
