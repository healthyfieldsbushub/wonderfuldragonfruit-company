/**
 * Google Consent Mode v2 helpers.
 * Persists user choices in localStorage and forwards them to gtag.
 */

export type ConsentState = "granted" | "denied";

export interface ConsentChoices {
  ad_storage: ConsentState;
  ad_user_data: ConsentState;
  ad_personalization: ConsentState;
  analytics_storage: ConsentState;
  functionality_storage: ConsentState;
  security_storage: ConsentState;
}

export interface StoredConsent {
  version: 1;
  decidedAt: string;
  choices: ConsentChoices;
}

const CONSENT_STORAGE_KEY = "cookie_consent_v1";

export const DEFAULT_DENIED: ConsentChoices = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
  functionality_storage: "granted",
  security_storage: "granted",
};

export const ALL_GRANTED: ConsentChoices = {
  ad_storage: "granted",
  ad_user_data: "granted",
  ad_personalization: "granted",
  analytics_storage: "granted",
  functionality_storage: "granted",
  security_storage: "granted",
};

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

function readStoredConsent(): StoredConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    if (parsed && parsed.version === 1 && parsed.choices) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function hasDecided(): boolean {
  return readStoredConsent() !== null;
}

export function applyConsent(choices: ConsentChoices) {
  if (typeof window === "undefined") return;
  const payload: StoredConsent = {
    version: 1,
    decidedAt: new Date().toISOString(),
    choices,
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota/private-mode errors */
  }
  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", choices);
  }
  window.dispatchEvent(new CustomEvent("consent:updated", { detail: choices }));
}

export function acceptAll() {
  applyConsent(ALL_GRANTED);
}

export function rejectAll() {
  applyConsent(DEFAULT_DENIED);
}

function resetConsent() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
