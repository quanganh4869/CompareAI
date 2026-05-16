const ACCESS_TOKEN_KEY = "aiia_access_token";
const USER_PROFILE_KEY = "aiia_user_profile";
const ONBOARDING_DONE_KEY = "aiia_onboarding_done";
const USER_ROLE_KEY = "aiia_user_role";

export function normalizeUserRole(role) {
  const value = String(role || "")
    .trim()
    .toLowerCase();

  if (value === "candidate" || value === "user") return "candidate";
  if (value === "recruiter" || value === "hr") return "recruiter";
  return "";
}

export function saveAuthSession({ accessToken }) {
  if (typeof window === "undefined") return;
  if (accessToken) window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
}

export function getAccessToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ACCESS_TOKEN_KEY) || "";
}

export function saveAuthUser(user) {
  if (typeof window === "undefined") return;
  if (!user) return;
  window.localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(user));
}

export function syncUserSessionFromBackend(user) {
  if (!user) return "";

  saveAuthUser(user);
  const normalizedRole = normalizeUserRole(user.role);
  if (normalizedRole) {
    saveUserRole(normalizedRole);
  }

  if (typeof user.needs_role_plan_setup === "boolean") {
    setOnboardingDone(!user.needs_role_plan_setup);
  } else {
    setOnboardingDone(Boolean(user.plan_id));
  }

  return normalizedRole;
}

export function getAuthUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setOnboardingDone(done) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ONBOARDING_DONE_KEY, done ? "1" : "0");
}

export function isOnboardingDone() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ONBOARDING_DONE_KEY) === "1";
}

export function saveUserRole(role) {
  if (typeof window === "undefined") return;
  if (!role) return;
  window.localStorage.setItem(USER_ROLE_KEY, role);
}

export function getUserRole() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(USER_ROLE_KEY) || "";
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  // Cleanup legacy refresh token key from previous storage strategy.
  window.localStorage.removeItem("aiia_refresh_token");
  window.localStorage.removeItem(USER_PROFILE_KEY);
  window.localStorage.removeItem(ONBOARDING_DONE_KEY);
  window.localStorage.removeItem(USER_ROLE_KEY);
}
