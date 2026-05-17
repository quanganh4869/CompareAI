const fallbackBaseUrl = import.meta.env.PROD ? "/api" : "http://localhost:8000";
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || fallbackBaseUrl;

export const API_BASE_URL = rawBaseUrl.replace(/\/$/, "");
