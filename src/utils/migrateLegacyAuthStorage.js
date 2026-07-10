import { setAuthToken } from "./authToken";

const LEGACY_LOCAL_KEY = "auth-storage";
const SESSION_PROFILE_KEY = "gsqac-auth-session";

/**
 * One-time migration: move auth profile + token from localStorage to sessionStorage,
 * then remove the legacy localStorage entry (which exposed the JWT).
 */
export function migrateLegacyAuthStorage() {
  try {
    const legacyRaw = localStorage.getItem(LEGACY_LOCAL_KEY);
    if (!legacyRaw) return;

    const legacy = JSON.parse(legacyRaw);
    const legacyState = legacy?.state;
    if (!legacyState) {
      localStorage.removeItem(LEGACY_LOCAL_KEY);
      return;
    }

    const hasNewSession = !!sessionStorage.getItem(SESSION_PROFILE_KEY);

    if (!hasNewSession && legacyState.user) {
      const { user, role, userId, userName, districtId, token } = legacyState;

      sessionStorage.setItem(
        SESSION_PROFILE_KEY,
        JSON.stringify({
          state: { user, role, userId, userName, districtId },
          version: 0,
        }),
      );

      if (token) {
        setAuthToken(token);
      }
    }

    localStorage.removeItem(LEGACY_LOCAL_KEY);
  } catch (error) {
    console.warn("Failed to migrate legacy auth storage:", error);
    try {
      localStorage.removeItem(LEGACY_LOCAL_KEY);
    } catch {
      // ignore
    }
  }
}
