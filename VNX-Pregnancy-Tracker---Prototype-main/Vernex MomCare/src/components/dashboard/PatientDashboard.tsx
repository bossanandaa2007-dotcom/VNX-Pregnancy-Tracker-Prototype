import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Baby,
  Bell,
  Calendar,
  Droplets,
  Footprints,
  Heart,
  Pill,
  Search,
  Sparkles,
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from "@/config/api";
import {
  fetchResources,
  refreshNotifications,
  NotificationItem,
  ResourceLink,
  WeatherSummary,
} from '@/lib/notifications';

type PatientProfile = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  pregnancyStartDate?: string;
  gestationalWeek?: number;
  age?: number;
  contactPhone?: string;
  riskStatus?: 'normal' | 'attention' | 'high-risk';
  doctorId?: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const getMilestoneByWeek = (week: number) => {
  if (week <= 13) return 'First Trimester';
  if (week <= 27) return 'Second Trimester';
  return 'Third Trimester';
};

const getBabySizeVisual = (week: number) => {
  if (week <= 8) return { emoji: '\u{1FAD0}', label: 'Blueberry', description: '~1.5 cm long' };
  if (week <= 12) return { emoji: '\u{1F34B}', label: 'Lemon', description: '~6 cm long' };
  if (week <= 16) return { emoji: '\u{1F951}', label: 'Avocado', description: '~12 cm long' };
  if (week <= 20) return { emoji: '\u{1F34C}', label: 'Banana', description: '~25 cm long' };
  if (week <= 24) return { emoji: '\u{1F33D}', label: 'Corn', description: '~30 cm long' };
  if (week <= 28) return { emoji: '\u{1F346}', label: 'Eggplant', description: '~37 cm long' };
  if (week <= 32) return { emoji: '\u{1F965}', label: 'Coconut', description: '~42 cm long' };
  if (week <= 36) return { emoji: '\u{1F34D}', label: 'Pineapple', description: '~47 cm long' };
  return { emoji: '\u{1F349}', label: 'Watermelon', description: '~50 cm long' };
};

const calculatePregnancyProgress = (startDate: string | undefined, now: Date) => {
  const conceptionDate = startDate ? new Date(startDate) : now;
  const elapsedDays = Math.max(0, Math.floor((now.getTime() - conceptionDate.getTime()) / DAY_MS));
  const week = Math.min(40, Math.max(1, Math.floor(elapsedDays / 7) + 1));
  const day = (elapsedDays % 7) + 1;
  const dueDate = new Date(conceptionDate.getTime() + 280 * DAY_MS);
  const progressPercent = Math.min((elapsedDays / 280) * 100, 100);
  const daysUntilDue = Math.max(0, Math.ceil((dueDate.getTime() - now.getTime()) / DAY_MS));

  const remainingMs = Math.max(0, dueDate.getTime() - now.getTime());
  const hours = Math.floor((remainingMs % DAY_MS) / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);

  return {
    week,
    day,
    dueDate,
    progressPercent,
    daysUntilDue,
    countdown: { hours, minutes, seconds },
  };
};

const pad2 = (n: number) => n.toString().padStart(2, '0');

