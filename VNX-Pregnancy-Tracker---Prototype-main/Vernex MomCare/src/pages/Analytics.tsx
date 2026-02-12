import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { mockHealthData } from '@/data/mockData';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  Heart,
  Smile,
  Info,
  Droplets,
  Flame,
  Footprints,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Severity = 'mild' | 'moderate' | 'severe';

interface SymptomEntry {
  date: string;
  symptoms: string[];
  severity: Severity;
}

export default function Analytics() {
  const { user } = useAuth();
  const { patientId } = useParams();
  const navigate = useNavigate();

  const isDoctor = user?.role === 'doctor';
  const isDoctorView = isDoctor && !!patientId;

  /* ---------------- DAILY UI STATE ---------------- */
  const [waterGlasses, setWaterGlasses] = useState(3);
  const waterGoal = 10;

  const [calories] = useState(1850);
  const calorieGoal = 2200;

  const [steps] = useState(4250);
  const stepGoal = 8000;

  const [heartRate] = useState(72);

  const [todayMood, setTodayMood] =
    useState<'great' | 'good' | 'okay' | 'low'>('good');

  /* ---------------- EXISTING CHART DATA ---------------- */
  const weightData = mockHealthData.map((entry) => ({
    date: entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: entry.weight,
  }));

  const moodMapping = { great: 4, good: 3, okay: 2, low: 1 };
  const moodData = mockHealthData.map((entry) => ({
    date: entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    mood: moodMapping[entry.mood || 'okay'],
  }));

  /* ---------------- WEEKLY TRACKER DATA ---------------- */
  const weeklyTrackerData = [
    { date: 'Dec 1', water: 6, calories: 1800, steps: 4200, heartRate: 72 },
    { date: 'Dec 8', water: 8, calories: 1900, steps: 5100, heartRate: 74 },
    { date: 'Dec 15', water: 9, calories: 2000, steps: 6100, heartRate: 73 },
    { date: 'Dec 22', water: 7, calories: 1850, steps: 4800, heartRate: 71 },
  ];

  /* ---------------- SYMPTOMS STATE ---------------- */
  const [symptoms, setSymptoms] = useState<SymptomEntry[]>([
    { date: 'Dec 22', symptoms: ['Mild fatigue', 'Back pain'], severity: 'mild' },
    { date: 'Dec 20', symptoms: ['Nausea'], severity: 'moderate' },
    { date: 'Dec 18', symptoms: ['Leg cramps'], severity: 'mild' },
  ]);

  const [openSymptomModal, setOpenSymptomModal] = useState(false);
  const [symptomForm, setSymptomForm] = useState({
    date: '',
    symptom: '',
    severity: 'mild' as Severity,
  });

  const handleAddSymptom = () => {
    if (isDoctorView) return;
    if (!symptomForm.date || !symptomForm.symptom) return;

    setSymptoms((prev) => [
      {
        date: new Date(symptomForm.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        symptoms: [symptomForm.symptom],
        severity: symptomForm.severity,
      },
      ...prev,
    ]);

    setSymptomForm({ date: '', symptom: '', severity: 'mild' });
    setOpenSymptomModal(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Doctor Back Button */}
        {isDoctorView && (
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => navigate('/doctor/analytics')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Patient List
          </Button>
        )}

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Health Analytics</h1>
          <p className="text-muted-foreground">
            {isDoctorView
              ? 'Read-only view of patient health metrics'
              : 'Track your pregnancy health journey'}
          </p>
        </div>

        {/* Disclaimer */}
        <div className="flex gap-3 rounded-xl bg-info/10 border border-info/20 p-4">
          <Info className="h-5 w-5 text-info" />
          <div>
            <p className="text-sm font-medium">Informational – Not Diagnostic</p>
            <p className="text-xs text-muted-foreground">
              These metrics are for awareness only and do not replace medical advice.
            </p>
          </div>
        </div>

        {/* DAILY TRACKERS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-3">
                <Droplets className="h-5 w-5 text-primary" />
                <p className="font-medium">Water Intake</p>
              </div>
              <p className="text-sm">{waterGlasses} / {waterGoal} glasses</p>
              <Progress value={(waterGlasses / waterGoal) * 100} />
              {!isDoctorView && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    setWaterGlasses(g => Math.min(g + 1, waterGoal))
                  }
                >
                  + I drank one glass
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-3">
                <Flame className="h-5 w-5 text-warning" />
                <p className="font-medium">Calories</p>
              </div>
              <p className="text-sm">{calories} / {calorieGoal} kcal</p>
              <Progress value={(calories / calorieGoal) * 100} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-3">
                <Footprints className="h-5 w-5 text-success" />
                <p className="font-medium">Steps</p>
              </div>
              <p className="text-sm">{steps} / {stepGoal} steps</p>
              <Progress value={(steps / stepGoal) * 100} />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-destructive" />
                <p className="font-medium">Heart Rate</p>
              </div>
              <p className="text-xl font-bold">{heartRate} bpm</p>
            </CardContent>
          </Card>
        </div>

        {/* MOOD INPUT */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smile className="h-5 w-5 text-primary" />
              How are you feeling today?
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            {(['great', 'good', 'okay', 'low'] as const).map((mood) => (
              <Button
                key={mood}
                disabled={isDoctorView}
                variant={todayMood === mood ? 'default' : 'outline'}
                onClick={() => setTodayMood(mood)}
                className="capitalize"
              >
                {mood}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* WEEKLY TRACKERS */}
        <div className="grid gap-6 lg:grid-cols-2">
          {[
            ['Weekly Water Intake', 'water', '#3b82f6'],
            ['Weekly Calories', 'calories', '#f97316'],
            ['Weekly Steps', 'steps', '#22c55e'],
            ['Weekly Heart Rate', 'heartRate', '#ef4444'],
          ].map(([title, key, color]) => (
            <Card key={title}>
              <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTrackerData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line dataKey={key} stroke={color as string} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* WEIGHT & MOOD CHARTS */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Weight Tracking</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area dataKey="weight" stroke="#f472b6" fill="#fce7f3" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Mood Tracking</CardTitle></CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moodData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis
                    ticks={[1, 2, 3, 4]}
                    tickFormatter={(v) =>
                      ({ 1: 'Low', 2: 'Okay', 3: 'Good', 4: 'Great' }[v]!)
                    }
                  />
                  <Tooltip />
                  <Line dataKey="mood" stroke="#f59e0b" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* RECENT SYMPTOMS */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Symptoms</CardTitle>
            {!isDoctorView && (
              <Button size="sm" className="gap-2" onClick={() => setOpenSymptomModal(true)}>
                <Plus className="h-4 w-4" />
                Add Symptom
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {symptoms.map((entry, index) => (
              <div key={index} className="flex justify-between rounded-xl bg-accent/30 p-4">
                <div className="flex gap-3">
                  <span className="text-sm text-muted-foreground w-16">{entry.date}</span>
                  <div className="flex flex-wrap gap-2">
                    {entry.symptoms.map((s, i) => (
                      <span key={i} className="rounded-full bg-background px-3 py-1 text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <span className={`text-xs font-medium capitalize ${
                  entry.severity === 'mild'
                    ? 'text-success'
                    : entry.severity === 'moderate'
                    ? 'text-warning'
                    : 'text-destructive'
                }`}>
                  {entry.severity}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ADD SYMPTOM MODAL */}
        <Dialog open={openSymptomModal} onOpenChange={setOpenSymptomModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Symptom</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={symptomForm.date}
                  onChange={(e) =>
                    setSymptomForm({ ...symptomForm, date: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Symptom</Label>
                <Input
                  placeholder="e.g. Headache"
                  value={symptomForm.symptom}
                  onChange={(e) =>
                    setSymptomForm({ ...symptomForm, symptom: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Severity</Label>
                <div className="flex gap-2">
                  {(['mild', 'moderate', 'severe'] as Severity[]).map((s) => (
                    <Button
                      key={s}
                      variant={symptomForm.severity === s ? 'default' : 'outline'}
                      onClick={() =>
                        setSymptomForm({ ...symptomForm, severity: s })
                      }
                      className="capitalize"
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              <Button className="w-full" onClick={handleAddSymptom}>
                Save Symptom
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
