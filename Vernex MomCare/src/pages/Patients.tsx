import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { PatientCard } from '@/components/ui/patient-card';
import { PatientRegistrationDialog } from '@/components/dashboard/PatientRegistrationDialog';
import { PatientDetailDialog } from '@/components/dashboard/PatientDetailDialog';
import { Patient } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Filter, Users, History, Clock3, CheckCircle2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from "@/config/api";

type ApprovalHistory = {
  _id: string;
  requestType: 'patient_create' | 'guide_create' | 'guide_update' | 'guide_delete' | string;
  status: 'pending' | 'approved' | 'rejected' | string;
  requestNote?: string;
  adminNote?: string;
  decisionAt?: string;
  createdAt?: string;
  payload?: {
    name?: string;
    email?: string;
    age?: number;
    gestationalWeek?: number;
    riskStatus?: string;
  };
  targetKey?: string;
};

type PatientFilterValue =
  | 'all'
  | 'normal'
  | 'attention'
  | 'high-risk'
  | 'approval-pending'
  | 'approval-approved'
  | 'approval-rejected';

export default function Patients() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<PatientFilterValue>('all');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const isApprovalFilter = riskFilter.startsWith('approval-');
  const approvalStatusFilter = isApprovalFilter ? riskFilter.replace('approval-', '') : 'all';

  const mapApiPatient = (p: any): Patient => ({
    id: p._id || p.id,
    name: p.name,
    email: p.email,
    age: Number(p.age || 0),
    gestationalWeek: Number(p.gestationalWeek || 1),
    riskStatus: p.riskStatus || 'normal',
    medicalNotes: p.medicalNotes,
    pregnancyStartDate: p.pregnancyStartDate,
    contactPhone: p.contactPhone || p.phone || '',
    husbandName: p.husbandName,
    doctorId: p.doctorId,
    createdAt: p.createdAt,
  });

  // Only doctors can access this page
  if (user?.role !== 'doctor') {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">
            Only doctors can access the patient management area.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  useEffect(() => {
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
        fallbackData?.message ||
          primaryData?.message ||
          compatData?.message ||
          'Failed to load approval history'
      );
    };

    const fetchPatientsAndHistory = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const [patientRes, historyRequests] = await Promise.all([
          fetch(`${API_BASE}/api/auth/doctor/patients/${user.id}`),
          fetchDoctorApprovalHistory(user.id),
        ]);
        const data = await patientRes.json();

        if (!patientRes.ok || !data?.success) {
          throw new Error(data?.message || 'Failed to load patients');
        }

        setPatients((data.patients || []).map(mapApiPatient));
        setApprovalHistory(
          (Array.isArray(historyRequests) ? historyRequests : []).filter(
            (request) => request?.requestType === 'patient_create'
          )
        );
      } catch (error: any) {
        console.error('Fetch patients error:', error);
        toast({
          title: 'Error',
          description: error?.message || 'Failed to load patients',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPatientsAndHistory();
  }, [user?.id, toast]);

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = !isApprovalFilter && (riskFilter === 'all' || p.riskStatus === riskFilter);
    return matchesSearch && matchesRisk;
  });

  const filteredApprovalHistory = approvalHistory
    .filter((request) => approvalStatusFilter === 'all' || request.status === approvalStatusFilter)
    .filter((request) => {
      const name = String(request.payload?.name || '').toLowerCase();
      const email = String(request.payload?.email || request.targetKey || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      return !query || name.includes(query) || email.includes(query);
    })
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const handlePatientRegistered = (newPatient: Patient) => {
    const mapped = mapApiPatient(newPatient);
    setPatients((prev) => [...prev, mapped]);
  };

  const refreshApprovalHistory = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/auth/doctor/${user.id}/approval-history`);
      const data = await res.json();
      if (res.ok && data?.success) {
        setApprovalHistory(
          (data.requests || []).filter((request: ApprovalHistory) => request?.requestType === 'patient_create')
        );
      }
    } catch (error) {
      console.error('Refresh approval history error:', error);
    }
  };

  const approvalSummaryCount = approvalHistory.filter((request) => request.status === approvalStatusFilter).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-accent/40">
          <div className="flex flex-col gap-4 p-5 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Patient Management</h1>
              <p className="text-muted-foreground">
                {patients.length} patients in your care
              </p>
            </div>
            <Button onClick={() => setIsRegistrationOpen(true)} className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" />
              Register New Patient
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-full sm:w-48 rounded-xl">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Patients</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="attention">Attention</SelectItem>
              <SelectItem value="high-risk">High Risk</SelectItem>
              <SelectItem value="approval-pending">Pending Approvals</SelectItem>
              <SelectItem value="approval-approved">Approved Approvals</SelectItem>
              <SelectItem value="approval-rejected">Rejected Approvals</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Patient Grid / Approval History */}
        {loading ? (
          <div className="rounded-2xl border border-border p-8 text-center text-muted-foreground">
            Loading patients...
          </div>
        ) : isApprovalFilter ? (
          filteredApprovalHistory.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <History className="h-4 w-4" />
                {approvalSummaryCount} {approvalStatusFilter} patient creation approval
                {approvalSummaryCount === 1 ? '' : 's'}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredApprovalHistory.map((request, index) => {
                  const StatusIcon =
                    request.status === 'approved'
                      ? CheckCircle2
                      : request.status === 'rejected'
                      ? XCircle
                      : Clock3;

                  return (
                    <div
                      key={request._id}
                      className="animate-fade-in rounded-2xl border bg-card p-5"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {request.payload?.name || 'Pending patient request'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {request.payload?.email || request.targetKey || 'No email'}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                            request.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : request.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                          {request.status}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                        <p>Age: {request.payload?.age || '-'}</p>
                        <p>
                          Requested: {request.createdAt ? new Date(request.createdAt).toLocaleString() : '-'}
                        </p>
                        {request.decisionAt && (
                          <p>Reviewed: {new Date(request.decisionAt).toLocaleString()}</p>
                        )}
                      </div>

                      {request.requestNote && (
                        <div className="mt-4 rounded-xl bg-accent/40 p-3 text-sm">
                          <p className="font-medium text-foreground">Doctor note</p>
                          <p className="text-muted-foreground">{request.requestNote}</p>
                        </div>
                      )}

                      {request.adminNote && (
                        <div className="mt-3 rounded-xl bg-muted p-3 text-sm">
                          <p className="font-medium text-foreground">Admin note</p>
                          <p className="text-muted-foreground">{request.adminNote}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12">
              <History className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-center text-muted-foreground">
                No patient creation approval history matches this filter
              </p>
            </div>
          )
        ) : filteredPatients.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPatients.map((patient, index) => (
              <div
                key={patient.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <PatientCard
                  patient={patient}
                  onClick={() => setSelectedPatient(patient)}
                  onChatClick={(p) =>
                    navigate(`/doctor/chat/${p.id}`, {
                      state: { patientName: p.name },
                    })
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-center">
              {searchQuery || riskFilter !== 'all'
                ? 'No patients found matching your filters'
                : 'No patients registered yet'}
            </p>
            {!searchQuery && riskFilter === 'all' && (
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

      {/* Dialogs */}
      <PatientRegistrationDialog
        open={isRegistrationOpen}
        onOpenChange={setIsRegistrationOpen}
        onPatientRegistered={handlePatientRegistered}
        onRequestSubmitted={refreshApprovalHistory}
      />

      {selectedPatient && (
        <PatientDetailDialog
          patient={selectedPatient}
          open={!!selectedPatient}
          onOpenChange={(open) => !open && setSelectedPatient(null)}
        />
      )}
    </DashboardLayout>
  );
}
