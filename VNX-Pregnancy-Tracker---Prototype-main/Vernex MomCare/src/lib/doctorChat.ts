import { API_BASE } from "@/config/api";

export type ConversationItem = {
  peerId: string;
  peerName: string;
  peerRole: string;
  peerEmail: string;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
};

export type DoctorChatMessage = {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

const BASE_URL = `${API_BASE}/api/messages`;

export async function fetchConversations(userId: string): Promise<ConversationItem[]> {
  const res = await fetch(`${BASE_URL}/conversations/${encodeURIComponent(userId)}`);
  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || "Failed to fetch conversations");
  }
  return data.conversations as ConversationItem[];
}

export async function fetchUnreadCount(userId: string): Promise<number> {
  const res = await fetch(`${BASE_URL}/unread/${encodeURIComponent(userId)}`);
  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || "Failed to fetch unread count");
  }
  return Number(data.totalUnread || 0);
}

export async function fetchThread(userId: string, peerId: string): Promise<DoctorChatMessage[]> {
  const res = await fetch(
    `${BASE_URL}/thread?userId=${encodeURIComponent(userId)}&peerId=${encodeURIComponent(peerId)}`
  );
  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || "Failed to fetch thread");
  }
  return data.messages as DoctorChatMessage[];
}

export async function sendDoctorMessage(senderId: string, receiverId: string, content: string) {
  const res = await fetch(`${BASE_URL}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ senderId, receiverId, content }),
  });
  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.message || "Failed to send message");
  }
  return data.message as DoctorChatMessage;
}
