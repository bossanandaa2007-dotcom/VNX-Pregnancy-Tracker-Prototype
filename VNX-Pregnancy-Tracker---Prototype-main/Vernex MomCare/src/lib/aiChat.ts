import { API_BASE } from "@/config/api";

export async function sendToAI(message: string, userId: string, sessionId: string) {
  const res = await fetch(`${API_BASE}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, userId, sessionId }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "AI failed");
  return data.reply as string;
}

export async function fetchAIHistory(userId: string, sessionId: string, limit = 50) {
  const res = await fetch(
    `${API_BASE}/api/ai/history?userId=${encodeURIComponent(
      userId
    )}&sessionId=${encodeURIComponent(sessionId)}&limit=${limit}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "History failed");
  return data.messages as Array<{
    _id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
  }>;
}

export async function fetchAISessions(userId: string, limit = 50) {
  const res = await fetch(
    `${API_BASE}/api/ai/sessions?userId=${encodeURIComponent(
      userId
    )}&limit=${limit}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Sessions failed");
  return data.sessions as Array<{
    _id: string;
    title?: string;
    lastMessage: string;
    lastAt: string;
    createdAt?: string;
  }>;
}

export async function createAISession(userId: string, title = "") {
  const res = await fetch(`${API_BASE}/api/ai/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, title }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Create session failed");
  return data.session as {
    _id: string;
    title?: string;
    lastMessage: string;
    lastAt: string;
    createdAt?: string;
  };
}

export async function deleteAISession(sessionId: string) {
  const res = await fetch(`${API_BASE}/api/ai/sessions/${sessionId}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Delete session failed");
  return data as { success: boolean };
}

export async function renameAISession(sessionId: string, title: string) {
  const res = await fetch(`${API_BASE}/api/ai/sessions/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Rename session failed");
  return data.session as {
    _id: string;
    title?: string;
    lastMessage: string;
    lastAt: string;
    createdAt?: string;
  };
}
