import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Droplets,
  Flame,
  Footprints,
  Heart,
  Info,
  Moon,
  Plus,
  Scale,
  X,
  type LucideIcon,
} from 'lucide-react';

import {
  AnalyticsSectionHeader,
} from '@/components/analytics/AnalyticsSectionHeader';
import {
  TrackerDetailPanel,
  type TrackerDetailItem,
} from '@/components/analytics/TrackerDetailPanel';
import { TrackerSummaryCard } from '@/components/analytics/TrackerSummaryCard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DrawerClose,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type {
  AnalyticsSeverity,
  AnalyticsSummary,
  AnalyticsSummaryItem,
  AnalyticsTrackerId,
  AnalyticsUiState,
  RecentValue,
  RecentValuesState,
  SelectedTracker,
  SymptomRecord,
  SyncStatus,
  TrackerHistoryPoint,
  TrackerHistoryState,
  WaterLog,
  WeightHistoryEntry,
} from '@/types/analytics';

type TrackerDefinition = SelectedTracker & {
  icon: LucideIcon;
  iconClassName: string;
  chartColor: string;
  emptyStateCopy: string;
};

const trackerOrder: AnalyticsTrackerId[] = [
  'steps',
  'calories',
  'heartRate',
  'spo2',
  'sleep',
  'waterIntake',
  'weight',
];

const commonSymptoms = [
  'Nausea',
  'Headache',
  'Back pain',
  'Dizziness',
  'Fatigue',
  'Vomiting',
  'Swelling',
  'Leg cramps',
  'Heartburn',
  'Insomnia',
] as const;

const trackerDefinitions: Record<AnalyticsTrackerId, TrackerDefinition> = {
  steps: {
    trackerId: 'steps',
    title: 'Steps',
    unit: 'steps',
    description: 'Movement history and sync-ready activity totals will appear here.',
    supportsManualEntry: false,
    icon: Footprints,
    iconClassName: 'text-success',
    chartColor: '#22c55e',
    emptyStateCopy: 'Connect a device or sync source to populate daily step history.',
  },
  calories: {
    trackerId: 'calories',
    title: 'Calories',
    unit: 'kcal',
    description: 'Nutrition totals can be surfaced here once food logging is connected.',
    supportsManualEntry: false,
    icon: Flame,
    iconClassName: 'text-warning',
    chartColor: '#f97316',
    emptyStateCopy: 'Calorie readings will appear once meal or nutrition data is available.',
  },
  heartRate: {
    trackerId: 'heartRate',
    title: 'Heart Rate',
    unit: 'bpm',
    description: 'Heart rate trends are prepared for wearable or clinical sync.',
    supportsManualEntry: false,
    icon: Heart,
    iconClassName: 'text-destructive',
    chartColor: '#ef4444',
    emptyStateCopy: 'Heart rate history is empty until a sensor or backend feed is connected.',
  },
  spo2: {
    trackerId: 'spo2',
    title: 'SpO2',
    unit: '%',
    description: 'Blood oxygen readings can be attached here from a pulse oximeter feed.',
    supportsManualEntry: false,
    icon: Activity,
    iconClassName: 'text-info',
    chartColor: '#3b82f6',
    emptyStateCopy: 'SpO2 measurements will show here when synced from a supported source.',
  },
  sleep: {
    trackerId: 'sleep',
    title: 'Sleep',
    unit: 'hrs',
    description: 'Sleep duration and rest history are ready for device or app integrations.',
    supportsManualEntry: false,
    icon: Moon,
    iconClassName: 'text-primary',
    chartColor: '#8b5cf6',
    emptyStateCopy: 'Sleep history will appear here after nightly tracking is connected.',
  },
  waterIntake: {
    trackerId: 'waterIntake',
    title: 'Water Intake',
    unit: 'ml',
    description: 'Manual hydration logs stay in the frontend until real persistence is wired.',
    supportsManualEntry: true,
    icon: Droplets,
    iconClassName: 'text-primary',
    chartColor: '#0ea5e9',
    emptyStateCopy: 'Add hydration entries to start building water intake history.',
  },
  weight: {
    trackerId: 'weight',
    title: 'Weight',
    unit: 'kg',
    description: 'Manual weight entries remain available in the frontend for future syncing.',
    supportsManualEntry: true,
    icon: Scale,
    iconClassName: 'text-primary',
    chartColor: '#f472b6',
    emptyStateCopy: 'Add weight entries to build a longitudinal weight history.',
  },
};

