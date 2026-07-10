const TOKEN_STORAGE_KEY = "gsqac-session-token";

let memoryToken = null;

function readTokenFromSession() {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeTokenToSession(token) {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
}

export function getAuthToken() {
  if (memoryToken) return memoryToken;
  memoryToken = readTokenFromSession();
  return memoryToken;
}

export function setAuthToken(token) {
  memoryToken = token || null;
  writeTokenToSession(memoryToken);
}

export function clearAuthToken() {
  memoryToken = null;
  writeTokenToSession(null);
}

export function hydrateAuthToken() {
  memoryToken = readTokenFromSession();
  return memoryToken;
}
