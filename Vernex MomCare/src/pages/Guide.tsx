import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/config/api';
import {
  Apple,
  Dumbbell,
  Heart,
  History,
  CheckCircle,
  XCircle,
  Pill,
  Droplets,
  Footprints,
  Moon,
  Calendar,
  Coffee,
  Pencil,
  Trash2,
  ExternalLink,
  Plus,
  MoreVertical,
} from 'lucide-react';
import type { GuideItem } from '@/types';

const categoryConfig = {
  diet: { label: 'Diet', icon: Apple, color: 'text-success' },
  exercise: { label: 'Exercise', icon: Dumbbell, color: 'text-info' },
  wellness: { label: 'Wellness', icon: Heart, color: 'text-primary' },
  dos: { label: "Do's", icon: CheckCircle, color: 'text-success' },
  donts: { label: "Don'ts", icon: XCircle, color: 'text-destructive' },
};

const iconMap: Record<string, React.ElementType> = {
  pill: Pill,
  droplet: Droplets,
  footprints: Footprints,
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  coffee: Coffee,
  moon: Moon,
  'calendar-check': Calendar,
};

const fallbackTips = [
  {
    label: 'ANC',
    title: 'Keep antenatal checkups',
    desc: 'Attend scheduled contacts for monitoring and counseling.',
    source: 'WHO',
    referenceLink:
      'https://wkc.who.int/resources/publications/i/item/9789241549912',
  },
  {
    label: 'IFA',
    title: 'Take iron-folic acid',
    desc: 'Follow daily supplementation advice from your provider.',
    source: 'WHO',
    referenceLink: 'https://www.who.int/tools/elena/interventions/iron-folic-acid-pregnancy',
  },
  {
    label: 'ALCOHOL',
    title: 'Avoid alcohol',
    desc: 'Alcohol use in pregnancy can cause serious harm to the baby.',
    source: 'WHO',
    referenceLink: 'https://www.who.int/news-room/fact-sheets/detail/alcohol',
  },
  {
    label: 'DANGER',
    title: 'Know danger signs',
    desc: 'Seek urgent care for bleeding, severe headache, fever, or severe pain.',
    source: 'MOHFW',
    referenceLink:
      'https://nhm.gov.in/images/pdf/programmes/maternal-health/guidelines/my_safe_motherhood_booklet_english.pdf',
  },
];

type WeeklyTip = {
  label: string;
  title: string;
  desc: string;
  source?: string;
  referenceLink?: string;
};

type GuideFormState = {
  title: string;
  content: string;
  category: GuideItem['category'];
  icon: string;
  weekStart: number;
  weekEnd: number;
  trimester: NonNullable<GuideItem['trimester']>;
  source: NonNullable<GuideItem['source']>;
  referenceLink: string;
  note: string;
};

type ApprovalHistory = {
  _id: string;
  requestType: 'patient_create' | 'guide_create' | 'guide_update' | 'guide_delete' | string;
  status: 'pending' | 'approved' | 'rejected' | string;
  requestNote?: string;
  adminNote?: string;
  decisionAt?: string;
  createdAt?: string;
  payload?: any;
};

const approvalTypeLabel: Record<string, string> = {
  patient_create: 'Patient Create',
  guide_create: 'Guide Create',
  guide_update: 'Guide Edit',
  guide_delete: 'Guide Delete',
};

