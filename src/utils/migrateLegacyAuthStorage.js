import { setAuthToken } from "./authToken";

const LEGACY_LOCAL_KEY = "auth-storage";
const AUTH_PROFILE_KEY = "gsqac-auth-session";

/**
 * One-time migration:
 * - Move legacy Zustand auth (`auth-storage` in localStorage) into current profile key
 * - Move profile previously kept in sessionStorage into localStorage
 *   (sessionStorage is cleared when mobile apps are swiped away / killed)
 */
export function migrateLegacyAuthStorage() {
  try {
    // 1) sessionStorage profile → localStorage (mobile persistence fix)
    const sessionProfileRaw = sessionStorage.getItem(AUTH_PROFILE_KEY);
    const localProfileRaw = localStorage.getItem(AUTH_PROFILE_KEY);

    if (sessionProfileRaw && !localProfileRaw) {
      localStorage.setItem(AUTH_PROFILE_KEY, sessionProfileRaw);
    }
    if (sessionProfileRaw) {
      sessionStorage.removeItem(AUTH_PROFILE_KEY);
    }

    // 2) Very old localStorage shape (`auth-storage`) → current profile key
    const legacyRaw = localStorage.getItem(LEGACY_LOCAL_KEY);
    if (!legacyRaw) return;

    const legacy = JSON.parse(legacyRaw);
    const legacyState = legacy?.state;
    if (!legacyState) {
      localStorage.removeItem(LEGACY_LOCAL_KEY);
      return;
    }

    const hasProfile = !!localStorage.getItem(AUTH_PROFILE_KEY);

    if (!hasProfile && legacyState.user) {
      const { user, role, userId, userName, districtId, token } = legacyState;

      localStorage.setItem(
        AUTH_PROFILE_KEY,
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
