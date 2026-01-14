export const LOCAL_AUTH_KEY = "smg_username_v1";
export const LOCAL_AUTH_USER_ID_KEY = "smg_user_id_v1";

export function getLocalUsername(): string | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(LOCAL_AUTH_KEY);
  return v && v.trim().length > 0 ? v.trim() : null;
}

export function setLocalUsername(name: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_AUTH_KEY, name.trim());
}

export function getLocalUserId(): string | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(LOCAL_AUTH_USER_ID_KEY);
  return v && v.trim().length > 0 ? v.trim() : null;
}

export function setLocalUserId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_AUTH_USER_ID_KEY, id.trim());
}

export function clearLocalUsername() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LOCAL_AUTH_KEY);
  window.localStorage.removeItem(LOCAL_AUTH_USER_ID_KEY);
}