export function PatientDashboard() {
  const { user } = useAuth();
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [patientLoading, setPatientLoading] = useState(false);
  const [patientError, setPatientError] = useState('');

  const [city, setCity] = useState(() => localStorage.getItem('vnx_city') || 'Chennai');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [summary, setSummary] = useState<WeatherSummary | null>(null);
  const [resources, setResources] = useState<ResourceLink[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [secondsToNext, setSecondsToNext] = useState(0);
  const [lastManualRefreshAt, setLastManualRefreshAt] = useState<number | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [babyDevelopmentText, setBabyDevelopmentText] = useState(
    'Your baby continues to grow and develop every day.'
  );
  const [babyHighlights, setBabyHighlights] = useState<string[]>([
    'Baby continues steady growth this week',
    'Sleep and wake cycles become more defined',
    'Continue hydration, rest, and regular checkups',
  ]);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const refreshIntervalMs = 10 * 60 * 1000;
  const cities = [
    'Chennai',
    'Bengaluru',
    'Mumbai',
    'Delhi',
    'Kolkata',
    'Hyderabad',
    'Pune',
    'Ahmedabad',
    'Jaipur',
    'Lucknow',
    'Kochi',
    'Coimbatore',
  ];

  const reminders = [
    { icon: Pill, text: 'Take prenatal vitamins', time: 'Daily' },
    { icon: Calendar, text: 'Next ultrasound appointment', time: 'As scheduled' },
    { icon: Footprints, text: '30 min walk completed', time: 'Today' },
    { icon: Droplets, text: 'Stay hydrated - 8 glasses', time: 'Daily goal' },
  ];

  const profile = (patient ?? (user as unknown as PatientProfile) ?? {}) as PatientProfile;
  const pregnancy = useMemo(
    () => calculatePregnancyProgress(profile.pregnancyStartDate, now),
    [profile.pregnancyStartDate, now]
  );
  const babySize = getBabySizeVisual(pregnancy.week);

  const filteredNotifications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const positiveOnly = notifications.filter((n) => n.severity === 'info');
    if (!q) return positiveOnly;
    return positiveOnly.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.city.toLowerCase().includes(q)
    );
  }, [notifications, searchQuery]);

  const loadNotifications = async (nextCity: string) => {
    if (!user?.id) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await refreshNotifications(user.id, nextCity);
      const onlyCity = data.notifications.filter(
        (n) => n.city?.toLowerCase() === data.city.toLowerCase()
      );
      setNotifications(onlyCity);
      setSummary(data.summary);
      setLastUpdatedAt(Date.now());
    } catch (err) {
      console.error('Notification refresh error:', err);
      setErrorMessage('Unable to fetch weather updates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications(city);
    const id = setInterval(() => loadNotifications(city), refreshIntervalMs);
    return () => clearInterval(id);
  }, [city, user?.id]);

  useEffect(() => {
    fetchResources()
      .then(setResources)
      .catch((err) => console.error('Resources error:', err));
  }, []);

  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (!lastUpdatedAt) return setSecondsToNext(0);
      const elapsed = Date.now() - lastUpdatedAt;
      const remaining = Math.max(refreshIntervalMs - elapsed, 0);
      setSecondsToNext(Math.ceil(remaining / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [lastUpdatedAt]);

  useEffect(() => {
    const loadPatient = async () => {
      if (!user?.id || user.role !== 'patient') return;
      setPatientLoading(true);
      setPatientError('');
      try {
        let data: any = null;

        const byIdRes = await fetch(`${API_BASE}/api/auth/patient/${user.id}`);
        if (byIdRes.ok) {
          data = await byIdRes.json();
        } else if (user.email) {
          const byEmailRes = await fetch(
            `${API_BASE}/api/auth/patient/by-email/${encodeURIComponent(user.email)}`
          );
          if (byEmailRes.ok) {
            data = await byEmailRes.json();
          }
        }

        if (data?.success && data?.patient) {
          setPatient(data.patient);
        } else {
          setPatient(user as unknown as PatientProfile);
          setPatientError('Using basic profile data. Restart backend for full sync.');
        }
      } catch (err) {
        console.error('Patient fetch error:', err);
        setPatient(user as unknown as PatientProfile);
        setPatientError('Using basic profile data. Restart backend for full sync.');
      } finally {
        setPatientLoading(false);
      }
    };

    loadPatient();
  }, [user?.id, user?.role, user?.email]);

  useEffect(() => {
    const loadBabyDevelopment = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/pregnancy/development/${pregnancy.week}`);
        const data = await res.json();
        if (res.ok && data?.success) {
          if (data.summary) setBabyDevelopmentText(data.summary);
          if (Array.isArray(data.highlights) && data.highlights.length > 0) {
            setBabyHighlights(data.highlights);
          }
        }
      } catch (error) {
        console.error('Baby development fetch error:', error);
      }
    };

    loadBabyDevelopment();
  }, [pregnancy.week]);

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${pad2(m)}:${pad2(s)}`;
  };

  const latest = notifications[0];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            Hello, {(profile?.name || user?.name || 'Mom').split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">Here&apos;s your pregnancy journey at a glance</p>
          {patientLoading && <p className="text-xs text-muted-foreground">Loading your profile...</p>}
          {patientError && <p className="text-xs text-muted-foreground">{patientError}</p>}
        </div>
        <div className="rounded-xl border bg-background px-4 py-2 text-right">
          <p className="text-xs text-muted-foreground">
            {now.toLocaleDateString('en-IN', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {now.toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
          <p className="text-xs text-muted-foreground">
            {summary ? `${city} - ${summary.temp} C` : `${city} - --`}
          </p>
        </div>
      </div>

      <Card className="border-none bg-gradient-to-r from-accent/40 via-background to-primary/10">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Real-time Update - {city}</p>
                <p className="text-xs text-muted-foreground">
                  {summary
                    ? `${summary.condition} - ${summary.temp}C - Humidity ${summary.humidity}%`
                    : 'Fetching weather updates...'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {lastUpdatedAt
                    ? `Last updated ${Math.floor((Date.now() - lastUpdatedAt) / 60000)} min ago - Next in ${formatSeconds(secondsToNext)}`
                    : 'Waiting for first update...'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={city}
                onChange={(e) => {
                  const v = e.target.value;
                  setCity(v);
                  localStorage.setItem('vnx_city', v);
                }}
              >
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <button
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                onClick={() => notificationsRef.current?.scrollIntoView({ behavior: 'smooth' })}
              >
                View notifications
              </button>
              <button
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                onClick={() => {
                  const nowTs = Date.now();
                  if (lastManualRefreshAt && nowTs - lastManualRefreshAt < 60_000) return;
                  setLastManualRefreshAt(nowTs);
                  loadNotifications(city);
                }}
              >
                Refresh now
              </button>
            </div>
          </div>
          {latest && latest.severity === 'info' && (
            <div className="mt-3 rounded-xl border bg-background/70 px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-medium text-foreground">{latest.title}</span>
                  <span className="text-muted-foreground"> - {latest.message}</span>
                </div>
                {latest.url && (
                  <a
                    className="shrink-0 rounded-lg border border-border bg-background px-3 py-1 text-xs text-primary"
                    href={latest.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open
                  </a>
                )}
              </div>
            </div>
          )}
          {resources.length > 0 && (
            <div className="mt-3 grid gap-2">
              <p className="text-xs text-muted-foreground">Important links</p>
              <div className="flex flex-wrap gap-2">
                {resources.slice(0, 3).map((r) => (
                  <a
                    key={r.url}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border bg-background px-3 py-1 text-xs text-foreground hover:border-primary/40"
                    title={
                      r.updatedAt ? `Updated: ${new Date(r.updatedAt).toLocaleString()}` : 'Latest update'
                    }
                  >
                    {r.title}
                  </a>
                ))}
              </div>
            </div>
          )}
          {errorMessage && <p className="mt-2 text-xs text-red-500">{errorMessage}</p>}
          {isLoading && <p className="mt-2 text-xs text-muted-foreground">Refreshing updates...</p>}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-none bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 animate-fade-in">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
                  <Baby className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Progress</p>
                  <p className="text-3xl font-bold text-foreground">
                    Week {pregnancy.week}, Day {pregnancy.day}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pregnancy Progress</span>
                  <span className="font-medium text-primary">{Math.round(pregnancy.progressPercent)}%</span>
                </div>
                <Progress value={pregnancy.progressPercent} className="h-3 rounded-full" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Conception</span>
                  <span>
                    Due:{' '}
                    {pregnancy.dueDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center md:w-56">
              <div className="text-center p-6 rounded-2xl bg-background/60">
                <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-5xl">
                  {babySize.emoji}
                </div>
                <p className="text-3xl mb-1">{babySize.label}</p>
                <p className="text-sm font-medium text-foreground">Baby size this week</p>
                <p className="text-xs text-muted-foreground">{babySize.description}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Days Until Due"
          value={pregnancy.daysUntilDue}
          subtitle={`${pad2(pregnancy.countdown.hours)}h ${pad2(pregnancy.countdown.minutes)}m ${pad2(pregnancy.countdown.seconds)}s`}
          icon={<Calendar className="h-6 w-6" />}
          variant="primary"
        />
        <StatCard
          title="Week Milestone"
          value={getMilestoneByWeek(pregnancy.week)}
          subtitle={`Week ${pregnancy.week} of 40`}
          icon={<Heart className="h-6 w-6" />}
          variant="default"
        />
        <StatCard
          title="Health Score"
          value="Excellent"
          subtitle="Based on your logs"
          icon={<Sparkles className="h-6 w-6" />}
          variant="primary"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Baby className="h-5 w-5 text-primary" />
              Baby Development
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{babyDevelopmentText}</p>
            <div className="rounded-xl bg-accent/50 p-4">
              <p className="text-sm font-medium text-foreground mb-2">This Week&apos;s Highlights:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {babyHighlights.map((item, idx) => (
                  <li key={idx}>- {item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-primary" />
              Health Reminders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reminders.map((reminder, index) => {
                const Icon = reminder.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-xl border bg-background p-3 transition-colors hover:bg-accent/30"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{reminder.text}</p>
                      <p className="text-xs text-muted-foreground">{reminder.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div ref={notificationsRef}>
        <Card className="animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search updates..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <div className="mt-4 space-y-3 max-h-72 overflow-auto pr-1">
              {filteredNotifications.length === 0 && (
                <div className="text-sm text-muted-foreground">No updates yet.</div>
              )}
              {filteredNotifications.map((n) => (
                <div key={n._id} className="rounded-xl border bg-background p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <span
                      className={`text-xs ${
                        n.severity === 'danger'
                          ? 'text-red-500'
                          : n.severity === 'warning'
                          ? 'text-orange-500'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {n.city}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                  {n.url && (
                    <a
                      className="mt-2 inline-block text-xs text-primary underline"
                      href={n.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Read official update
                    </a>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div
        className="rounded-2xl bg-gradient-to-r from-primary/10 to-accent/20 p-6 text-center animate-fade-in"
        style={{ animationDelay: '300ms' }}
      >
        <p className="text-lg font-medium text-foreground mb-1">You&apos;re doing great, mom!</p>
        <p className="text-sm text-muted-foreground">
          Every step of this journey matters. Your baby is growing healthy and strong.
        </p>
      </div>
    </div>
  );
}
