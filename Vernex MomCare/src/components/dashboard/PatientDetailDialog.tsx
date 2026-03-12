  import { useEffect, useMemo, useState } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { Patient } from '@/types';
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from '@/components/ui/dialog';
  import { Button } from '@/components/ui/button';
  import { Badge } from '@/components/ui/badge';
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
  import { Progress } from '@/components/ui/progress';
  import { Textarea } from '@/components/ui/textarea';
  import { mockHealthData } from '@/data/mockData';
  import {
    User,
    Calendar,
    Phone,
    Mail,
    FileText,
    MessageCircle,
    TrendingUp,
    Heart,
    AlertTriangle,
    CheckCircle,
    AlertCircle,
    BarChart3,
  } from 'lucide-react';
  import { cn } from '@/lib/utils';
  import { useToast } from '@/hooks/use-toast';
  import { API_BASE } from '@/config/api';

  interface PatientDetailDialogProps {
    patient: Patient;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }

  const riskStatusConfig = {
    normal: {
      label: 'Normal',
      icon: CheckCircle,
      className: 'bg-success/10 text-success border-success/20',
    },
    attention: {
      label: 'Attention',
      icon: AlertCircle,
      className: 'bg-warning/10 text-warning border-warning/20',
    },
    'high-risk': {
      label: 'High Risk',
      icon: AlertTriangle,
      className: 'bg-destructive/10 text-destructive border-destructive/20',
    },
  };

  export function PatientDetailDialog({
    patient,
    open,
    onOpenChange,
  }: PatientDetailDialogProps) {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [localMedicalNotes, setLocalMedicalNotes] = useState(patient.medicalNotes || '');
    const [savingNote, setSavingNote] = useState(false);

    useEffect(() => {
      setLocalMedicalNotes(patient.medicalNotes || '');
    }, [patient.id, patient.medicalNotes]);
    // ================= SAFE GUARDS =================
    const safeRiskStatus = patient.riskStatus || 'normal';
    const riskConfig = riskStatusConfig[safeRiskStatus];
    const RiskIcon = riskConfig.icon;

    const gestationalWeek = patient.gestationalWeek || 0;
    const progressPercent = Math.min((gestationalWeek / 40) * 100, 100);

    const pregnancyStartDate = patient.pregnancyStartDate
      ? new Date(patient.pregnancyStartDate)
      : null;

    const analyticsSummary = useMemo(() => {
      // Lightweight per-patient variation using a deterministic offset.
      const seed = String(patient.id || patient.email || patient.name || "0");
      let hash = 0;
      for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
      const offset = (hash % 60) / 10 - 3; // [-3, +3)

      const points = mockHealthData.map((x) => ({
        date: x.date,
        weight: Number((x.weight + offset).toFixed(1)),
        mood: x.mood,
      }));

      const currentWeight = points.at(-1)?.weight ?? 0;
      const weightDelta =
        points.length >= 2 ? Number((currentWeight - points[0].weight).toFixed(1)) : 0;
      const moodText = (() => {
        const m = points.at(-1)?.mood || 'okay';
        if (m === 'great') return 'Great';
        if (m === 'good') return 'Good';
        if (m === 'low') return 'Low';
        return 'Okay';
      })();

      return { currentWeight, weightDelta, moodText };
    }, [patient.id, patient.email, patient.name]);

    const handleSaveNote = async () => {
      const trimmed = localMedicalNotes.trim();
      setSavingNote(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/patient/${patient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ medicalNotes: trimmed }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || 'Failed to update notes');
        }
        toast({
          title: 'Note updated',
          description: 'Medical note saved successfully.',
        });
      } catch (error: any) {
        console.error('Save note error:', error);
        toast({
          title: 'Failed to save note',
          description: error?.message || 'Something went wrong',
          variant: 'destructive',
        });
      } finally {
        setSavingNote(false);
      }
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-xl">{patient.name}</DialogTitle>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-muted-foreground">
                    Age {patient.age || '-'} • Week {gestationalWeek}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn('gap-1', riskConfig.className)}
                  >
                    <RiskIcon className="h-3 w-3" />
                    {riskConfig.label}
                  </Badge>
                </div>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="health">Health Data</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            {/* ================= OVERVIEW ================= */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Contact Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{patient.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {patient.contactPhone || 'Not provided'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Started:{' '}
                      {pregnancyStartDate
                        ? pregnancyStartDate.toLocaleDateString()
                        : 'Not available'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Pregnancy Progress */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pregnancy Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-primary" />
                      <span className="font-medium">
                        Week {gestationalWeek} of 40
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(progressPercent)}% complete
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>First Trimester</span>
                    <span>Second Trimester</span>
                    <span>Third Trimester</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <Button className="flex-1 gap-2 rounded-xl">
                  <MessageCircle className="h-4 w-4" />
                  Open Chat
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2 rounded-xl"
                  onClick={() => navigate(`/doctor/analytics/${patient.id}`)}
                >
                  <BarChart3 className="h-4 w-4" />
                  View Analytics
                </Button>
              </div>
            </TabsContent>

            {/* ================= HEALTH ================= */}
            <TabsContent value="health" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Health Metrics
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => navigate(`/doctor/analytics/${patient.id}`)}
                    >
                      View full analytics
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center rounded-xl bg-accent/30">
                    <p className="text-sm text-muted-foreground">
                      Patient summary shown here. Use "View full analytics" for detailed charts.
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Informational – Not Diagnostic
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-accent/30 p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{analyticsSummary.currentWeight}</p>
                  <p className="text-xs text-muted-foreground">
                    Current Weight (kg)
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {analyticsSummary.weightDelta >= 0 ? '+' : ''}{analyticsSummary.weightDelta} kg (4w)
                  </p>
                </div>
                <div className="rounded-xl bg-accent/30 p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">120/80</p>
                  <p className="text-xs text-muted-foreground">
                    Blood Pressure
                  </p>
                </div>
                <div className="rounded-xl bg-accent/30 p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{analyticsSummary.moodText}</p>
                  <p className="text-xs text-muted-foreground">Overall Mood</p>
                </div>
              </div>
            </TabsContent>

            {/* ================= NOTES ================= */}
            <TabsContent value="notes" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Medical Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    className="min-h-32 rounded-xl"
                    placeholder="Type medical notes here..."
                    value={localMedicalNotes}
                    onChange={(e) => setLocalMedicalNotes(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    className="w-full mt-4 rounded-xl"
                    onClick={handleSaveNote}
                    disabled={savingNote}
                  >
                    {savingNote ? 'Saving...' : 'Save Note'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  }