const normalizeGuideItems = (payload: unknown): GuideItem[] => {
  if (!Array.isArray(payload)) return [];

  return payload
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item, index) => ({
      _id: typeof item._id === 'string' ? item._id : undefined,
      id: typeof item.id === 'string' ? item.id : undefined,
      title: typeof item.title === 'string' ? item.title : `Guide ${index + 1}`,
      category:
        item.category === 'diet' ||
        item.category === 'exercise' ||
        item.category === 'wellness' ||
        item.category === 'dos' ||
        item.category === 'donts'
          ? item.category
          : 'wellness',
      content: typeof item.content === 'string' ? item.content : '',
      icon: typeof item.icon === 'string' ? item.icon : undefined,
      source: item.source === 'WHO' || item.source === 'MOHFW' ? item.source : undefined,
      referenceLink: typeof item.referenceLink === 'string' ? item.referenceLink : undefined,
      weekStart: typeof item.weekStart === 'number' ? item.weekStart : undefined,
      weekEnd: typeof item.weekEnd === 'number' ? item.weekEnd : undefined,
      trimester:
        item.trimester === 'first' ||
        item.trimester === 'second' ||
        item.trimester === 'third' ||
        item.trimester === 'all'
          ? item.trimester
          : undefined,
    }));
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function Guide() {

  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const [activeTab, setActiveTab] = useState('all');
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [guidesLoading, setGuidesLoading] = useState(false);
  const [guidesError, setGuidesError] = useState('');
  const [currentWeek, setCurrentWeek] = useState<number | null>(null);
  const [weeklyTips, setWeeklyTips] = useState<WeeklyTip[]>([]);
  const [doctorWeek, setDoctorWeek] = useState(22);

  const [editOpen, setEditOpen] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'guide_create' | 'guide_update' | 'guide_delete'>('all');
  const [historySort, setHistorySort] = useState<'newest' | 'oldest'>('newest');
  const [form, setForm] = useState<GuideFormState>({
    title: '',
    content: '',
    category: 'diet',
    icon: '',
    weekStart: 1,
    weekEnd: 40,
    trimester: 'all',
    source: 'WHO',
    referenceLink: '',
    note: '',
  });

  const effectiveWeek = isDoctor ? doctorWeek : currentWeek;

  // Fetch pregnancy week
  useEffect(() => {

    const run = async () => {
      try {
        if (isDoctor) return;
        if (!user?.id && user?.gestationalWeek) {
          setCurrentWeek(user.gestationalWeek);
          return;
        }

        const qs = user?.id
          ? `?patientId=${encodeURIComponent(String(user.id))}`
          : user?.email
            ? `?email=${encodeURIComponent(String(user.email))}`
            : '';

        const res = await fetch(`${API_BASE}/api/pregnancy${qs}`);
        const data = await res.json();

        if (res.ok && data?.success && typeof data?.gestationalWeek === 'number') {
          setCurrentWeek(data.gestationalWeek);
        } else if (typeof user?.gestationalWeek === 'number') {
          setCurrentWeek(user.gestationalWeek);
        } else {
          setCurrentWeek(1);
        }
      } catch (err) {
        console.error(err);
        if (typeof user?.gestationalWeek === 'number') setCurrentWeek(user.gestationalWeek);
        else setCurrentWeek(1);
      }
    };

    run();

  }, [isDoctor, user?.id, user?.email, user?.gestationalWeek]);

  useEffect(() => {
    if (!isDoctor) return;
    setCurrentWeek(doctorWeek);
  }, [isDoctor, doctorWeek]);

  // Fetch guides for that week
  useEffect(() => {

    if (!effectiveWeek) return;

    const loadGuides = async () => {
      setGuidesLoading(true);
      setGuidesError('');
      try {
        const res = await fetchGuideApi(`/week/${effectiveWeek}`);
        if (!res.ok) {
          throw new Error(await readApiError(res));
        }
        const data = await res.json();
        setGuides(normalizeGuideItems(data));
      } catch (err: unknown) {
        console.error(err);
        setGuides([]);
        setGuidesError(getErrorMessage(err, 'Failed to load guides from backend'));
      } finally {
        setGuidesLoading(false);
      }
    };

    loadGuides();

  }, [effectiveWeek]);

  // Fetch weekly tips (4 key points) for that week
  useEffect(() => {
    if (!effectiveWeek) return;

    fetch(`${API_BASE}/api/pregnancy/tips/${effectiveWeek}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data?.tips)) {
          setWeeklyTips(data.tips.slice(0, 4));
        } else {
          setWeeklyTips([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setWeeklyTips([]);
      });
  }, [effectiveWeek]);

  const refreshGuides = async (week: number) => {
    const res = await fetchGuideApi(`/week/${week}`);
    if (!res.ok) {
      throw new Error(await readApiError(res));
    }
    const data = await res.json();
    setGuides(normalizeGuideItems(data));
    setGuidesError('');
  };

  const fetchDoctorApprovalHistory = async (doctorId: string) => {
    const compat = await fetch(`${API_BASE}/api/auth/doctor/${doctorId}/approval-history`);
    const compatData = await compat.json().catch(() => null);
    if (compat.ok && compatData?.success) {
      return compatData.requests || [];
    }

    const primary = await fetch(`${API_BASE}/api/approvals/doctor/${doctorId}`);
    const primaryData = await primary.json().catch(() => null);
    if (primary.ok && primaryData?.success) {
      return primaryData.requests || [];
    }

    const fallback = await fetch(`${API_BASE}/api/auth/approvals/doctor/${doctorId}`);
    const fallbackData = await fallback.json().catch(() => null);
    if (fallback.ok && fallbackData?.success) {
      return fallbackData.requests || [];
    }

    throw new Error(
      parseErrorMessage(
        fallbackData || primaryData || compatData,
        `Failed to fetch approval history (${fallback.status || primary.status || compat.status})`
      )
    );
  };

  const openApprovalHistory = async () => {
    if (!user?.id) return;
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const requests = await fetchDoctorApprovalHistory(user.id);
      setApprovalHistory(Array.isArray(requests) ? requests : []);
    } catch (err: unknown) {
      console.error(err);
      alert(getErrorMessage(err, 'Failed to load approval history'));
    } finally {
      setHistoryLoading(false);
    }
  };

  const openCreate = () => {
    const week = effectiveWeek || 1;
    setEditId(null);
    setForm({
      title: '',
      content: '',
      category: 'diet',
      icon: '',
      weekStart: week,
      weekEnd: week,
      trimester: week <= 13 ? 'first' : week <= 27 ? 'second' : 'third',
      source: 'WHO',
      referenceLink: '',
      note: '',
    });
    setEditOpen(true);
  };

  const openEdit = (item: GuideItem) => {
    const id = typeof item?._id === 'string' ? item._id : null;
    setEditId(id && !id.startsWith('seed-') ? id : null);
    setForm({
      title: item?.title || '',
      content: item?.content || '',
      category: item?.category || 'diet',
      icon: item?.icon || '',
      weekStart: Number(item?.weekStart) || (effectiveWeek || 1),
      weekEnd: Number(item?.weekEnd) || (effectiveWeek || 1),
      trimester: item?.trimester || 'all',
      source: item?.source || 'WHO',
      referenceLink: item?.referenceLink || '',
      note: '',
    });
    setEditOpen(true);
  };

  const saveGuide = async () => {
    if (!isDoctor) return;
    const week = effectiveWeek || 1;
    setEditBusy(true);
    try {
      if (!user?.id) {
        throw new Error('Doctor session missing. Please login again.');
      }
      if (!String(form.note || '').trim()) {
        throw new Error(
          editId
            ? 'Please add a note for admin review before requesting an edit'
            : 'Please add a note for admin review before requesting a new guide'
        );
      }

      const payload = {
        ...form,
        weekStart: Number(form.weekStart),
        weekEnd: Number(form.weekEnd),
      };

      const method = editId ? 'PUT' : 'POST';

      const res = await fetchGuideApi(editId ? `/${editId}` : '', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          {
            ...payload,
            doctorId: user?.id,
            note: String(form.note || '').trim(),
          }
        ),
      });

      if (!res.ok) {
        throw new Error(await readApiError(res));
      }

      alert(editId ? 'Edit request sent to admin for approval.' : 'New guide request sent to admin for approval.');
      setEditOpen(false);
      await refreshGuides(week);
    } catch (err: unknown) {
      console.error(err);
      alert(getErrorMessage(err, 'Failed to save guide'));
    } finally {
      setEditBusy(false);
    }
  };

  const deleteGuide = async (id: string) => {
    if (!isDoctor) return;
    if (!user?.id) {
      alert('Doctor session missing. Please login again.');
      return;
    }
    if (!id || id.startsWith('seed-')) {
      alert('This is a built-in guide. Create your own guide to edit/delete.');
      return;
    }
    const ok = confirm('Send delete request to admin?');
    if (!ok) return;
    const note = window.prompt('Add a note for admin review (required):', '');
    if (!note || !note.trim()) {
      alert('A note is required to request guide deletion.');
      return;
    }

    const week = effectiveWeek || 1;
    try {
      const res = await fetchGuideApi(`/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: user?.id,
          note: note.trim(),
        }),
      });
      if (!res.ok) throw new Error(await readApiError(res));
      alert('Delete request sent to admin for approval.');
      await refreshGuides(week);
    } catch (err: unknown) {
      console.error(err);
      alert(getErrorMessage(err, 'Failed to send delete request'));
    }
  };

  const filteredItems =
    activeTab === 'all'
      ? guides
      : guides.filter((item) => item.category === activeTab);

  const filteredApprovalHistory = approvalHistory
    .filter((item) => historyFilter === 'all' || item.status === historyFilter)
    .filter((item) => historyTypeFilter === 'all' || item.requestType === historyTypeFilter)
    .sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return historySort === 'newest' ? bTime - aTime : aTime - bTime;
    });

  const readApiError = async (res: Response) => {
    try {
      const data = await res.json();
      return data?.message || data?.error || `Request failed (${res.status})`;
    } catch {
      try {
        const text = await res.text();
        return text || `Request failed (${res.status})`;
      } catch {
        return `Request failed (${res.status})`;
      }
    }
  };

  const fetchGuideApi = async (path: string, init?: RequestInit) => {
    const primary = await fetch(`${API_BASE}/api/guides${path}`, init);
    if (primary.status !== 404) return primary;

    // Backward-compatible fallback for environments still mounting guides under /api/auth.
    return fetch(`${API_BASE}/api/auth/guides${path}`, init);
  };

  const iconKeys = Object.keys(iconMap);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-accent/40">
          <div className="p-5 sm:p-6">
            <h1 className="text-2xl font-bold text-foreground">Pregnancy Guide</h1>
            <p className="text-muted-foreground">
              Essential tips and guidelines for a healthy pregnancy
            </p>
          </div>
        </div>

        {isDoctor && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-muted-foreground">Week</span>
              <Input
                type="number"
                min={1}
                max={40}
                value={doctorWeek}
                onChange={(e) => {
                  const next = Math.max(1, Math.min(40, Number(e.target.value || 1)));
                  setDoctorWeek(Number.isFinite(next) ? next : 1);
                }}
                className="w-24"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={openApprovalHistory} className="gap-2">
                <History className="h-4 w-4" />
                Approval History
              </Button>
              <Button onClick={openCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                New Guide
              </Button>
            </div>
          </div>
        )}

        {/* Weekly Tips */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6">

            <h2 className="text-lg font-semibold mb-4">
              {effectiveWeek ? `Week ${effectiveWeek} Tips` : "Loading tips..."}
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {(weeklyTips.length ? weeklyTips : fallbackTips).map((tip, index) => {
                const body = (
                  <div
                    className="rounded-xl bg-background/80 p-4 text-center animate-fade-in hover:shadow-sm transition-shadow"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <span className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">
                      {tip.label}
                    </span>
                    <p className="font-medium text-sm">{tip.title}</p>
                    <p className="text-xs text-muted-foreground">{tip.desc}</p>
                    {tip.source && (
                      <span className="inline-block text-[11px] font-semibold mt-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {String(tip.source).toUpperCase()}
                      </span>
                    )}
                    {/* Card is clickable when a referenceLink is present */}
                  </div>
                );

                return tip.referenceLink ? (
                  <a
                    key={index}
                    href={tip.referenceLink}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="block rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {body}
                  </a>
                ) : (
                  <div key={index}>{body}</div>
                );
              })}

            </div>
          </div>
        </Card>

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent p-0">

            <TabsTrigger
              value="all"
              className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              All
            </TabsTrigger>

            {Object.entries(categoryConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                  {config.label}
                </TabsTrigger>
              );
            })}

          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {guidesError && (
              <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {guidesError}
              </div>
            )}

            {guidesLoading && (
              <div className="mb-4 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                Loading guides from backend...
              </div>
            )}

            {!guidesLoading && !guidesError && filteredItems.length === 0 && (
              <div className="mb-4 rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                No guides were returned from the backend for week {effectiveWeek}.
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

               {filteredItems.map((item, index) => {
 
                 const category = categoryConfig[item.category];
                 // Prefer explicit icon from backend, otherwise fall back to category icon.
                 const Icon = iconMap[item.icon] || category?.icon || Heart;
 
                const card = (
                  <Card
                    className="group h-full hover:shadow-lg transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
 
                    <CardContent className="p-5 h-full">
                      <div className="flex items-start gap-4">
  
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/50 ${category?.color} group-hover:scale-110 transition-transform`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>

                        <div className="space-y-1">

                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-foreground">
                              {item.title}
                            </h3>
                            {isDoctor && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Actions"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    disabled={!item.referenceLink}
                                    onClick={() => {
                                      if (!item.referenceLink) return;
                                      window.open(item.referenceLink, '_blank', 'noopener,noreferrer');
                                    }}
                                  >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Open source
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openEdit(item)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => deleteGuide(String(item._id || ''))}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                                item.category === 'dos'
                                  ? 'bg-success/10 text-success'
                                  : item.category === 'donts'
                                  ? 'bg-destructive/10 text-destructive'
                                  : 'bg-accent text-accent-foreground'
                              }`}
                            >
                              {category?.label}
                            </span>

                            {item.source && (
                              <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {String(item.source).toUpperCase()}
                              </span>
                            )}
                          </div>

                           <p className="text-sm text-muted-foreground mt-2">
                             {item.content}
                           </p>

                           {/* Card is clickable when a referenceLink is present */}
 
                         </div>
                       </div>
                     </CardContent>
 
                  </Card>
                );

                if (isDoctor) {
                  return (
                    <div key={item._id || index} className="h-full">
                      {card}
                    </div>
                  );
                }

                return item.referenceLink ? (
                  <a
                    key={item._id || index}
                    href={item.referenceLink}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="block h-full rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {card}
                  </a>
                ) : (
                  <div key={item._id || index} className="h-full">
                    {card}
                  </div>
                );
              })}
 
            </div>
           </TabsContent>
         </Tabs>

        <Dialog open={editOpen} onOpenChange={(nextOpen) => !editBusy && setEditOpen(nextOpen)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editId ? 'Edit Guide' : 'Create Guide'}</DialogTitle>
              <DialogDescription>
                Only WHO / MOHFW official references are allowed.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Title</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Category</label>
                  <select
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="diet">Diet</option>
                    <option value="exercise">Exercise</option>
                    <option value="wellness">Wellness</option>
                    <option value="dos">Do's</option>
                    <option value="donts">Don'ts</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Source</label>
                  <select
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                  >
                    <option value="WHO">WHO</option>
                    <option value="MOHFW">MOHFW</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Week start</label>
                  <Input
                    type="number"
                    min={1}
                    max={40}
                    value={form.weekStart}
                    onChange={(e) => setForm({ ...form, weekStart: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Week end</label>
                  <Input
                    type="number"
                    min={1}
                    max={40}
                    value={form.weekEnd}
                    onChange={(e) => setForm({ ...form, weekEnd: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Trimester</label>
                  <select
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                    value={form.trimester}
                    onChange={(e) => setForm({ ...form, trimester: e.target.value })}
                  >
                    <option value="first">First</option>
                    <option value="second">Second</option>
                    <option value="third">Third</option>
                    <option value="all">All</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Icon key (optional)</label>
                  <select
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                    value={form.icon || ''}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  >
                    <option value="">Auto (by category)</option>
                    {iconKeys.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Reference link</label>
                <Input
                  value={form.referenceLink}
                  onChange={(e) => setForm({ ...form, referenceLink: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Note for admin (required)</label>
                <Textarea
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  rows={3}
                  placeholder={
                    editId
                      ? 'Explain what changed and why'
                      : 'Explain why this new guide should be added'
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={editBusy}>
                Cancel
              </Button>
              <Button onClick={saveGuide} disabled={editBusy || !form.title || !form.content}>
                {editBusy ? 'Saving...' : editId ? 'Send Edit Request' : 'Send Create Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Approval History</DialogTitle>
              <DialogDescription>
                Review requests submitted by this doctor with filters by status and type.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value as typeof historyFilter)}
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Type</label>
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={historyTypeFilter}
                  onChange={(e) => setHistoryTypeFilter(e.target.value as typeof historyTypeFilter)}
                >
                  <option value="all">All types</option>
                  <option value="guide_create">Guide Create</option>
                  <option value="guide_update">Guide Edit</option>
                  <option value="guide_delete">Guide Delete</option>
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Sort</label>
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={historySort}
                  onChange={(e) => setHistorySort(e.target.value as typeof historySort)}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {historyLoading ? (
                <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                  Loading approval history...
                </div>
              ) : filteredApprovalHistory.length === 0 ? (
                <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                  No approval requests match the selected filters.
                </div>
              ) : (
                filteredApprovalHistory.map((item) => (
                  <div key={item._id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        {approvalTypeLabel[item.requestType] || item.requestType.replace(/_/g, ' ')}
                      </p>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          item.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : item.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Requested: {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}
                    </p>
                    {item.decisionAt && (
                      <p className="text-sm text-muted-foreground">
                        Decided: {new Date(item.decisionAt).toLocaleString()}
                      </p>
                    )}
                    {item.requestNote && <p className="mt-2 text-sm">Doctor note: {item.requestNote}</p>}
                    {item.adminNote && <p className="text-sm">Admin note: {item.adminNote}</p>}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
