import { API_BASE_URL } from "../config/api";
import {
  clearAuthSession,
  getAccessToken,
  saveAuthSession,
  syncUserSessionFromBackend,
} from "./authSession";

let inflightRefreshPromise = null;

function redirectToLanding() {
  clearAuthSession();
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}

async function refreshAccessToken() {
  const response = await fetch(`${API_BASE_URL}/v1_0/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success || !body?.data?.access_token) {
    throw new Error(body?.message || "Refresh token failed.");
  }

  const nextAccessToken = body.data.access_token;
  saveAuthSession({ accessToken: nextAccessToken });
  if (body?.data?.user) {
    syncUserSessionFromBackend(body.data.user);
  }
  return nextAccessToken;
}

async function ensureFreshAccessToken() {
  if (!inflightRefreshPromise) {
    inflightRefreshPromise = refreshAccessToken().finally(() => {
      inflightRefreshPromise = null;
    });
  }
  return inflightRefreshPromise;
}

function withAuthHeader(options = {}, accessToken) {
  const headers = new Headers(options.headers || {});
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  return { ...options, headers };
}

function isUnauthorized(body, status) {
  if (status !== 401) return false;
  const code = body?.messageCode ?? body?.msg_code;
  return code === 4413;
}

export async function authFetch(url, options = {}, { retryOn401 = true } = {}) {
  const token = getAccessToken();
  let response = await fetch(url, withAuthHeader(options, token));

  if (retryOn401 && response.status === 401) {
    const body = await response.clone().json().catch(() => null);
    if (isUnauthorized(body, response.status)) {
      try {
        const nextAccessToken = await ensureFreshAccessToken();
        response = await fetch(url, withAuthHeader(options, nextAccessToken));
      } catch {
        redirectToLanding();
      }
    }
  }

  if (response.status === 401) {
    redirectToLanding();
  }
  return response;
}
