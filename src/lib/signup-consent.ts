/**
 * The signup-consent handoff between the signup form and the onboarding page.
 *
 * A Google signup leaves our origin for accounts.google.com and comes back with
 * the account already created, so the ticked Terms / marketing boxes have to
 * survive that round trip before they can be written to the database. They ride
 * in `sessionStorage`, exactly like `signupTrack` already does — same tab, same
 * origin, no server round trip in between.
 *
 * Kept in one module so the writer (the signup page) and the reader (onboarding)
 * cannot drift apart on the key name or the shape.
 */
export const SIGNUP_CONSENT_KEY = "signupConsent";

export interface StoredSignupConsent {
  /** Always `true` — the Google button is gated on the Terms checkbox. */
  termsAccepted: true;
  marketingConsent: boolean;
  /** ISO timestamp of when the boxes were ticked. */
  at: string;
}

export function storeSignupConsent(marketingConsent: boolean): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredSignupConsent = {
      termsAccepted: true,
      marketingConsent,
      at: new Date().toISOString(),
    };
    sessionStorage.setItem(SIGNUP_CONSENT_KEY, JSON.stringify(payload));
  } catch {
    // Private-mode / storage-disabled browsers: the account is still created and
    // the acceptance was still given, we simply cannot timestamp it here.
  }
}

/** Reads and clears the stashed consent. Returns `null` when there is none. */
export function takeSignupConsent(): StoredSignupConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SIGNUP_CONSENT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(SIGNUP_CONSENT_KEY);
    const parsed = JSON.parse(raw) as Partial<StoredSignupConsent>;
    if (parsed?.termsAccepted !== true) return null;
    return {
      termsAccepted: true,
      marketingConsent: parsed.marketingConsent === true,
      at: typeof parsed.at === "string" ? parsed.at : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
