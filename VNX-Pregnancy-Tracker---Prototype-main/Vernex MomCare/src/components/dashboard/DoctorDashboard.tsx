import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  Calendar,
  Plus,
  Search,
  Filter,
  Bell,
} from 'lucide-react';

import { StatCard } from '@/components/ui/stat-card';
import { PatientCard } from '@/components/ui/patient-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PatientRegistrationDialog } from './PatientRegistrationDialog';
import { PatientDetailDialog } from './PatientDetailDialog';
import { Patient } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from "@/config/api";
import {
  fetchResources,
  refreshNotifications,
  NotificationItem,
  ResourceLink,
  WeatherSummary,
} from '@/lib/notifications';

export function DoctorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth(); // 👈 logged in doctor
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [notificationSearchQuery, setNotificationSearchQuery] = useState('');
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState(() => localStorage.getItem('vnx_city') || 'Chennai');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [summary, setSummary] = useState<WeatherSummary | null>(null);
  const [resources, setResources] = useState<ResourceLink[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [secondsToNext, setSecondsToNext] = useState(0);
  const [lastManualRefreshAt, setLastManualRefreshAt] = useState<number | null>(null);
  const [now, setNow] = useState<Date>(new Date());
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

  /* ================= FETCH PATIENTS ================= */
  const fetchPatients = async () => {
    try {
      if (!user?.id) return; // 🔒 safety

      setLoading(true);

      const res = await fetch(
        `${API_BASE}/api/auth/doctor/patients/${user.id}`
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load patients');
      }

      // 🔥 IMPORTANT FIX: ensure _id → id mapping
      const formattedPatients: Patient[] = data.patients.map((p: any) => ({
        id: p._id,
        name: p.name,
        email: p.email,
        age: p.age,
        gestationalWeek: p.gestationalWeek,
        riskStatus: p.riskStatus,
        medicalNotes: p.medicalNotes,
        pregnancyStartDate: p.pregnancyStartDate,
        contactPhone: p.phone,
        doctorId: p.doctorId,
        createdAt: p.createdAt,
      }));

      setPatients(formattedPatients);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'Failed to load patients',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchPatients();
    }
  }, [user]);

  const loadNotifications = async (nextCity: string) => {
    if (!user?.id) return;
    setWeatherLoading(true);
    setWeatherError('');
    try {
      const data = await refreshNotifications(user.id, nextCity);
      const onlyCity = data.notifications.filter(
        (n) => n.city?.toLowerCase() === data.city.toLowerCase()
      );
      setNotifications(onlyCity);
      setSummary(data.summary);
      setLastUpdatedAt(Date.now());
    } catch (err) {
      console.error('Weather refresh error:', err);
      setWeatherError('Unable to fetch weather updates. Please try again.');
    } finally {
      setWeatherLoading(false);
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

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const filteredNotifications = useMemo(() => {
    const q = notificationSearchQuery.trim().toLowerCase();
    const positiveOnly = notifications.filter((n) => n.severity === 'info');
    if (!q) return positiveOnly;
    return positiveOnly.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.message.toLowerCase().includes(q) ||
        n.city.toLowerCase().includes(q)
    );
  }, [notifications, notificationSearchQuery]);

  const latest = notifications[0];

  const totalPatients = patients.length;
  const highRiskPatients = patients.filter(
    (p) => p.riskStatus === 'high-risk'
  ).length;
  const upcomingFollowups = patients.filter(
    (p) => p.riskStatus !== 'normal'
  ).length;

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePatientRegistered = (newPatient: Patient) => {
    setPatients((prev) => [...prev, newPatient]);
  };

  return (
    <div className="space-y-8">

      {/* ================= HEADER ================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Doctor Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage your patients and monitor their pregnancy journey
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
              {summary ? `${city} · ${summary.temp} C` : `${city} · --`}
            </p>
          </div>

          <Button
            onClick={() => setIsRegistrationOpen(true)}
            className="gap-2 rounded-xl"
          >
            <Plus className="h-4 w-4" />
            Register New Patient
          </Button>
        </div>
      </div>

      {/* ================= REAL-TIME WEATHER ================= */}
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
                    ? `Last updated ${Math.floor(
                        (Date.now() - lastUpdatedAt) / 60000
                      )} min ago · Next in ${formatSeconds(secondsToNext)}`
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
                    title={r.updatedAt ? `Updated: ${new Date(r.updatedAt).toLocaleString()}` : 'Latest update'}
                  >
                    {r.title}
                  </a>
                ))}
              </div>
            </div>
          )}
          {weatherError && (
            <p className="mt-2 text-xs text-red-500">{weatherError}</p>
          )}
          {weatherLoading && (
            <p className="mt-2 text-xs text-muted-foreground">Refreshing updates...</p>
          )}
        </CardContent>
      </Card>

      {/* ================= STATS ================= */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        <div
          className="cursor-pointer transition hover:shadow-md"
          onClick={() => navigate('/patients')}
        >
          <StatCard
            title="Total Patients"
            value={totalPatients}
            subtitle="Active in system"
            icon={<Users className="h-6 w-6" />}
            variant="primary"
          />
        </div>

        <div
          className="cursor-pointer transition hover:shadow-md"
          onClick={() => navigate('/patients?filter=high-risk')}
        >
          <StatCard
            title="High-Risk Patients"
            value={highRiskPatients}
            subtitle="Require close monitoring"
            icon={<AlertTriangle className="h-6 w-6" />}
            variant="danger"
          />
        </div>

        <div
          className="cursor-pointer transition hover:shadow-md"
          onClick={() => navigate('/doctor/appointments')}
        >
          <StatCard
            title="Upcoming Follow-ups"
            value={upcomingFollowups}
            subtitle="This week"
            icon={<Calendar className="h-6 w-6" />}
            variant="warning"
          />
        </div>
      </div>

      {/* ================= PATIENT MANAGEMENT ================= */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Your Patients</h2>

          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              className="rounded-xl"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Patient Grid */}
        {loading ? (
          <p className="text-muted-foreground">Loading patients...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPatients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onClick={() => setSelectedPatient(patient)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredPatients.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12">
            <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground text-center">
              {searchQuery
                ? 'No patients found matching your search'
                : 'No patients registered yet'}
            </p>
            {!searchQuery && (
              <Button
                variant="link"
                className="mt-2"
                onClick={() => setIsRegistrationOpen(true)}
              >
                Register your first patient
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ================= NOTIFICATIONS ================= */}
      <div ref={notificationsRef}>
        <Card className="animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={notificationSearchQuery}
                onChange={(e) => setNotificationSearchQuery(e.target.value)}
                placeholder="Search updates..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <div className="mt-4 space-y-3 max-h-72 overflow-auto pr-1">
              {filteredNotifications.length === 0 && (
                <div className="text-sm text-muted-foreground">No updates yet.</div>
              )}
              {filteredNotifications.map((n) => (
                <div
                  key={n._id}
                  className="rounded-xl border bg-background p-3"
                >
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

      {/* ================= DIALOGS ================= */}
      <PatientRegistrationDialog
        open={isRegistrationOpen}
        onOpenChange={setIsRegistrationOpen}
        onPatientRegistered={handlePatientRegistered}
      />

      {selectedPatient && (
        <PatientDetailDialog
          patient={selectedPatient}
          open={!!selectedPatient}
          onOpenChange={(open) => !open && setSelectedPatient(null)}
        />
      )}
    </div>
  );
}