const createEmptyTrackerHistory = (): TrackerHistoryState =>
  trackerOrder.reduce((state, trackerId) => {
    state[trackerId] = [];
    return state;
  }, {} as TrackerHistoryState);

const createEmptyRecentValues = (): RecentValuesState =>
  trackerOrder.reduce((state, trackerId) => {
    state[trackerId] = [];
    return state;
  }, {} as RecentValuesState);

const createInitialSummaryItem = (
  trackerId: AnalyticsTrackerId,
): AnalyticsSummaryItem => ({
  trackerId,
  title: trackerDefinitions[trackerId].title,
  unit: trackerDefinitions[trackerId].unit,
  currentValue: null,
  targetValue: null,
  lastUpdatedAt: null,
  uiState: trackerDefinitions[trackerId].supportsManualEntry
    ? 'no-data'
    : 'sync-ready',
});

const createInitialAnalyticsSummary = (): AnalyticsSummary => ({
  trackers: trackerOrder.reduce((state, trackerId) => {
    state[trackerId] = createInitialSummaryItem(trackerId);
    return state;
  }, {} as AnalyticsSummary['trackers']),
  lastUpdatedAt: null,
});

const createSelectedTracker = (
  trackerId: AnalyticsTrackerId,
): SelectedTracker => {
  const tracker = trackerDefinitions[trackerId];

  return {
    trackerId: tracker.trackerId,
    title: tracker.title,
    unit: tracker.unit,
    description: tracker.description,
    supportsManualEntry: tracker.supportsManualEntry,
  };
};

const buildRecentValues = (
  entries: TrackerHistoryPoint[],
  unit: string,
): RecentValue[] =>
  [...entries]
    .slice(-3)
    .reverse()
    .map((entry) => ({
      id: entry.id,
      label: formatDateTime(entry.recordedAt),
      value: entry.value,
      unit,
      recordedAt: entry.recordedAt,
    }));

