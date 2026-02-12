import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, User, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { fetchThread, sendDoctorMessage } from "@/lib/doctorChat";

interface ChatMessage {
  id: string;
  sender: "doctor" | "patient";
  content: string;
  time: string;
}

export default function DoctorChatRoom() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const patientName = (location.state as any)?.patientName || "Patient";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const loadThread = async () => {
      if (!user?.id || !patientId) return;
      setLoading(true);
      try {
        const thread = await fetchThread(user.id, patientId);
        const mapped: ChatMessage[] = thread.map((m) => ({
          id: m._id,
          sender: m.senderId === user.id ? "doctor" : "patient",
          content: m.content,
          time: new Date(m.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        setMessages(mapped);
      } catch (err) {
        console.error("Doctor room fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadThread();
    const id = setInterval(loadThread, 4000);
    return () => clearInterval(id);
  }, [patientId, user?.id]);

  const handleSend = async () => {
    if (!input.trim() || !user?.id || !patientId) return;
    const content = input.trim();

    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      sender: "doctor",
      content,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput("");

    try {
      const sent = await sendDoctorMessage(user.id, patientId, content);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimistic.id
            ? {
                ...m,
                id: sent._id,
                time: new Date(sent.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              }
            : m
        )
      );
    } catch (err) {
      console.error("Doctor send error:", err);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/doctor/chat")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Patient Chat</h1>
            <p className="text-sm text-muted-foreground">
              {patientName} ({patientId})
            </p>
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {loading && messages.length === 0 && (
                <p className="text-sm text-muted-foreground">Loading messages...</p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex gap-3", msg.sender === "doctor" && "flex-row-reverse")}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    {msg.sender === "doctor" ? (
                      <Stethoscope className="h-4 w-4 text-primary" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>

                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 max-w-[70%]",
                      msg.sender === "doctor"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-accent rounded-tl-sm"
                    )}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <p className="text-[10px] mt-1 opacity-70">{msg.time}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <div className="border-t p-4 flex gap-2">
            <Input
              placeholder="Message patient..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <Button onClick={handleSend} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
