import { useMemo, useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSpeechRecognition, type VoiceLanguage } from '@/hooks/useSpeechRecognition';
import { Message } from '@/types';
import {
  createAISession,
  deleteAISession,
  fetchAIHistory,
  fetchAISessions,
  renameAISession,
  sendToAI,
} from '@/lib/aiChat';
import { fetchThread, sendDoctorMessage } from '@/lib/doctorChat';
import { SPEECH_EVENT_NAME, speakResponse, stopSpeaking } from '@/utils/speechSynthesis';
import { Send, Bot, User, Stethoscope, Info, Sparkles, Mic, Square, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE } from '@/config/api';

const mergeVoiceTranscript = (baseText: string, transcript: string) => {
  if (!baseText) return transcript;
  if (!transcript) return baseText;
  return `${baseText}${baseText.endsWith(' ') ? '' : ' '}${transcript}`;
};

type ChatInputMode = 'text' | 'voice';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const voiceLanguage: VoiceLanguage = 'en';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<string>(sessionId);
  const voiceInputBaseRef = useRef('');
  const voicePauseTimeoutRef = useRef<number | null>(null);
  const lastSpokenAiMessageIdRef = useRef<string | null>(null);
  const shouldSpeakNextAiResponseRef = useRef(false);
  const {
    clearTranscript,
    error: speechRecognitionError,
    finalTranscript,
    isListening,
    isSupported: isSpeechRecognitionSupported,
    startListening,
    stopListening,
    transcript,
  } = useSpeechRecognition(voiceLanguage);

  // ✅ Mobile UI: show/hide History (AI tab only)
  const [showHistoryMobile, setShowHistoryMobile] = useState(false);

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
    if (activeTab === 'ai' || !isListening) return;
    stopListening();
  }, [activeTab, isListening, stopListening]);

  useEffect(() => {
    const handleSpeechStateChange = (event: Event) => {
      const detail = (event as CustomEvent<{ state?: 'start' | 'end' }>).detail;
      setIsAiSpeaking(detail?.state === 'start');
    };

    window.addEventListener(SPEECH_EVENT_NAME, handleSpeechStateChange as EventListener);
    return () => {
      window.removeEventListener(SPEECH_EVENT_NAME, handleSpeechStateChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'ai') return;
    if (isListening) {
      stopListening();
    }
    shouldSpeakNextAiResponseRef.current = false;
    setIsAiSpeaking(false);
    stopSpeaking();
    clearTranscript();
  }, [activeTab, clearTranscript, isListening, stopListening]);

  useEffect(() => {
    if (activeTab !== 'ai' || !transcript) return;
    setInputValue(mergeVoiceTranscript(voiceInputBaseRef.current, transcript));
  }, [activeTab, transcript]);

  useEffect(() => {
    if (voicePauseTimeoutRef.current) {
      window.clearTimeout(voicePauseTimeoutRef.current);
      voicePauseTimeoutRef.current = null;
    }

    if (
      activeTab !== 'ai' || !isListening || !transcript
    ) {
      return;
    }

    voicePauseTimeoutRef.current = window.setTimeout(() => {
      stopListening();
    }, 1250);

    return () => {
      if (voicePauseTimeoutRef.current) {
        window.clearTimeout(voicePauseTimeoutRef.current);
        voicePauseTimeoutRef.current = null;
      }
    };
  }, [activeTab, isListening, stopListening, transcript]);

  useEffect(() => {
    if (
      activeTab !== 'ai' || !finalTranscript || isTyping
    ) {
      return;
    }

    void handleSendMessage(finalTranscript, 'voice');
  }, [activeTab, finalTranscript, isTyping]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('vnx_chat_titles');
      if (raw) setTitleMap(JSON.parse(raw));
    } catch {
      setTitleMap({});
    }
  }, []);

  // ✅ Mobile UI: when switching away from AI tab, close history panel
  useEffect(() => {
    if (activeTab !== 'ai') setShowHistoryMobile(false);
  }, [activeTab]);

  const saveTitle = (sessionKey: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) {
      setEditingSession(null);
      return;
    }
    renameAISession(sessionKey, trimmed)
      .then((s) => {
        setSessions((prev) => prev.map((it) => (it.id === s._id ? { ...it, title: s.title } : it)));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        lastSpokenAiMessageIdRef.current = mapped[mapped.length - 1]?.id ?? null;
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
    const latestMessage = aiMessages[aiMessages.length - 1];

    if (
      activeTab !== 'ai' ||
      !latestMessage?.isAI ||
      isTyping ||
      latestMessage.id.includes('-ai-error')
    ) {
      return;
    }

    if (lastSpokenAiMessageIdRef.current === latestMessage.id) {
      return;
    }

    lastSpokenAiMessageIdRef.current = latestMessage.id;
    if (!shouldSpeakNextAiResponseRef.current) {
      return;
    }

    shouldSpeakNextAiResponseRef.current = false;
    speakResponse(latestMessage.content, voiceLanguage);
  }, [activeTab, aiMessages, isTyping, voiceLanguage]);

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

  const handleSendMessage = async (messageOverride?: string, inputMode: ChatInputMode = 'text') => {
    const resolvedMessage = (messageOverride ?? inputValue).trim();

    if (!resolvedMessage) return;
    if (activeTab === 'doctor' && !doctorPeerId) return;

    if (inputMode === 'voice' && activeTab === 'ai') {
      shouldSpeakNextAiResponseRef.current = true;
    } else {
      shouldSpeakNextAiResponseRef.current = false;
      setIsAiSpeaking(false);
      stopSpeaking();
    }

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: resolvedMessage,
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
    clearTranscript();
    voiceInputBaseRef.current = '';

    if (activeTab === 'ai') {
      setIsTyping(true);
      try {
        if (!user?.id) {
          throw new Error('User not found. Please log in again.');
        }
        const reply = await sendToAI(resolvedMessage, user.id, sessionId);
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
          content: error instanceof Error ? error.message : 'AI failed. Please try again.',
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
        const sent = await sendDoctorMessage(user.id, doctorPeerId, resolvedMessage);
        setDoctorMessages((prev) =>
          prev.map((m) =>
            m.id === newMessage.id ? { ...m, id: sent._id, timestamp: new Date(sent.createdAt) } : m
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
        setIsAiSpeaking(false);
        shouldSpeakNextAiResponseRef.current = false;
        stopSpeaking();
        lastSpokenAiMessageIdRef.current = null;
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
        // ✅ Mobile UI: hide history after starting new chat
        setShowHistoryMobile(false);
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
          setIsAiSpeaking(false);
          shouldSpeakNextAiResponseRef.current = false;
          stopSpeaking();
          lastSpokenAiMessageIdRef.current = null;
          localStorage.removeItem('vnx_chat_session');
        }
      })
      .catch((err) => console.error('Delete session error:', err));
  };

  const handleVoiceInputToggle = () => {
    if (!isSpeechRecognitionSupported || activeTab !== 'ai') return;

    if (isListening) {
      stopListening();
      return;
    }

    voiceInputBaseRef.current = inputValue;
    clearTranscript();
    startListening();
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="mb-3 sm:mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Chat</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isDoctor ? 'Communicate with your patients' : 'Get support from AI or your doctor'}
          </p>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-0 border-b">
            <div className="flex flex-col gap-2">
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

              {/* ✅ Mobile-only toolbar for AI tab */}
            </div>
          </CardHeader>

          {activeTab === 'ai' && (
            <div className="flex items-center gap-2 bg-info/10 border-b border-info/20 px-3 sm:px-4 py-2">
              <Info className="h-4 w-4 text-info shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Thozhi</span> - This assistant does not
                replace professional medical advice.
              </p>
            </div>
          )}

          <CardContent className="flex-1 p-0 overflow-hidden">
            {/* ✅ Mobile: column. Desktop: row */}
            <div className="relative h-full flex">
              {activeTab === 'ai' && (
                <button
                  type="button"
                  onClick={() => setShowHistoryMobile((s) => !s)}
                  className="absolute left-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border bg-background/95 shadow-md transition-all hover:bg-accent/30"
                  aria-label={showHistoryMobile ? 'Hide history' : 'Show history'}
                >
                  {showHistoryMobile ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}
              {/* ✅ History (AI only): hidden on mobile unless toggled */}
              {activeTab === 'ai' && (
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 z-20 flex w-[min(22rem,86vw)] flex-col border-r bg-background shadow-xl transition-transform duration-300',
                    showHistoryMobile ? 'translate-x-0' : '-translate-x-full'
                  )}
                >
                  <div className="px-4 py-3 border-b relative z-10">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">History</p>

                      {/* Desktop new chat button (kept) */}
                      <button
                        type="button"
                        onClick={startNewChat}
                        className="hidden lg:inline-flex text-xs rounded-md border px-2 py-1 pointer-events-auto"
                      >
                        New chat
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Your Thozhi chats by session</p>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search chats..."
                      className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none"
                    />
                  </div>

                  <div className="h-[40vh] overflow-y-auto lg:h-full lg:flex-1">
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
                          <div
                            key={s.id}
                            className={cn(
                              'w-full rounded-lg border px-3 py-2 text-sm',
                              selectedSession === s.id
                                ? 'bg-primary/10 border-primary/30 text-foreground'
                                : 'bg-background border-border'
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <div className="min-w-0 flex-1">
                                {editingSession === s.id ? (
                                  <input
                                    autoFocus
                                    className="w-full rounded-md border border-primary/30 bg-background px-2 py-1 text-sm font-medium outline-none"
                                    defaultValue={title}
                                    onBlur={(e) => saveTitle(s.id, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        saveTitle(s.id, (e.target as HTMLInputElement).value);
                                      }
                                      if (e.key === 'Escape') {
                                        setEditingSession(null);
                                      }
                                    }}
                                  />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSession(s.id);
                                      setSessionId(s.id);
                                      localStorage.setItem('vnx_chat_session', s.id);
                                      setShowHistoryMobile(false);
                                    }}
                                    className="w-full text-left"
                                  >
                                    <div className="font-medium truncate">{title}</div>
                                  </button>
                                )}
                                <div className="mt-1 text-xs text-muted-foreground truncate">
                                  {s.lastMessage || 'Chat'}
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-1">
                                <button
                                  type="button"
                                  className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground"
                                  onClick={() => setEditingSession(s.id)}
                                >
                                  Rename
                                </button>
                                <button
                                  type="button"
                                  className="rounded-md px-2 py-1 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-50"
                                  onClick={() => handleDeleteSession(s.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Chat panel */}
              <div className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 p-3 sm:p-4">
                  <div className="space-y-4 pb-4">
                    {activeTab === 'ai' && aiMessages.length <= 4 && (
                      <div className="text-center py-6 sm:py-8 animate-fade-in">
                        <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
                          <Bot className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                        </div>
                        <h3 className="font-semibold text-base sm:text-lg mb-2">Thozhi</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          I'm here to help answer your pregnancy-related questions. Ask me about
                          nutrition, symptoms, exercise, or any other concerns.
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
                            'rounded-2xl px-4 py-3',
                            // ✅ Better widths on mobile
                            'max-w-[90%] sm:max-w-[75%]',
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
                            <span
                              className="h-2 w-2 rounded-full bg-primary/50 animate-pulse-soft"
                              style={{ animationDelay: '150ms' }}
                            />
                            <span
                              className="h-2 w-2 rounded-full bg-primary/50 animate-pulse-soft"
                              style={{ animationDelay: '300ms' }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div
                      ref={messagesEndRef}
                      className={cn(
                        'shrink-0 transition-all duration-300',
                        activeTab === 'ai' && (isListening || isAiSpeaking)
                          ? 'h-32 sm:h-36'
                          : 'h-20 sm:h-24'
                      )}
                    />
                  </div>
                </ScrollArea>

                {/* ✅ Sticky input bar on mobile */}
                <div className="border-t p-3 sm:p-4 sticky bottom-0 bg-background">
                  {activeTab === 'doctor' && !doctorPeerId && !isDoctor && (
                    <p className="mb-2 text-xs text-muted-foreground">
                      You don&apos;t have an assigned doctor yet.
                    </p>
                  )}
                  {activeTab === 'ai' && (isListening || isAiSpeaking) && (
                    <div
                      className={cn(
                        'mb-3 flex items-center justify-between rounded-2xl border px-4 py-3',
                        isListening
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-primary/30 bg-primary/10 text-primary'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('voice-orb', isListening ? 'voice-orb-listening' : 'voice-orb-speaking')} />
                        <div>
                          <p className="text-sm font-medium leading-none">
                            {isListening ? 'Listening to you' : 'Thozhi is speaking'}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {isListening
                              ? 'Speak naturally. Your message will send when you finish.'
                              : 'Voice reply is active only for mic-triggered messages.'}
                          </p>
                        </div>
                      </div>
                      <div className="voice-bars" aria-hidden="true">
                        <span className="voice-bar" />
                        <span className="voice-bar" />
                        <span className="voice-bar" />
                        <span className="voice-bar" />
                      </div>
                    </div>
                  )}
                  {activeTab === 'ai' && speechRecognitionError && (
                    <p className="mb-3 text-xs text-destructive">{speechRecognitionError}</p>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage(undefined, 'text');
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
                    {activeTab === 'ai' && (
                      <Button
                        type="button"
                        size="icon"
                        variant={isListening ? 'default' : 'outline'}
                        className={cn(
                          'rounded-xl shrink-0 transition-all duration-300',
                          isListening && 'scale-105 shadow-[0_0_0_8px_rgba(244,114,182,0.14)]'
                        )}
                        onClick={handleVoiceInputToggle}
                        disabled={!isSpeechRecognitionSupported}
                        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                        title={
                          isSpeechRecognitionSupported
                            ? isListening
                              ? 'Stop listening'
                              : 'Start voice input'
                            : 'Speech recognition is not supported in this browser'
                        }
                      >
                        {isListening ? (
                          <Square className="h-4 w-4 animate-pulse" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </Button>
                    )}
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
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

