const getDefaultApiBase = () => {
  if (typeof window === "undefined") {
    return "http://localhost:4000";
  }

  const { protocol, hostname } = window.location;
  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1";

  if (isLocalhost) {
    return "http://localhost:4000";
  }

  return `${protocol}//${hostname}:4000`;
};

export const API_BASE =
  import.meta.env.VITE_API_URL || getDefaultApiBase();
