import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Plus, Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { DoctorCard } from '@/components/ui/doctor-card';
import { RegisterDoctorDialog, Doctor } from '@/components/admin/RegisterDoctorDialog';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/config/api';

interface ApprovalRequest {
  _id: string;
  requestType: 'patient_create' | 'guide_create' | 'guide_update' | 'guide_delete';
  requestNote?: string;
  payload?: any;
  requestedBy?: {
    name?: string;
    email?: string;
  };
  createdAt?: string;
}

const requestTypeLabel: Record<ApprovalRequest['requestType'], string> = {
  patient_create: 'Patient Registration',
  guide_create: 'Guide Create',
  guide_update: 'Guide Edit',
  guide_delete: 'Guide Delete',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [openRegister, setOpenRegister] = useState(false);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [adminNoteDraft, setAdminNoteDraft] = useState('');
  const selectedApproval =
    pendingDecision ? approvals.find((approval) => approval._id === pendingDecision.id) || null : null;
  const skipAdminNote =
    selectedApproval?.requestType === 'patient_create' && pendingDecision?.action === 'approve';

  const parseErrorMessage = (data: any, fallback: string) =>
    data?.message || data?.error || fallback;

  const fetchApprovalsFrom = async (url: string) => {
    const res = await fetch(url);
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      throw new Error(parseErrorMessage(data, `Failed to load approval requests (${res.status})`));
    }
    return Array.isArray(data.requests) ? data.requests : [];
  };

  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/doctors`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error('Failed to fetch doctors');
      }

      const doctorsWithCount: Doctor[] = await Promise.all(
        data.doctors.map(async (doc: any) => {
          try {
            const patientRes = await fetch(`${API_BASE}/api/auth/doctor/patients/${doc._id}`);
            const patientData = await patientRes.json();

            return {
              id: doc._id,
              name: doc.name,
              email: doc.email,
              specialty: doc.specialty,
              phone: doc.phone,
              profilePhoto: doc.profilePhoto,
              patientCount: patientData.success ? patientData.patients.length : 0,
            };
          } catch {
            return {
              id: doc._id,
              name: doc.name,
              email: doc.email,
              specialty: doc.specialty,
              phone: doc.phone,
              profilePhoto: doc.profilePhoto,
              patientCount: 0,
            };
          }
        })
      );

      setDoctors(doctorsWithCount);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to load doctors',
        variant: 'destructive',
      });
    }
  };

  const fetchApprovals = async () => {
    try {
      try {
        const requests = await fetchApprovalsFrom(`${API_BASE}/api/approvals?status=pending`);
        setApprovals(requests);
        return;
      } catch (firstErr: any) {
        const msg = String(firstErr?.message || '');
        const isNotFound = msg.includes('404') || msg.toLowerCase().includes('route not found');
        if (!isNotFound) throw firstErr;
      }

      const fallbackRequests = await fetchApprovalsFrom(`${API_BASE}/api/auth/approvals?status=pending`);
      setApprovals(fallbackRequests);
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Error',
        description: err?.message || 'Failed to load approval requests',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchApprovals();
  }, []);

  useEffect(() => {
    const clock = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  const handleDoctorRegistered = (doctor: Doctor) => {
    setDoctors((prev) => [...prev, doctor]);
  };

  const processRequest = async (id: string, action: 'approve' | 'reject', adminNote: string) => {
    try {
      setProcessingId(id);

      const res = await fetch(`${API_BASE}/api/approvals/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          adminEmail: 'admin@vnx.com',
          adminPassword: 'admin123',
          adminNote: adminNote || '',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(parseErrorMessage(data, `Failed to ${action} request`));
      }

      toast({
        title: action === 'approve' ? 'Request approved' : 'Request rejected',
        description: data.message,
      });

      await fetchApprovals();
      if (action === 'approve') {
        await fetchDoctors();
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Action failed',
        description: err?.message || 'Failed to process request',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openDecisionDialog = (id: string, action: 'approve' | 'reject') => {
    setPendingDecision({ id, action });
    setAdminNoteDraft('');
    setDecisionDialogOpen(true);
  };

  const handleDecisionConfirm = async () => {
    if (!pendingDecision) return;
    await processRequest(pendingDecision.id, pendingDecision.action, adminNoteDraft.trim());
    setDecisionDialogOpen(false);
    setPendingDecision(null);
    setAdminNoteDraft('');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col gap-5 rounded-[28px] border border-primary/10 bg-gradient-to-br from-primary/[0.09] via-background to-accent/30 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="space-y-3">
            <div className="inline-flex items-center rounded-full border border-primary/15 bg-background/80 px-3 py-1 text-xs font-medium text-primary">
              Administration center
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-[2.1rem]">Admin Dashboard</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Manage doctors and monitor patient assignments</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border bg-background/80 px-4 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Doctors</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{doctors.length}</p>
              </div>
              <div className="rounded-2xl border bg-background/80 px-4 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Pending approvals</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{approvals.length}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            <div className="rounded-[24px] border bg-background/90 px-4 py-3 text-right shadow-sm">
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
              <p className="text-xs text-muted-foreground">System overview</p>
            </div>

            <div className="flex gap-2">
            <Button className="gap-2 rounded-2xl px-5 py-6 text-sm font-semibold shadow-sm" onClick={() => setOpenRegister(true)}>
              <Plus className="h-4 w-4" />
              Register Doctor
            </Button>

            <Button
              variant="outline"
              className="gap-2 rounded-2xl px-5 py-6 text-sm shadow-sm"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Pending Access Requests</h2>
            <Button variant="outline" size="sm" onClick={fetchApprovals}>
              Refresh
            </Button>
          </div>

          {approvals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending requests.</p>
          ) : (
            <div className="space-y-3">
              {approvals.map((req) => (
                <div key={req._id} className="rounded-xl border p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{requestTypeLabel[req.requestType]}</p>
                      <p className="text-xs text-muted-foreground">
                        Requested by {req.requestedBy?.name || req.requestedBy?.email || 'Doctor'}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {req.createdAt ? new Date(req.createdAt).toLocaleString() : ''}
                    </p>
                  </div>

                  {req.requestType === 'patient_create' && (
                    <p className="text-sm text-muted-foreground">
                      Patient: {req.payload?.name || '-'} ({req.payload?.email || '-'})
                    </p>
                  )}

                  {(req.requestType === 'guide_create' || req.requestType === 'guide_update' || req.requestType === 'guide_delete') && (
                    <p className="text-sm text-muted-foreground">
                      Guide: {req.payload?.guideTitle || req.payload?.title || req.payload?.guideId || '-'}
                    </p>
                  )}

                  {req.requestNote && (
                    <p className="text-sm">
                      <span className="font-medium">Doctor note:</span> {req.requestNote}
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => openDecisionDialog(req._id, 'approve')}
                      disabled={processingId === req._id}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => openDecisionDialog(req._id, 'reject')}
                      disabled={processingId === req._id}
                    >
                      <X className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} onClick={() => navigate(`/admin/doctors/${doctor.id}`)} />
          ))}
        </div>

        {doctors.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12">
            <p className="text-muted-foreground">No doctors registered yet</p>
            <Button variant="link" onClick={() => setOpenRegister(true)}>
              Register first doctor
            </Button>
          </div>
        )}

        <RegisterDoctorDialog
          open={openRegister}
          onOpenChange={setOpenRegister}
          onDoctorRegistered={handleDoctorRegistered}
        />

        <Dialog open={decisionDialogOpen} onOpenChange={setDecisionDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {pendingDecision?.action === 'approve' ? 'Approve Request' : 'Reject Request'}
              </DialogTitle>
              {!skipAdminNote && (
                <DialogDescription>
                  Add an optional admin note for this decision.
                </DialogDescription>
              )}
            </DialogHeader>

            {!skipAdminNote && (
              <Textarea
                value={adminNoteDraft}
                onChange={(e) => setAdminNoteDraft(e.target.value)}
                placeholder={
                  pendingDecision?.action === 'approve'
                    ? 'Optional admin note for approval'
                    : 'Optional admin note for rejection'
                }
                rows={4}
              />
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDecisionDialogOpen(false);
                  setPendingDecision(null);
                  setAdminNoteDraft('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDecisionConfirm}
                disabled={!pendingDecision || processingId === pendingDecision.id}
              >
                {processingId === pendingDecision?.id ? 'Submitting...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
