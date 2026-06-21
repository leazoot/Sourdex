/*
 * Centralized extension copy. English only for now; the shared i18n library (OQ-T3,
 * i18next) and 简体中文 land with the Web UI in STAGE-07. Kept in one module so no
 * strings are hardcoded in components and the future migration is a drop-in.
 */
export const t = {
  appName: "Sourdex",
  tagline: "Save once. Find forever.",

  connected: "Local service connected",
  notPaired: "Not paired",
  offline: "Service offline",
  checking: "Checking…",

  savePage: "Save Page",
  saveSelection: "Save Selection",
  saveAs: "Save as",
  webpage: "Webpage",
  selection: "Selection",
  settings: "Settings",
  saving: "Saving…",
  saved: "Saved to Sourdex",
  retry: "Retry",
  openSettings: "Open settings",
  pairPrompt: "Pair this extension with your local Sourdex service to start saving.",

  connectTitle: "Connect to your local service",
  pairIntro: "Pair this extension with the Sourdex app running on your computer.",
  startPairing: "Start pairing",
  pairStep: "Enter the 6-digit code shown in the Sourdex service terminal.",
  codePlaceholder: "6-digit code",
  confirm: "Confirm",
  cancel: "Cancel",
  pairedOk: "Paired and connected.",
  unpair: "Unpair",
  offlineHelp: "Start the Sourdex service on your computer, then try again.",
} as const;