const createLocalId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const formatDateTime = (value: string | null) => {
  if (!value) {
    return 'No data available yet';
  }

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatMetricValue = (value: number | null, unit: string) => {
  if (value === null) {
    return 'No data available yet';
  }

  return `${value.toLocaleString()} ${unit}`;
};

const getUiStateLabel = (state: AnalyticsUiState) => {
  switch (state) {
    case 'loading':
      return 'Loading';
    case 'manual':
      return 'Manual';
    case 'sync-ready':
      return 'Sync ready';
    case 'synced':
      return 'Synced';
    case 'disconnected':
      return 'Disconnected';
    case 'unavailable':
      return 'Unavailable';
    case 'no-data':
      return 'No data';
    default:
      return 'No data';
  }
};

const getUiStateVariant = (state: AnalyticsUiState) => {
  switch (state) {
    case 'loading':
    case 'manual':
    case 'sync-ready':
    case 'synced':
      return 'secondary' as const;
    case 'disconnected':
    case 'unavailable':
      return 'destructive' as const;
    default:
      return 'outline' as const;
  }
};

const getUiStateMessage = (state: AnalyticsUiState) => {
  switch (state) {
    case 'loading':
      return 'Tracker data is preparing for display.';
    case 'manual':
      return 'This tracker is currently updated from manual frontend entries.';
    case 'sync-ready':
      return 'This tracker is ready to connect to a device or backend source.';
    case 'synced':
      return 'This tracker is ready to reflect synced readings when integration is enabled.';
    case 'disconnected':
      return 'Reconnect the source to resume incoming readings.';
    case 'unavailable':
      return 'This tracker is temporarily unavailable.';
    case 'no-data':
    default:
      return 'No readings have been recorded yet.';
  }
};

const getSeverityClassName = (severity: AnalyticsSeverity) => {
  switch (severity) {
    case 'moderate':
      return 'text-warning';
    case 'severe':
      return 'text-destructive';
    default:
      return 'text-success';
  }
};

export default function Analytics() {
  const { user } = useAuth();
  const { patientId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const isDoctor = user?.role === 'doctor';
  const isDoctorView = isDoctor && !!patientId;
  const [isAnalyticsLoading] = useState(false);
  const [isTrackerDetailOpen, setIsTrackerDetailOpen] = useState(false);

  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary>(
    () => createInitialAnalyticsSummary(),
  );
  const [selectedTracker, setSelectedTracker] = useState<SelectedTracker | null>(null);
  const [trackerHistory, setTrackerHistory] = useState<TrackerHistoryState>(() =>
    createEmptyTrackerHistory(),
  );
  const [recentValues, setRecentValues] = useState<RecentValuesState>(() =>
    createEmptyRecentValues(),
  );
  const [symptoms, setSymptoms] = useState<SymptomRecord[]>([]);
  const [symptomsState, setSymptomsState] = useState<AnalyticsUiState>('no-data');
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [weightHistory, setWeightHistory] = useState<WeightHistoryEntry[]>([]);
  const [syncStatus] = useState<SyncStatus>({
    state: 'sync-ready',
    lastSyncedAt: null,
    source: null,
    message: 'Analytics is ready for device sync or backend integration.',
  });

  const [openSymptomModal, setOpenSymptomModal] = useState(false);
  const [symptomForm, setSymptomForm] = useState({
    recordedAt: '',
    symptom: '',
    severity: 'mild' as AnalyticsSeverity,
  });
  const [waterForm, setWaterForm] = useState({
    amountMl: '',
    recordedAt: '',
    note: '',
  });
  const [weightForm, setWeightForm] = useState({
    valueKg: '',
    recordedAt: '',
    note: '',
  });

  const selectedTrackerDefinition = selectedTracker
    ? trackerDefinitions[selectedTracker.trackerId]
    : null;
  const SelectedTrackerIcon = selectedTrackerDefinition?.icon ?? Footprints;
  const selectedTrackerSummary = selectedTracker
    ? analyticsSummary.trackers[selectedTracker.trackerId]
    : null;
  const selectedTrackerHistory = selectedTracker
    ? trackerHistory[selectedTracker.trackerId]
    : [];
  const selectedTrackerRecentValues = selectedTracker
    ? recentValues[selectedTracker.trackerId]
    : [];
  const normalizedSymptomInput = symptomForm.symptom.trim().toLowerCase();
  const filteredSymptomSuggestions = commonSymptoms.filter((symptom) =>
    symptom.toLowerCase().includes(normalizedSymptomInput),
  );
  const exactSymptomMatch = commonSymptoms.some(
    (symptom) => symptom.toLowerCase() === normalizedSymptomInput,
  );

  const getEffectiveUiState = (trackerId: AnalyticsTrackerId): AnalyticsUiState => {
    if (isAnalyticsLoading) {
      return 'loading';
    }

    return analyticsSummary.trackers[trackerId].uiState;
  };

  const getTrackerLatestValue = (trackerId: AnalyticsTrackerId) => {
    const summary = analyticsSummary.trackers[trackerId];
    const uiState = getEffectiveUiState(trackerId);

    if (uiState === 'loading') {
      return 'Loading...';
    }

    if (summary.currentValue === null) {
      return uiState === 'sync-ready' ? 'Waiting for sync' : 'No data';
    }

    return summary.currentValue.toLocaleString();
  };

  const getTrackerLastUpdated = (trackerId: AnalyticsTrackerId) => {
    const summary = analyticsSummary.trackers[trackerId];
    const uiState = getEffectiveUiState(trackerId);

    if (uiState === 'loading') {
      return 'Preparing tracker state';
    }

    return summary.lastUpdatedAt
      ? `Updated ${formatDateTime(summary.lastUpdatedAt)}`
      : getUiStateMessage(uiState);
  };

  const getTrackerValueDisplay = (trackerId: AnalyticsTrackerId) => {
    const summary = analyticsSummary.trackers[trackerId];
    const uiState = getEffectiveUiState(trackerId);

    if (uiState === 'loading') {
      return 'Loading...';
    }

    if (summary.currentValue === null) {
      switch (uiState) {
        case 'sync-ready':
          return 'Waiting for sync';
        case 'disconnected':
          return 'Disconnected';
        case 'unavailable':
          return 'Unavailable';
        default:
          return 'No data available yet';
      }
    }

    return formatMetricValue(summary.currentValue, summary.unit);
  };

  const getSelectedTrackerValueLabel = (trackerId: AnalyticsTrackerId) => {
    switch (trackerId) {
      case 'steps':
        return 'Latest steps total';
      case 'calories':
        return 'Latest calorie total';
      case 'heartRate':
        return 'Latest heart rate';
      case 'spo2':
        return 'Latest SpO2 reading';
      case 'sleep':
        return 'Latest sleep duration';
      case 'waterIntake':
        return 'Latest water intake';
      case 'weight':
        return 'Latest weight entry';
      default:
        return 'Latest value';
    }
  };

  const getTrackerDetailItems = (
    trackerId: AnalyticsTrackerId,
  ): TrackerDetailItem[] => {
    const summary = analyticsSummary.trackers[trackerId];
    const uiState = getEffectiveUiState(trackerId);
    return [
      {
        label: 'Status',
        value: getUiStateLabel(uiState),
      },
      {
        label: 'Last synced',
        value: syncStatus.lastSyncedAt
          ? formatDateTime(syncStatus.lastSyncedAt)
          : 'Not synced yet',
      },
      {
        label: 'Source',
        value: syncStatus.source ?? 'No source connected',
      },
    ];
  };

  const updateTrackerState = ({
    trackerId,
    entries,
    currentValue,
    lastUpdatedAt,
    uiState,
  }: {
    trackerId: AnalyticsTrackerId;
    entries: TrackerHistoryPoint[];
    currentValue: number | null;
    lastUpdatedAt: string | null;
    uiState: AnalyticsUiState;
  }) => {
    setTrackerHistory((prev) => ({
      ...prev,
      [trackerId]: entries,
    }));

    setRecentValues((prev) => ({
      ...prev,
      [trackerId]: buildRecentValues(entries, trackerDefinitions[trackerId].unit),
    }));

    setAnalyticsSummary((prev) => ({
      trackers: {
        ...prev.trackers,
        [trackerId]: {
          ...prev.trackers[trackerId],
          currentValue,
          lastUpdatedAt,
          uiState,
        },
      },
      lastUpdatedAt: lastUpdatedAt ?? prev.lastUpdatedAt,
    }));
  };

  const handleSelectTracker = (trackerId: AnalyticsTrackerId) => {
    setSelectedTracker(createSelectedTracker(trackerId));
    setIsTrackerDetailOpen(true);
  };

  const handleTrackerDetailOpenChange = (open: boolean) => {
    setIsTrackerDetailOpen(open);

    if (!open) {
      setSelectedTracker(null);
    }
  };

  const handleAddWaterLog = () => {
    if (isDoctorView) {
      return;
    }

    const amountMl = Number(waterForm.amountMl);

    if (!Number.isFinite(amountMl) || amountMl <= 0) {
      return;
    }

    const recordedAt = waterForm.recordedAt
      ? new Date(waterForm.recordedAt).toISOString()
      : new Date().toISOString();

    const nextLog: WaterLog = {
      id: createLocalId('water'),
      recordedAt,
      amountMl,
      source: 'manual',
      note: waterForm.note.trim() || undefined,
    };

    const nextWaterLogs = [...waterLogs, nextLog].sort(
      (left, right) =>
        new Date(left.recordedAt).getTime() - new Date(right.recordedAt).getTime(),
    );

    setWaterLogs(nextWaterLogs);

    updateTrackerState({
      trackerId: 'waterIntake',
      entries: nextWaterLogs.map((log) => ({
        id: log.id,
        recordedAt: log.recordedAt,
        value: log.amountMl,
        source: log.source,
        note: log.note,
      })),
      currentValue: nextWaterLogs.reduce((total, log) => total + log.amountMl, 0),
      lastUpdatedAt: nextLog.recordedAt,
      uiState: 'manual',
    });

    setWaterForm({
      amountMl: '',
      recordedAt: '',
      note: '',
    });
  };

  const handleAddWeightEntry = () => {
    if (isDoctorView) {
      return;
    }

    const valueKg = Number(weightForm.valueKg);

    if (!Number.isFinite(valueKg) || valueKg <= 0) {
      return;
    }

    const recordedAt = weightForm.recordedAt
      ? new Date(weightForm.recordedAt).toISOString()
      : new Date().toISOString();

    const nextEntry: WeightHistoryEntry = {
      id: createLocalId('weight'),
      recordedAt,
      valueKg,
      source: 'manual',
      note: weightForm.note.trim() || undefined,
    };

    const nextWeightHistory = [...weightHistory, nextEntry].sort(
      (left, right) =>
        new Date(left.recordedAt).getTime() - new Date(right.recordedAt).getTime(),
    );

    setWeightHistory(nextWeightHistory);

    updateTrackerState({
      trackerId: 'weight',
      entries: nextWeightHistory.map((entry) => ({
        id: entry.id,
        recordedAt: entry.recordedAt,
        value: entry.valueKg,
        source: entry.source,
        note: entry.note,
      })),
      currentValue: nextEntry.valueKg,
      lastUpdatedAt: nextEntry.recordedAt,
      uiState: 'manual',
    });

    setWeightForm({
      valueKg: '',
      recordedAt: '',
      note: '',
    });
  };

  const handleAddSymptom = () => {
    if (isDoctorView || !symptomForm.symptom.trim()) {
      return;
    }

    const recordedAt = symptomForm.recordedAt
      ? new Date(symptomForm.recordedAt).toISOString()
      : new Date().toISOString();

    setSymptoms((prev) => [
      {
        id: createLocalId('symptom'),
        recordedAt,
        symptoms: [symptomForm.symptom.trim()],
        severity: symptomForm.severity,
      },
      ...prev,
    ]);
    setSymptomsState('manual');

    setSymptomForm({
      recordedAt: '',
      symptom: '',
      severity: 'mild',
    });
    setOpenSymptomModal(false);
  };

  const handleSelectSymptomSuggestion = (symptom: string) => {
    setSymptomForm((prev) => ({
      ...prev,
      symptom,
    }));
  };

  const trackerDetailCloseControl = isMobile ? (
    <DrawerClose asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0"
        aria-label="Close tracker details"
      >
        <X className="h-4 w-4" />
      </Button>
    </DrawerClose>
  ) : (
    <DialogClose asChild>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0"
        aria-label="Close tracker details"
      >
        <X className="h-4 w-4" />
      </Button>
    </DialogClose>
  );

  const trackerDetailContent =
    selectedTracker && selectedTrackerDefinition && selectedTrackerSummary ? (
      <div className="space-y-4">
        <TrackerDetailPanel
          selectedTracker={selectedTracker}
          summary={selectedTrackerSummary}
          recentValues={selectedTrackerRecentValues}
          history={selectedTrackerHistory}
          icon={SelectedTrackerIcon}
          iconClassName={selectedTrackerDefinition.iconClassName}
          chartColor={selectedTrackerDefinition.chartColor}
          currentValueLabel={getSelectedTrackerValueLabel(
            selectedTracker.trackerId,
          )}
          currentValueDisplay={getTrackerValueDisplay(selectedTracker.trackerId)}
          uiState={getEffectiveUiState(selectedTracker.trackerId)}
          closeControl={trackerDetailCloseControl}
          statusLabel={getUiStateLabel(
            getEffectiveUiState(selectedTracker.trackerId),
          )}
          statusMessage={getUiStateMessage(
            getEffectiveUiState(selectedTracker.trackerId),
          )}
          detailItems={getTrackerDetailItems(selectedTracker.trackerId)}
        />

        {selectedTracker.trackerId === 'waterIntake' && !isDoctorView && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Add Water Log</CardTitle>
              <CardDescription>
                Record hydration manually while this tracker remains frontend-only.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="water-amount">Amount (ml)</Label>
                <Input
                  id="water-amount"
                  type="number"
                  min="1"
                  placeholder="Enter water intake"
                  value={waterForm.amountMl}
                  onChange={(event) =>
                    setWaterForm((prev) => ({
                      ...prev,
                      amountMl: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="water-recorded-at">Recorded At (optional)</Label>
                <Input
                  id="water-recorded-at"
                  type="datetime-local"
                  value={waterForm.recordedAt}
                  onChange={(event) =>
                    setWaterForm((prev) => ({
                      ...prev,
                      recordedAt: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="water-note">Note (optional)</Label>
                <Input
                  id="water-note"
                  placeholder="Add context for this entry"
                  value={waterForm.note}
                  onChange={(event) =>
                    setWaterForm((prev) => ({
                      ...prev,
                      note: event.target.value,
                    }))
                  }
                />
              </div>

              <Button className="w-full md:col-span-3" onClick={handleAddWaterLog}>
                Save Water Log
              </Button>
            </CardContent>
          </Card>
        )}

        {selectedTracker.trackerId === 'weight' && !isDoctorView && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Add Weight Entry</CardTitle>
              <CardDescription>
                Record weight manually while this tracker remains frontend-only.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="weight-value">Weight (kg)</Label>
                <Input
                  id="weight-value"
                  type="number"
                  min="1"
                  step="0.1"
                  placeholder="Enter weight"
                  value={weightForm.valueKg}
                  onChange={(event) =>
                    setWeightForm((prev) => ({
                      ...prev,
                      valueKg: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="weight-recorded-at">Recorded At (optional)</Label>
                <Input
                  id="weight-recorded-at"
                  type="datetime-local"
                  value={weightForm.recordedAt}
                  onChange={(event) =>
                    setWeightForm((prev) => ({
                      ...prev,
                      recordedAt: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="weight-note">Note (optional)</Label>
                <Input
                  id="weight-note"
                  placeholder="Add context for this entry"
                  value={weightForm.note}
                  onChange={(event) =>
                    setWeightForm((prev) => ({
                      ...prev,
                      note: event.target.value,
                    }))
                  }
                />
              </div>

              <Button className="w-full md:col-span-3" onClick={handleAddWeightEntry}>
                Save Weight Entry
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    ) : null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
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

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Health Analytics</h1>
          <p className="text-muted-foreground">
            {isDoctorView
              ? 'Read-only view of patient health metrics'
              : 'Track your pregnancy health journey'}
          </p>
        </div>

        <div className="flex gap-3 rounded-xl border border-info/20 bg-info/10 p-4">
          <Info className="h-5 w-5 text-info" />
          <div>
            <p className="text-sm font-medium">Informational only</p>
            <p className="text-xs text-muted-foreground">
              These metrics are for awareness only and do not replace medical
              advice.
            </p>
          </div>
        </div>

        <section className="space-y-4">
          <AnalyticsSectionHeader
            title="Tracker Cards"
            description="Select a tracker to view its detail panel, current state, and latest readings."
            action={
              <Badge variant={getUiStateVariant(syncStatus.state)}>
                {getUiStateLabel(syncStatus.state)}
              </Badge>
            }
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {trackerOrder.map((trackerId) => {
              const tracker = trackerDefinitions[trackerId];

              return (
                <TrackerSummaryCard
                  key={trackerId}
                  title={tracker.title}
                  latestValue={getTrackerLatestValue(trackerId)}
                  unit={tracker.unit}
                  lastUpdated={getTrackerLastUpdated(trackerId)}
                  status={getUiStateLabel(getEffectiveUiState(trackerId))}
                  stateMessage={getUiStateMessage(getEffectiveUiState(trackerId))}
                  icon={tracker.icon}
                  iconClassName={tracker.iconClassName}
                  isSelected={selectedTracker?.trackerId === trackerId}
                  onSelect={() => handleSelectTracker(trackerId)}
                />
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <AnalyticsSectionHeader
            title="Symptoms"
            description="Capture symptom notes with severity and quick suggestions while keeping doctor views read-only."
            action={
              !isDoctorView ? (
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => setOpenSymptomModal(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add Symptom
                </Button>
              ) : (
                <Badge variant="outline">Read only</Badge>
              )
            }
          />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-base">Recent Symptoms</CardTitle>
                <CardDescription>
                  Symptom entries appear here as they are recorded.
                </CardDescription>
              </div>
              <Badge variant="outline">
                {symptoms.length} {symptoms.length === 1 ? 'entry' : 'entries'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {isAnalyticsLoading || symptomsState === 'loading' ? (
                <div className="rounded-xl border border-dashed border-border bg-accent/20 p-6 text-center">
                  <p className="font-medium">Loading symptoms</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Symptom history is preparing for display.
                  </p>
                </div>
              ) : symptoms.length > 0 ? (
                symptoms.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-3 rounded-xl bg-accent/30 p-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(entry.recordedAt)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {entry.symptoms.map((symptom) => (
                          <span
                            key={symptom}
                            className="rounded-full bg-background px-3 py-1 text-xs"
                          >
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>

                    <span
                      className={cn(
                        'text-xs font-medium capitalize',
                        getSeverityClassName(entry.severity),
                      )}
                    >
                      {entry.severity}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-accent/20 p-6 text-center">
                  <p className="font-medium">
                    {symptomsState === 'unavailable'
                      ? 'Symptoms unavailable'
                      : symptomsState === 'disconnected'
                        ? 'Symptoms disconnected'
                        : 'No symptoms logged yet'}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {symptomsState === 'unavailable' ||
                    symptomsState === 'disconnected'
                      ? 'Symptom records are not available right now.'
                      : 'Add the first symptom entry to start building this timeline.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {isMobile ? (
          <Drawer
            open={isTrackerDetailOpen}
            onOpenChange={handleTrackerDetailOpenChange}
          >
            <DrawerContent className="inset-0 mt-0 h-[100dvh] max-h-[100dvh] w-screen rounded-none border-0 [&>div:first-child]:hidden">
              <DrawerHeader className="sr-only">
                <DrawerTitle>
                  {selectedTracker ? `${selectedTracker.title} Details` : 'Tracker Details'}
                </DrawerTitle>
                <DrawerDescription>
                  Tracker details, status, recent values, and graph area.
                </DrawerDescription>
              </DrawerHeader>
              <div className="h-full overflow-y-auto bg-background p-0">
                {trackerDetailContent}
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog
            open={isTrackerDetailOpen}
            onOpenChange={handleTrackerDetailOpenChange}
          >
            <DialogContent className="h-[88vh] max-h-[88vh] max-w-5xl overflow-hidden p-0">
              <DialogHeader className="sr-only">
                <DialogTitle>
                  {selectedTracker ? `${selectedTracker.title} Details` : 'Tracker Details'}
                </DialogTitle>
                <DialogDescription>
                  Tracker details, status, recent values, and graph area.
                </DialogDescription>
              </DialogHeader>
              <div className="h-full overflow-y-auto p-6">
                {trackerDetailContent}
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={openSymptomModal} onOpenChange={setOpenSymptomModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Symptom</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="symptom-recorded-at">Recorded At</Label>
                <Input
                  id="symptom-recorded-at"
                  type="datetime-local"
                  value={symptomForm.recordedAt}
                  onChange={(event) =>
                    setSymptomForm((prev) => ({
                      ...prev,
                      recordedAt: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="symptom-name">Symptom</Label>
                <Input
                  id="symptom-name"
                  placeholder="Search or enter a symptom"
                  value={symptomForm.symptom}
                  onChange={(event) =>
                    setSymptomForm((prev) => ({
                      ...prev,
                      symptom: event.target.value,
                    }))
                  }
                />
                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Suggestions
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {normalizedSymptomInput
                        ? 'Choose a match or keep typing a custom symptom'
                        : 'Start typing to filter common symptoms'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(normalizedSymptomInput
                      ? filteredSymptomSuggestions
                      : commonSymptoms.slice(0, 5)
                    ).map((symptom) => (
                      <Button
                        key={symptom}
                        type="button"
                        variant={
                          symptomForm.symptom.trim().toLowerCase() ===
                          symptom.toLowerCase()
                            ? 'default'
                            : 'outline'
                        }
                        className="h-auto rounded-full px-3 py-1.5 text-xs"
                        onClick={() => handleSelectSymptomSuggestion(symptom)}
                      >
                        {symptom}
                      </Button>
                    ))}
                  </div>

                  {normalizedSymptomInput && filteredSymptomSuggestions.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border bg-accent/20 p-3 text-sm text-muted-foreground">
                      No common symptom match found. You can save
                      <span className="mx-1 font-medium text-foreground">
                        {symptomForm.symptom.trim()}
                      </span>
                      as a custom symptom.
                    </div>
                  )}

                  {normalizedSymptomInput &&
                    filteredSymptomSuggestions.length > 0 &&
                    !exactSymptomMatch && (
                      <div className="rounded-xl border border-dashed border-border bg-accent/20 p-3 text-sm text-muted-foreground">
                        You can also save
                        <span className="mx-1 font-medium text-foreground">
                          {symptomForm.symptom.trim()}
                        </span>
                        as a custom symptom.
                      </div>
                    )}
                </div>
              </div>

              <div>
                <Label>Severity</Label>
                <div className="flex gap-2">
                  {(['mild', 'moderate', 'severe'] as AnalyticsSeverity[]).map(
                    (severity) => (
                      <Button
                        key={severity}
                        type="button"
                        variant={
                          symptomForm.severity === severity
                            ? 'default'
                            : 'outline'
                        }
                        onClick={() =>
                          setSymptomForm((prev) => ({
                            ...prev,
                            severity,
                          }))
                        }
                        className="capitalize"
                      >
                        {severity}
                      </Button>
                    ),
                  )}
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
