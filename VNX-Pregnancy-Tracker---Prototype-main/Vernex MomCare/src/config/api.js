const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error("VITE_API_URL is required. Set it in your frontend environment.");
}

export const API_BASE = apiUrl.replace(/\/+$/, "");
