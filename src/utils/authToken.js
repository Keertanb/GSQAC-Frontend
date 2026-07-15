const TOKEN_STORAGE_KEY = "gsqac-auth-token";
const LEGACY_SESSION_TOKEN_KEY = "gsqac-session-token";

let memoryToken = null;

function readTokenFromStorage() {
  try {
    return (
      localStorage.getItem(TOKEN_STORAGE_KEY) ||
      sessionStorage.getItem(LEGACY_SESSION_TOKEN_KEY) ||
      sessionStorage.getItem(TOKEN_STORAGE_KEY)
    );
  } catch {
    return null;
  }
}

function writeTokenToStorage(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    // Clear any leftover session tokens so mobile/WebView kills don't leave stale state.
    sessionStorage.removeItem(LEGACY_SESSION_TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
}

export function getAuthToken() {
  if (memoryToken) return memoryToken;
  memoryToken = readTokenFromStorage();
  return memoryToken;
}

export function setAuthToken(token) {
  memoryToken = token || null;
  writeTokenToStorage(memoryToken);
}

export function clearAuthToken() {
  memoryToken = null;
  writeTokenToStorage(null);
}

export function hydrateAuthToken() {
  memoryToken = readTokenFromStorage();
  // Persist migrated session token into localStorage for mobile app survival.
  if (memoryToken) {
    writeTokenToStorage(memoryToken);
  }
  return memoryToken;
}
