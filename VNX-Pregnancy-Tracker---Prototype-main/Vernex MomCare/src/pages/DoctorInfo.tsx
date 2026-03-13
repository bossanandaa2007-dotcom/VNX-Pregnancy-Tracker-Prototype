import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { User, Stethoscope, Phone, Mail, Clock, Hospital } from 'lucide-react';
import { API_BASE } from "@/config/api";

type DoctorShape = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  specialty?: string;
  phone?: string;
};

type PatientShape = {
  _id?: string;
  id?: string;
  doctorId?: string | DoctorShape;
};

const DEFAULT_HOSPITAL = 'VNX Medical Center';
const DEFAULT_AVAILABILITY = ['Mon - Fri: 10:00 AM - 4:00 PM', 'Saturday: 10:00 AM - 1:00 PM'];

export default function DoctorInfo() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doctor, setDoctor] = useState<DoctorShape | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const doctorProfile = useMemo(() => {
    if (!doctor) return null;
    return {
      name: doctor.name || 'Assigned Doctor',
      specialization: doctor.specialty || 'Obstetrics & Gynecology',
      experience: 'Experienced specialist',
      hospital: DEFAULT_HOSPITAL,
      phone: doctor.phone || 'Not available',
      email: doctor.email || 'Not available',
      availability: DEFAULT_AVAILABILITY,
    };
  }, [doctor]);

  useEffect(() => {
    const loadDoctor = async () => {
      if (!user?.id || user.role !== 'patient') return;
      setLoading(true);
      setError('');

      try {
        let patientData: any = null;

        const byIdRes = await fetch(`${API_BASE}/api/auth/patient/${user.id}`);
        if (byIdRes.ok) {
          patientData = await byIdRes.json();
        } else if (user.email) {
          const byEmailRes = await fetch(
            `${API_BASE}/api/auth/patient/by-email/${encodeURIComponent(user.email)}`
          );
          if (byEmailRes.ok) {
            patientData = await byEmailRes.json();
          }
        }

        const patient = (patientData?.success ? patientData.patient : null) as PatientShape | null;
        const doctorId = patient?.doctorId || (user as any)?.doctorId;

        if (!doctorId) {
          setDoctor(null);
          setError('No assigned doctor found.');
          return;
        }

        if (typeof doctorId === 'object') {
          setDoctor(doctorId);
          return;
        }

        const doctorRes = await fetch(`${API_BASE}/api/auth/doctor/${doctorId}`);
        const doctorData = await doctorRes.json();
        if (doctorRes.ok && doctorData?.success) {
          setDoctor(doctorData.doctor as DoctorShape);
          return;
        }

        setDoctor(null);
        setError('Unable to load doctor details.');
      } catch (err) {
        console.error('Doctor info fetch error:', err);
        setDoctor(null);
        setError('Unable to load doctor details.');
      } finally {
        setLoading(false);
      }
    };

    loadDoctor();
  }, [user?.id, user?.email, user?.role]);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Doctor Information</h1>
          <p className="text-muted-foreground">View details of your assigned doctor</p>
          {loading && <p className="text-xs text-muted-foreground mt-1">Loading doctor details...</p>}
          {!!error && <p className="text-xs text-muted-foreground mt-1">{error}</p>}
        </div>

        <Card>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10">
              <User className="h-12 w-12 text-primary" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{doctorProfile?.name || 'Not assigned'}</h2>
                <Badge variant="secondary">Assigned Doctor</Badge>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Stethoscope className="h-4 w-4" />
                {doctorProfile?.specialization || '-'}
              </div>

              <p className="text-sm text-muted-foreground">{doctorProfile?.experience || '-'}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="h-5 w-5 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{doctorProfile?.phone || '-'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{doctorProfile?.email || '-'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Hospital className="h-5 w-5 text-primary" />
                Hospital & Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Hospital className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{doctorProfile?.hospital || '-'}</span>
              </div>

              <div className="space-y-2">
                {(doctorProfile?.availability || DEFAULT_AVAILABILITY).map((slot, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Clock className="h-4 w-4" />
                    {slot}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button
              className="flex-1"
              disabled={!doctorProfile?.phone || doctorProfile.phone === 'Not available'}
              onClick={() => {
                if (!doctorProfile?.phone || doctorProfile.phone === 'Not available') return;
                window.location.href = `tel:${doctorProfile.phone.replace(/\s+/g, '')}`;
              }}
            >
              Call Doctor
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate('/chat')}>
              Message Doctor
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
