import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Users, LogOut, Stethoscope, CalendarClock, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/config/api';

interface Doctor {
  _id: string;
  name: string;
  email: string;
  specialty?: string;
}

interface AppointmentHistory {
  id?: string;
  _id?: string;
  patientName?: string;
  date?: string;
  time?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string;
}

interface ApprovalHistory {
  _id: string;
  requestType: 'patient_create' | 'guide_update' | 'guide_delete';
  status: 'pending' | 'approved' | 'rejected';
  requestNote?: string;
  adminNote?: string;
  decisionAt?: string;
  createdAt?: string;
  payload?: any;
}

const approvalTypeLabel: Record<ApprovalHistory['requestType'], string> = {
  patient_create: 'Patient Create',
  guide_update: 'Guide Edit',
  guide_delete: 'Guide Delete',
};

export default function AdminDoctorProfile() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [patientCount, setPatientCount] = useState(0);
  const [appointments, setAppointments] = useState<AppointmentHistory[]>([]);
  const [approvals, setApprovals] = useState<ApprovalHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const parseErrorMessage = (data: any, fallback: string) =>
    data?.message || data?.error || fallback;

  const fetchDoctorApprovals = async (id: string) => {
    const compat = await fetch(`${API_BASE}/api/auth/doctor/${id}/approval-history`);
    const compatData = await compat.json().catch(() => null);
    if (compat.ok && compatData?.success) {
      return compatData.requests || [];
    }

    const primary = await fetch(`${API_BASE}/api/approvals/doctor/${id}`);
    const primaryData = await primary.json().catch(() => null);
    if (primary.ok && primaryData?.success) {
      return primaryData.requests || [];
    }

    const fallback = await fetch(`${API_BASE}/api/auth/approvals/doctor/${id}`);
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

  const statusClass = (status?: string) => {
    if (status === 'approved' || status === 'completed') return 'bg-green-100 text-green-700';
    if (status === 'rejected') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  };

  const sortedAppointments = useMemo(
    () => [...appointments].sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))),
    [appointments]
  );

  useEffect(() => {
    if (!doctorId) return;

    const fetchDoctorData = async () => {
      try {
        setLoading(true);

        const [doctorRes, patientRes, appointmentRes] = await Promise.all([
          fetch(`${API_BASE}/api/auth/admin/doctors`),
          fetch(`${API_BASE}/api/auth/doctor/patients/${doctorId}`),
          fetch(`${API_BASE}/api/appointments/doctor/${doctorId}`),
        ]);

        const [doctorData, patientData, appointmentData] = await Promise.all([
          doctorRes.json(),
          patientRes.json(),
          appointmentRes.json(),
        ]);

        if (!doctorRes.ok || !doctorData.success) {
          throw new Error(doctorData.message || 'Failed to fetch doctors');
        }

        const foundDoctor = doctorData.doctors.find((d: Doctor) => d._id === doctorId);
        if (!foundDoctor) throw new Error('Doctor not found');
        setDoctor(foundDoctor);

        if (!patientRes.ok || !patientData.success) {
          throw new Error(patientData.message || 'Failed to fetch patients');
        }
        setPatientCount((patientData.patients || []).length);

        if (appointmentRes.ok && appointmentData.success) {
          setAppointments(appointmentData.appointments || []);
        } else {
          setAppointments([]);
        }

        const approvalRows = await fetchDoctorApprovals(doctorId);
        setApprovals(approvalRows);
      } catch (error: any) {
        console.error(error);
        toast({
          title: 'Error',
          description: error?.message || 'Failed to load doctor profile',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [doctorId, toast]);

  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Loading doctor profile...</div>;
  }

  if (!doctor) {
    return <div className="p-6 text-center text-muted-foreground">Doctor not found</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-primary/10 p-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">Doctor Profile</h1>
            <p className="text-muted-foreground">View doctor details, appointments, and approvals</p>
          </div>

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <Stethoscope className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{doctor.name}</h2>
                <p className="text-sm text-muted-foreground">{doctor.specialty || '-'}</p>
                <p className="text-sm text-muted-foreground">{doctor.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" />
              <span>{patientCount} patients assigned</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="gap-2" onClick={() => navigate('/admin/dashboard')}>
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>

              <Button className="gap-2" onClick={() => navigate(`/admin/doctors/${doctor._id}/patients`)}>
                <Users className="h-4 w-4" />
                View Patients
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Appointment History</h3>
            </div>

            {sortedAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No appointment history for this doctor.</p>
            ) : (
              <div className="space-y-3">
                {sortedAppointments.map((a) => (
                  <div key={a._id || a.id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{a.patientName || 'Unknown patient'}</p>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(a.status)}`}>
                        {String(a.status || 'pending')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {a.date || '-'} {a.time ? `at ${a.time}` : ''}
                    </p>
                    {!!a.notes && <p className="text-sm mt-2">Notes: {a.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Approval History</h3>
            </div>

            {approvals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No approval requests by this doctor.</p>
            ) : (
              <div className="space-y-3">
                {approvals.map((r) => (
                  <div key={r._id} className="rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{approvalTypeLabel[r.requestType]}</p>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(r.status)}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Requested: {r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}
                    </p>
                    {r.decisionAt && (
                      <p className="text-sm text-muted-foreground">
                        Decided: {new Date(r.decisionAt).toLocaleString()}
                      </p>
                    )}
                    {r.requestNote && <p className="text-sm mt-2">Doctor note: {r.requestNote}</p>}
                    {r.adminNote && <p className="text-sm">Admin note: {r.adminNote}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
