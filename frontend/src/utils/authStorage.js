const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

const emitAuthChanged = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("auth:changed"));
};

const readFromAnyStorage = (key) => {
  const localValue = localStorage.getItem(key);
  if (localValue) return localValue;
  return sessionStorage.getItem(key) || "";
};

export const saveAuthSession = ({ token, user, rememberMe = true }) => {
  const targetStorage = rememberMe ? localStorage : sessionStorage;
  const otherStorage = rememberMe ? sessionStorage : localStorage;

  otherStorage.removeItem(AUTH_TOKEN_KEY);
  otherStorage.removeItem(AUTH_USER_KEY);

  targetStorage.setItem(AUTH_TOKEN_KEY, token || "");
  targetStorage.setItem(AUTH_USER_KEY, JSON.stringify(user || {}));

  emitAuthChanged();
};

export const getAuthToken = () => readFromAnyStorage(AUTH_TOKEN_KEY);

export const getAuthUser = () => {
  const rawUser = readFromAnyStorage(AUTH_USER_KEY);
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_USER_KEY);

  emitAuthChanged();
};
