import { API_BASE_URL } from "../config/api";
import { clearAuthSession, getAccessToken } from "../utils/authSession";
import { authFetch } from "../utils/authFetch";

function redirectToLanding() {
  clearAuthSession();
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}

function getAuthTokenOrThrow() {
  const token = getAccessToken();
  if (!token) {
    redirectToLanding();
    throw new Error("You are not logged in. Please sign in again.");
  }
  return token;
}

async function parseApiResponse(response) {
  const body = await response.json().catch(() => null);
  if (response.status === 401) {
    redirectToLanding();
  }
  if (response.ok && body?.success) {
    return body.data;
  }
  const message = body?.message || body?.detail || "Request failed.";
  const error = new Error(message);
  error.status = response.status;
  error.body = body;
  throw error;
}

async function directUploadDocument({ token, documentType, formData }) {
  const response = await authFetch(
    `${API_BASE_URL}/v1_0/document/upload/${documentType}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    },
  );

  return parseApiResponse(response);
}

export async function fetchMyDocuments({ documentType } = {}) {
  const token = getAuthTokenOrThrow();
  const query = documentType
    ? `?document_type=${encodeURIComponent(documentType)}`
    : "";
  const response = await authFetch(`${API_BASE_URL}/v1_0/document${query}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseApiResponse(response);
}

export async function uploadCvDocument({ file, targetRole }) {
  if (!file) {
    throw new Error("Please select a CV file.");
  }

  const token = getAuthTokenOrThrow();
  const formData = new FormData();
  formData.append("file", file);
  if (targetRole) {
    formData.append("target_role", targetRole);
  }

  return directUploadDocument({
    token,
    documentType: "cv",
    formData,
  });
}

export async function uploadJdDocument({ title, company, summary, file }) {
  if (!title?.trim()) {
    throw new Error("Please enter JD title.");
  }
  if (!file) {
    throw new Error("Please select a JD file.");
  }

  const token = getAuthTokenOrThrow();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title.trim());
  if (company) {
    formData.append("company", company);
  }
  if (summary) {
    formData.append("summary", summary);
  }

  return directUploadDocument({
    token,
    documentType: "jd",
    formData,
  });
}

export async function createDocumentDownloadUrl({ documentId, expiresIn }) {
  const token = getAuthTokenOrThrow();
  const response = await authFetch(
    `${API_BASE_URL}/v1_0/document/${documentId}/access-url`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_in: expiresIn || null,
        image_only: false,
      }),
    },
  );
  return parseApiResponse(response);
}

export async function createDocumentImageUrl({ documentId, expiresIn }) {
  const token = getAuthTokenOrThrow();
  const response = await authFetch(
    `${API_BASE_URL}/v1_0/document/${documentId}/access-url`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expires_in: expiresIn || null,
        image_only: true,
      }),
    },
  );
  return parseApiResponse(response);
}

export async function deleteDocument({ documentId }) {
  const token = getAuthTokenOrThrow();
  const response = await authFetch(`${API_BASE_URL}/v1_0/document/${documentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return parseApiResponse(response);
}

export async function parseCvDocument({ documentId }) {
  const token = getAuthTokenOrThrow();
  const response = await authFetch(
    `${API_BASE_URL}/v1_0/document/${documentId}/cv-parse`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return parseApiResponse(response);
}

export async function matchCvWithJdText({ cvDocumentId, jdText }) {
  const token = getAuthTokenOrThrow();
  const response = await authFetch(`${API_BASE_URL}/v1_0/document/match-score`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cv_document_id: cvDocumentId,
      jd_text: jdText,
    }),
  });
  return parseApiResponse(response);
}

export async function fetchMatchHistory({ limit = 20, offset = 0 } = {}) {
  const token = getAuthTokenOrThrow();
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const response = await authFetch(
    `${API_BASE_URL}/v1_0/document/match-history?${query.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return parseApiResponse(response);
}

export async function fetchMatchHistoryDetail({ analysisId }) {
  if (!analysisId) {
    throw new Error("analysisId is required.");
  }
  const token = getAuthTokenOrThrow();
  const response = await authFetch(
    `${API_BASE_URL}/v1_0/document/match-history/${analysisId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return parseApiResponse(response);
}
