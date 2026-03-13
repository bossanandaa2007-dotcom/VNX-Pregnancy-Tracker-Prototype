import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ConversationItem, fetchConversations } from "@/lib/doctorChat";

const formatRelative = (iso: string) => {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMin = Math.max(0, Math.floor((now - then) / 60000));
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(iso).toLocaleDateString();
};

export default function DoctorChat() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chats, setChats] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const list = await fetchConversations(user.id);
        setChats(list.filter((c) => c.peerRole === "patient"));
      } catch (err) {
        console.error("Doctor conversations error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [user?.id]);

  const sortedChats = useMemo(
    () =>
      [...chats].sort(
        (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
      ),
    [chats]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Patient Chats</h1>
          <p className="text-muted-foreground">Communicate with your patients</p>
        </div>

        {loading && sortedChats.length === 0 && (
          <p className="text-sm text-muted-foreground">Loading conversations...</p>
        )}

        <div className="space-y-3">
          {sortedChats.map((patient) => (
            <Card
              key={patient.peerId}
              onClick={() =>
                navigate(`/doctor/chat/${patient.peerId}`, {
                  state: { patientName: patient.peerName },
                })
              }
              className="cursor-pointer transition hover:shadow-md hover:border-primary"
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium leading-none">{patient.peerName}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                      {patient.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatRelative(patient.lastAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Ongoing</Badge>
                    {patient.unreadCount > 0 && (
                      <>
                        <Badge variant="destructive">New</Badge>
                        <span
                          className="
                          flex h-5 min-w-[20px] items-center justify-center
                          rounded-full bg-primary px-1.5
                          text-[11px] font-medium text-primary-foreground
                        "
                        >
                          {patient.unreadCount}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && sortedChats.length === 0 && (
          <p className="text-sm text-muted-foreground">No patient messages yet.</p>
        )}
      </div>
    </DashboardLayout>
  );
}
