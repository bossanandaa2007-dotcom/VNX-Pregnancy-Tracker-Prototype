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
  } from 'lucide-react';
  import { cn } from '@/lib/utils';

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
    // ================= SAFE GUARDS =================
    const safeRiskStatus = patient.riskStatus || 'normal';
    const riskConfig = riskStatusConfig[safeRiskStatus];
    const RiskIcon = riskConfig.icon;

    const gestationalWeek = patient.gestationalWeek || 0;
    const progressPercent = Math.min((gestationalWeek / 40) * 100, 100);

    const pregnancyStartDate = patient.pregnancyStartDate
      ? new Date(patient.pregnancyStartDate)
      : null;

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
                <Button variant="outline" className="flex-1 gap-2 rounded-xl">
                  <FileText className="h-4 w-4" />
                  View Records
                </Button>
              </div>
            </TabsContent>

            {/* ================= HEALTH ================= */}
            <TabsContent value="health" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Health Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-center justify-center rounded-xl bg-accent/30">
                    <p className="text-sm text-muted-foreground">
                      Health analytics charts will appear here
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Informational – Not Diagnostic
                  </p>
                </CardContent>
              </Card>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-accent/30 p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">65.2</p>
                  <p className="text-xs text-muted-foreground">
                    Current Weight (kg)
                  </p>
                </div>
                <div className="rounded-xl bg-accent/30 p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">120/80</p>
                  <p className="text-xs text-muted-foreground">
                    Blood Pressure
                  </p>
                </div>
                <div className="rounded-xl bg-accent/30 p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">Good</p>
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
                  <div className="rounded-xl bg-accent/30 p-4 min-h-32">
                    <p className="text-sm">
                      {patient.medicalNotes || 'No medical notes recorded yet.'}
                    </p>
                  </div>
                  <Button variant="outline" className="w-full mt-4 rounded-xl">
                    Add Note
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  }
