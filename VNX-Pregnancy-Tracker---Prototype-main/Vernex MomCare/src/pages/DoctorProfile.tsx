import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User,
  Mail,
  Phone,
  Shield,
  Hospital,
  Briefcase,
  Edit2,
  Users,
  CalendarDays,
  LogOut,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from "@/config/api";

type DoctorProfileShape = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  specialty?: string;
  phone?: string;
  qualification?: string;
  experience?: string;
  hospital?: string;
  location?: string;
};

export default function DoctorProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [doctor, setDoctor] = useState<DoctorProfileShape | null>(null);
  const [totalPatients, setTotalPatients] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadDoctorProfile = async () => {
      if (!user?.id || user.role !== 'doctor') return;
      setLoading(true);
      try {
        const [doctorRes, patientsRes] = await Promise.all([
          fetch(`${API_BASE}/api/auth/doctor/${user.id}`),
          fetch(`${API_BASE}/api/auth/doctor/patients/${user.id}`),
        ]);

        const doctorData = doctorRes.ok ? await doctorRes.json() : null;
        const patientsData = patientsRes.ok ? await patientsRes.json() : null;

        if (doctorData?.success) {
          setDoctor(doctorData.doctor as DoctorProfileShape);
        } else {
          setDoctor(null);
        }

        if (patientsData?.success && Array.isArray(patientsData.patients)) {
          setTotalPatients(patientsData.patients.length);
        } else {
          setTotalPatients(0);
        }
      } catch (error) {
        console.error('Doctor profile fetch error:', error);
        setDoctor(null);
        setTotalPatients(0);
        toast({
          title: 'Error',
          description: 'Unable to load doctor profile details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadDoctorProfile();
  }, [toast, user?.id, user?.role]);

  const doctorData = useMemo(
    () => ({
      specialization: doctor?.specialty || 'Not set',
      qualification: doctor?.qualification || 'Not set',
      experience: doctor?.experience || 'Not set',
      hospital: doctor?.hospital || 'Not set',
      phone: doctor?.phone || 'Not set',
      location: doctor?.location || 'Not set',
      totalPatients,
      ongoingPatients: totalPatients,
      appointmentsToday: 0,
    }),
    [doctor, totalPatients]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Doctor Profile</h1>
          <p className="text-muted-foreground">
            Manage your professional information
          </p>
          {loading && <p className="text-xs text-muted-foreground mt-1">Loading profile...</p>}
        </div>

        {/* Profile Card */}
        <Card className="overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20" />
          <CardContent className="relative pt-0">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-background bg-primary/10">
                <User className="h-10 w-10 text-primary" />
              </div>

              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{doctor?.name || user?.name}</h2>
                  <Badge variant="secondary">Doctor</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {doctor?.email || user?.email}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl"
                onClick={() => navigate('/doctor/profile/edit')}
              >
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Sections */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Professional Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Professional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Specialization" value={doctorData.specialization} />
              <Field label="Qualification" value={doctorData.qualification} />
              <Field label="Experience" value={doctorData.experience} />
              <Field label="Hospital / Clinic" value={doctorData.hospital} />
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ContactItem icon={Mail} label="Email" value={doctor?.email || user?.email || 'Not set'} />
              <ContactItem icon={Phone} label="Phone" value={doctorData.phone} />
              <ContactItem icon={Hospital} label="Location" value={doctorData.location} />
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={Users} label="Total Patients" value={doctorData.totalPatients} />
          <StatCard icon={Briefcase} label="Ongoing Patients" value={doctorData.ongoingPatients} />
          <StatCard icon={CalendarDays} label="Appointments Today" value={doctorData.appointmentsToday} />
        </div>

        {/* Logout */}
        <Card>
          <CardContent className="p-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}

/* ---------------- SMALL COMPONENTS ---------------- */

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} readOnly className="bg-muted/50 rounded-xl" />
    </div>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-accent/30 p-4">
      <Icon className="h-5 w-5 text-primary" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
