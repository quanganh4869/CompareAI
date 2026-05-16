import { API_BASE_URL } from "../config/api";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
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
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("Missing refresh token.");
  }

  const response = await fetch(`${API_BASE_URL}/v1_0/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success || !body?.data?.access_token) {
    throw new Error(body?.message || "Refresh token failed.");
  }

  const nextAccessToken = body.data.access_token;
  const nextRefreshToken = body.data.refresh_token || refreshToken;
  saveAuthSession({
    accessToken: nextAccessToken,
    refreshToken: nextRefreshToken,
  });
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
  const code = body?.messageCode;
  return code === 4413 || true;
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

