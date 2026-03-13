import { API_BASE } from "@/config/api";

export interface WeatherSummary {
  temp: number;
  condition: string;
  desc: string;
  humidity: number;
}

export interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "danger";
  city: string;
  createdAt: string;
  url?: string;
  source?: string;
}

export interface ResourceLink {
  title: string;
  url: string;
  source: string;
  updatedAt?: string | null;
}

export async function refreshNotifications(userId: string, city: string) {
  const res = await fetch(`${API_BASE}/api/notifications/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, city }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Notification refresh failed");
  return data as {
    city: string;
    summary: WeatherSummary;
    notifications: NotificationItem[];
  };
}

export async function fetchResources() {
  const res = await fetch(`${API_BASE}/api/notifications/resources`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Resources failed");
  return data.resources as ResourceLink[];
}
