import { useMemo, useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Message } from '@/types';
import { createAISession, deleteAISession, fetchAIHistory, fetchAISessions, renameAISession, sendToAI } from '@/lib/aiChat';
import { fetchThread, sendDoctorMessage } from '@/lib/doctorChat';
import { Send, Bot, User, Stethoscope, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE } from "@/config/api";

export default function Chat() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const [activeTab, setActiveTab] = useState<'ai' | 'doctor'>('ai');
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [doctorMessages, setDoctorMessages] = useState<Message[]>([]);
  const [doctorPeerId, setDoctorPeerId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [titleMap, setTitleMap] = useState<Record<string, string>>({});
  const [sessionId, setSessionId] = useState<string>(() => {
    const existing = localStorage.getItem('vnx_chat_session');
    if (existing) return existing;
    const fresh = `s-${Date.now()}`;
    localStorage.setItem('vnx_chat_session', fresh);
    return fresh;
  });
  const [sessions, setSessions] = useState<
    Array<{ id: string; lastMessage: string; lastAt: string; createdAt?: string; title?: string }>
  >([]);
  const [sessionError, setSessionError] = useState('');
  const [menuSessionId, setMenuSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<string>(sessionId);

  const resolveDoctorId = (maybeDoctorId: any): string | null => {
    if (!maybeDoctorId) return null;
    if (typeof maybeDoctorId === 'string') return maybeDoctorId;
    if (typeof maybeDoctorId === 'object' && maybeDoctorId._id) return String(maybeDoctorId._id);
    return null;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [aiMessages, doctorMessages, activeTab]);

  useEffect(() => {
    sessionRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vnx_chat_titles');
      if (raw) setTitleMap(JSON.parse(raw));
    } catch {
      setTitleMap({});
    }
  }, []);

  const saveTitle = (sessionKey: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) {
      setEditingSession(null);
      return;
    }
    renameAISession(sessionKey, trimmed)
      .then((s) => {
        setSessions((prev) =>
          prev.map((it) => (it.id === s._id ? { ...it, title: s.title } : it))
        );
        setEditingSession(null);
      })
      .catch((err) => console.error('Rename session error:', err));
  };

  const filteredSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => {
      const title = (titleMap[s.id] || '').toLowerCase();
      return title.includes(q) || s.lastMessage.toLowerCase().includes(q);
    });
  }, [sessions, searchQuery, titleMap]);

  useEffect(() => {
    const loadSessions = async () => {
      if (!user?.id) return;
      setSessionError('');
      try {
        const list = await fetchAISessions(user.id);
        const mapped = list.map((s) => ({
          id: s._id,
          title: s.title,
          lastMessage: s.lastMessage,
          lastAt: s.lastAt,
          createdAt: s.createdAt,
        }));
        setSessions(mapped);
        if (!selectedSession && mapped[0]) {
          setSelectedSession(mapped[0].id);
          setSessionId(mapped[0].id);
          localStorage.setItem('vnx_chat_session', mapped[0].id);
        }
      } catch (error) {
        console.error('AI sessions error:', error);
        setSessionError('Unable to load sessions. Please restart backend.');
      }
    };

    loadSessions();
  }, [user?.id]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.id || !sessionId) {
        setAiMessages([]);
        return;
      }
      const requestedSession = sessionId;
      try {
        const history = await fetchAIHistory(user.id, sessionId);
        if (sessionRef.current !== requestedSession) return;
        const mapped = history.map((m) => ({
          id: m._id,
          content: m.content,
          senderId: m.role === 'assistant' ? 'ai' : user.id,
          senderType: m.role === 'assistant' ? 'ai' : 'user',
          timestamp: new Date(m.createdAt),
          isAI: m.role === 'assistant',
        }));
        setAiMessages(mapped);
      } catch (error) {
        console.error('AI history error:', error);
      }
    };

    loadHistory();
  }, [user?.id, sessionId]);

  useEffect(() => {
    const loadDoctorPeer = async () => {
      if (!user?.id || user.role !== 'patient') return;

      const existing = resolveDoctorId((user as any)?.doctorId);
      if (existing) {
        setDoctorPeerId(existing);
        return;
      }

      try {
        let data: any = null;
        const byIdRes = await fetch(`${API_BASE}/api/auth/patient/${user.id}`);
        if (byIdRes.ok) {
          data = await byIdRes.json();
        } else if (user.email) {
          const byEmailRes = await fetch(
            `${API_BASE}/api/auth/patient/by-email/${encodeURIComponent(user.email)}`
          );
          if (byEmailRes.ok) data = await byEmailRes.json();
        }
        if (data?.success && data?.patient?.doctorId) {
          setDoctorPeerId(resolveDoctorId(data.patient.doctorId));
        }
      } catch (err) {
        console.error('Doctor peer load error:', err);
      }
    };

    loadDoctorPeer();
  }, [user?.id, user?.role, user?.email]);

  useEffect(() => {
    const loadDoctorThread = async () => {
      if (!user?.id || !doctorPeerId) return;
      try {
        const thread = await fetchThread(user.id, doctorPeerId);
        const mapped: Message[] = thread.map((m) => ({
          id: m._id,
          content: m.content,
          senderId: m.senderId,
          senderType: m.senderId === user.id ? 'user' : 'doctor',
          timestamp: new Date(m.createdAt),
        }));
        setDoctorMessages(mapped);
      } catch (err) {
        console.error('Doctor thread error:', err);
      }
    };

    if (activeTab !== 'doctor') return;

    loadDoctorThread();
    const id = setInterval(loadDoctorThread, 4000);
    return () => clearInterval(id);
  }, [activeTab, doctorPeerId, user?.id]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    if (activeTab === 'doctor' && !doctorPeerId) return;

    const messageText = inputValue.trim();
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: messageText,
      senderId: user?.id || 'user',
      senderType: isDoctor ? 'doctor' : 'user',
      timestamp: new Date(),
    };

    if (activeTab === 'ai') {
      setAiMessages((prev) => [...prev, newMessage]);
    } else {
      setDoctorMessages((prev) => [...prev, newMessage]);
    }
    setInputValue('');

    if (activeTab === 'ai') {
      setIsTyping(true);
      try {
        if (!user?.id) {
          throw new Error('User not found. Please log in again.');
        }
        const reply = await sendToAI(messageText, user.id, sessionId);
        const aiResponse: Message = {
          id: `msg-${Date.now()}-ai`,
          content: reply,
          senderId: 'ai',
          senderType: 'ai',
          timestamp: new Date(),
          isAI: true,
        };
        setAiMessages((prev) => [...prev, aiResponse]);
      } catch (error) {
        const aiError: Message = {
          id: `msg-${Date.now()}-ai-error`,
          content:
            error instanceof Error
              ? error.message
              : 'AI failed. Please try again.',
          senderId: 'ai',
          senderType: 'ai',
          timestamp: new Date(),
          isAI: true,
        };
        setAiMessages((prev) => [...prev, aiError]);
      } finally {
        setIsTyping(false);
      }
    } else {
      if (!user?.id || !doctorPeerId) return;
      try {
        const sent = await sendDoctorMessage(user.id, doctorPeerId, messageText);
        setDoctorMessages((prev) =>
          prev.map((m) =>
            m.id === newMessage.id
              ? {
                  ...m,
                  id: sent._id,
                  timestamp: new Date(sent.createdAt),
                }
              : m
          )
        );
      } catch (error) {
        console.error('Doctor chat send error:', error);
      }
    }
  };

  const startNewChat = () => {
    if (!user?.id) return;
    createAISession(user.id, 'New chat')
      .then((s) => {
        localStorage.setItem('vnx_chat_session', s._id);
        setSessionId(s._id);
        setSelectedSession(s._id);
        setAiMessages([]);
        setIsTyping(false);
        setSessions((prev) => [
          {
            id: s._id,
            title: s.title,
            lastMessage: s.lastMessage,
            lastAt: s.lastAt,
            createdAt: s.createdAt,
          },
          ...prev,
        ]);
      })
      .catch((err) => console.error('Create session error:', err));
  };

  const handleDeleteSession = (id: string) => {
    deleteAISession(id)
      .then(() => {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        if (sessionId === id) {
          setAiMessages([]);
          setSelectedSession(null);
          setSessionId('');
          localStorage.removeItem('vnx_chat_session');
        }
      })
      .catch((err) => console.error('Delete session error:', err));
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-foreground">Chat</h1>
          <p className="text-muted-foreground">
            {isDoctor
              ? 'Communicate with your patients'
              : 'Get support from AI or your doctor'}
          </p>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-0 border-b">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'ai' | 'doctor')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ai" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Thozhi
                </TabsTrigger>
                <TabsTrigger value="doctor" className="gap-2">
                  <Stethoscope className="h-4 w-4" />
                  {isDoctor ? 'Patient Chat' : 'Doctor Chat'}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          {activeTab === 'ai' && (
            <div className="flex items-center gap-2 bg-info/10 border-b border-info/20 px-4 py-2">
              <Info className="h-4 w-4 text-info shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Thozhi</span> - 
                This assistant does not replace professional medical advice.
              </p>
            </div>
          )}

          <CardContent className="flex-1 p-0 overflow-hidden">
            <div className="h-full flex">
              {activeTab === 'ai' && (
                <div className="w-72 shrink-0 border-r bg-muted/30 flex flex-col">
                  <div className="px-4 py-3 border-b relative z-10">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">History</p>
                      <button
                        type="button"
                        onClick={startNewChat}
                        className="text-xs rounded-md border px-2 py-1 pointer-events-auto"
                      >
                        New chat
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your Thozhi chats by session
                    </p>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search chats..."
                      className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-3 space-y-2">
                      {filteredSessions.length === 0 && (
                        <div className="text-xs text-muted-foreground px-1">
                          {sessionError || 'No sessions yet'}
                        </div>
                      )}
                      {filteredSessions.length === 0 && (
                        <button
                          type="button"
                          onClick={startNewChat}
                          className="w-full text-left rounded-lg px-3 py-2 text-sm border"
                        >
                          Start your first chat
                        </button>
                      )}
                      {filteredSessions.map((s) => {
                        const title =
                          titleMap[s.id] ||
                          s.title ||
                          `Chat ${new Date(s.createdAt || s.lastAt).toLocaleDateString()}`;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setSelectedSession(s.id);
                              setSessionId(s.id);
                              localStorage.setItem('vnx_chat_session', s.id);
                            }}
                            className={cn(
                              'w-full text-left rounded-lg px-3 py-2 pr-10 text-sm border relative',
                              selectedSession === s.id
                                ? 'bg-primary/10 border-primary/30 text-foreground'
                                : 'bg-background border-border'
                            )}
                          >
                            <div className="flex items-center justify-between gap-2 pointer-events-auto">
                              <div className="relative pointer-events-auto z-20">
                                <button
                                  type="button"
                                  className="px-1 text-sm text-muted-foreground hover:text-foreground"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setMenuSessionId((prev) => (prev === s.id ? null : s.id));
                                  }}
                                >
                                  ⋯
                                </button>
                                {menuSessionId === s.id && (
                                  <div
                                    className="absolute left-0 mt-1 w-28 rounded-md border bg-background shadow-md z-30"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }}
                                  >
                                    <button
                                      type="button"
                                      className="w-full text-left px-3 py-2 text-xs hover:bg-accent/30"
                                      onClick={() => {
                                        setEditingSession(s.id);
                                        setMenuSessionId(null);
                                      }}
                                    >
                                      Rename
                                    </button>
                                    <button
                                      type="button"
                                      className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-accent/30"
                                      onClick={() => {
                                        handleDeleteSession(s.id);
                                        setMenuSessionId(null);
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                              {editingSession === s.id ? (
                                <input
                                  autoFocus
                                  className="w-full bg-transparent text-sm font-medium outline-none"
                                  defaultValue={title}
                                  onBlur={(e) => saveTitle(s.id, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      saveTitle(s.id, (e.target as HTMLInputElement).value);
                                    }
                                  }}
                                />
                              ) : (
                                <div className="font-medium truncate">{title}</div>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {s.lastMessage || 'Chat'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
              <ScrollArea className="h-full p-4 flex-1">
                <div className="space-y-4">
                  {activeTab === 'ai' && aiMessages.length <= 4 && (
                    <div className="text-center py-8 animate-fade-in">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
                        <Bot className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">Thozhi</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        I'm here to help answer your pregnancy-related questions.
                        Ask me about nutrition, symptoms, exercise, or any other concerns.
                      </p>
                    </div>
                  )}

                  {(activeTab === 'ai' ? aiMessages : doctorMessages).map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-3 animate-fade-in',
                        message.senderType !== 'ai' && !isDoctor && message.senderType === 'user'
                          ? 'flex-row-reverse'
                          : '',
                        isDoctor && message.senderType === 'doctor' ? 'flex-row-reverse' : ''
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                          message.isAI
                            ? 'bg-primary/10'
                            : message.senderType === 'doctor'
                            ? 'bg-info/10'
                            : 'bg-accent'
                        )}
                      >
                        {message.isAI ? (
                          <Bot className="h-4 w-4 text-primary" />
                        ) : message.senderType === 'doctor' ? (
                          <Stethoscope className="h-4 w-4 text-info" />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>

                      <div
                        className={cn(
                          'rounded-2xl px-4 py-3 max-w-[75%]',
                          message.isAI
                            ? 'bg-primary/10 rounded-tl-sm'
                            : message.senderType === 'doctor'
                            ? isDoctor
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : 'bg-info/10 rounded-tl-sm'
                            : !isDoctor && message.senderType === 'user'
                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                            : 'bg-accent rounded-tl-sm'
                        )}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p
                          className={cn(
                            'text-[10px] mt-1',
                            message.senderType === 'user' && !isDoctor
                              ? 'text-primary-foreground/70'
                              : isDoctor && message.senderType === 'doctor'
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                          )}
                        >
                          {message.timestamp.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-3 animate-fade-in">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="rounded-2xl bg-primary/10 px-4 py-3 rounded-tl-sm">
                        <div className="flex gap-1">
                          <span className="h-2 w-2 rounded-full bg-primary/50 animate-pulse-soft" />
                          <span className="h-2 w-2 rounded-full bg-primary/50 animate-pulse-soft" style={{ animationDelay: '150ms' }} />
                          <span className="h-2 w-2 rounded-full bg-primary/50 animate-pulse-soft" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>
          </CardContent>

          <div className="border-t p-4">
            {activeTab === 'doctor' && !doctorPeerId && !isDoctor && (
              <p className="mb-2 text-xs text-muted-foreground">
                You don&apos;t have an assigned doctor yet.
              </p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                placeholder={
                  activeTab === 'ai'
                    ? 'Ask a pregnancy-related question...'
                    : isDoctor
                    ? 'Message your patient...'
                    : 'Message your doctor...'
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="rounded-xl"
                disabled={activeTab === 'doctor' && !doctorPeerId && !isDoctor}
              />
              <Button
                type="submit"
                size="icon"
                className="rounded-xl shrink-0"
                disabled={activeTab === 'doctor' && !doctorPeerId && !isDoctor}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
