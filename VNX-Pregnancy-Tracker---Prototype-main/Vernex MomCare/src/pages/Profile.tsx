import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, Heart, Shield, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from "@/config/api";

type PatientProfile = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  age?: number;
  pregnancyStartDate?: string;
  gestationalWeek?: number;
  contactPhone?: string;
  doctorId?: string | { _id?: string; name?: string; email?: string };
  riskStatus?: 'normal' | 'attention' | 'high-risk';
};

type DoctorProfile = {
  _id: string;
  name: string;
  email: string;
  specialty?: string;
  phone?: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isDoctor = user?.role === 'doctor';

  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pregnancy = useMemo(() => {
    const now = new Date();
    const conceptionDate = patient?.pregnancyStartDate ? new Date(patient.pregnancyStartDate) : null;
    if (!conceptionDate || Number.isNaN(conceptionDate.getTime())) {
      return { week: '-', dueDate: '-' };
    }

    const elapsedDays = Math.max(0, Math.floor((now.getTime() - conceptionDate.getTime()) / DAY_MS));
    const week = Math.min(40, Math.max(1, Math.floor(elapsedDays / 7) + 1));
    const dueDate = new Date(conceptionDate.getTime() + 280 * DAY_MS);

    return {
      week: `Week ${week} of 40`,
      dueDate: dueDate.toLocaleDateString('en-IN'),
    };
  }, [patient?.pregnancyStartDate]);

  useEffect(() => {
    const loadPatient = async () => {
      if (!user?.id || user.role !== 'patient') return;
      setLoading(true);
      setError('');

      try {
        let data: any = null;
        const byIdRes = await fetch(`${API_BASE}/api/auth/patient/${user.id}`);

        if (byIdRes.ok) {
          data = await byIdRes.json();
        } else if (user.email) {
          const byEmailRes = await fetch(
            `${API_BASE}/api/auth/patient/by-email/${encodeURIComponent(user.email)}`
          );
          if (byEmailRes.ok) {
            data = await byEmailRes.json();
          }
        }

        if (data?.success && data?.patient) {
          setPatient(data.patient);
          return;
        }

        setPatient((user as unknown as PatientProfile) || null);
        setError('Using basic profile data. Restart backend for full sync.');
      } catch (err) {
        console.error('Profile patient fetch error:', err);
        setPatient((user as unknown as PatientProfile) || null);
        setError('Using basic profile data. Restart backend for full sync.');
      } finally {
        setLoading(false);
      }
    };

    loadPatient();
  }, [user?.id, user?.email, user?.role]);

  useEffect(() => {
    const loadDoctor = async () => {
      if (!patient?.doctorId) return;

      try {
        if (typeof patient.doctorId === 'object' && patient.doctorId?.name) {
          setDoctor({
            _id: patient.doctorId._id || '',
            name: patient.doctorId.name,
            email: patient.doctorId.email || '',
          });
          return;
        }

        if (typeof patient.doctorId === 'string' && patient.doctorId) {
          const res = await fetch(`${API_BASE}/api/auth/doctor/${patient.doctorId}`);
          const data = await res.json();
          if (res.ok && data?.success && data?.doctor) {
            setDoctor(data.doctor);
          }
        }
      } catch (err) {
        console.error('Profile doctor fetch error:', err);
      }
    };

    if (!isDoctor) loadDoctor();
  }, [patient?.doctorId, isDoctor]);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground">
            {isDoctor ? 'Manage your doctor profile' : 'View your pregnancy profile'}
          </p>
          {loading && <p className="text-xs text-muted-foreground mt-1">Loading profile...</p>}
          {!!error && <p className="text-xs text-muted-foreground mt-1">{error}</p>}
        </div>

        <Card className="overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20" />
          <CardContent className="relative pt-0">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-background bg-primary/10">
                <User className="h-10 w-10 text-primary" />
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{user?.name}</h2>
                  <Badge variant="secondary" className="capitalize">
                    {user?.role}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl"
                onClick={() => navigate('/profile/edit')}
              >
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                <Input value={user?.name || ''} readOnly className="bg-muted/50 rounded-xl" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Email Address</Label>
                <Input value={user?.email || ''} readOnly className="bg-muted/50 rounded-xl" />
              </div>

              {!isDoctor && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Age</Label>
                    <Input value={patient?.age ?? '-'} readOnly className="bg-muted/50 rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Phone Number</Label>
                    <Input value={patient?.contactPhone || '-'} readOnly className="bg-muted/50 rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Risk Status</Label>
                    <Input
                      value={patient?.riskStatus ? patient.riskStatus : 'normal'}
                      readOnly
                      className="bg-muted/50 rounded-xl capitalize"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {isDoctor ? (
                  <>
                    <Shield className="h-5 w-5 text-primary" />
                    Professional Information
                  </>
                ) : (
                  <>
                    <Heart className="h-5 w-5 text-primary" />
                    Pregnancy Details
                  </>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              {!isDoctor ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Pregnancy Start Date</Label>
                    <Input
                      value={
                        patient?.pregnancyStartDate
                          ? new Date(patient.pregnancyStartDate).toLocaleDateString('en-IN')
                          : '-'
                      }
                      readOnly
                      className="bg-muted/50 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Expected Due Date</Label>
                    <Input value={pregnancy.dueDate} readOnly className="bg-muted/50 rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Current Week</Label>
                    <Input value={pregnancy.week} readOnly className="bg-muted/50 rounded-xl" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Assigned Doctor</Label>
                    <Input value={doctor?.name || '-'} readOnly className="bg-muted/50 rounded-xl" />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Specialty</Label>
                    <Input value={(user as any)?.specialty || '-'} readOnly className="bg-muted/50 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Phone Number</Label>
                    <Input value={(user as any)?.phone || '-'} readOnly className="bg-muted/50 rounded-xl" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl bg-accent/30 p-4">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-accent/30 p-4">
                <Phone className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">
                    {isDoctor ? (user as any)?.phone || '-' : patient?.contactPhone || '-'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
