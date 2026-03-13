const defaultApiUrl = import.meta.env.DEV ? "http://localhost:4000" : "";
const apiUrl = import.meta.env.VITE_API_URL || defaultApiUrl;

if (!apiUrl) {
  throw new Error("VITE_API_URL is required. Set it in your frontend environment.");
}

export const API_BASE = apiUrl.replace(/\/+$/, "");
