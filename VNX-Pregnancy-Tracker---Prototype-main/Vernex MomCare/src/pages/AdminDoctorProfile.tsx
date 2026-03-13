import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Users, LogOut, Stethoscope } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from "@/config/api";

interface Doctor {
  _id: string;
  name: string;
  email: string;
  specialty?: string;
}

export default function AdminDoctorProfile() {
  const { doctorId } = useParams(); // MongoDB _id
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [patientCount, setPatientCount] = useState(0);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH DOCTOR + PATIENT COUNT ================= */
  useEffect(() => {
    if (!doctorId) return;

    const fetchDoctorData = async () => {
      try {
        setLoading(true);

        // 1️⃣ Fetch all doctors, find matching one
        const doctorRes = await fetch(
          `${API_BASE}/api/auth/admin/doctors`
        );
        const doctorData = await doctorRes.json();

        if (!doctorRes.ok || !doctorData.success) {
          throw new Error('Failed to fetch doctors');
        }

        const foundDoctor = doctorData.doctors.find(
          (d: Doctor) => d._id === doctorId
        );

        if (!foundDoctor) {
          throw new Error('Doctor not found');
        }

        setDoctor(foundDoctor);

        // 2️⃣ Fetch patients for this doctor
        const patientRes = await fetch(
          `${API_BASE}/api/auth/doctor/patients/${doctorId}`
        );
        const patientData = await patientRes.json();

        if (!patientRes.ok || !patientData.success) {
          throw new Error('Failed to fetch patients');
        }

        setPatientCount(patientData.patients.length);

      } catch (error) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'Failed to load doctor profile',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorData();
  }, [doctorId]);

  if (loading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading doctor profile...
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Doctor not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-primary/10 p-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              Doctor Profile
            </h1>
            <p className="text-muted-foreground">
              View doctor details and patient assignments
            </p>
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

        {/* Doctor Card */}
        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <Stethoscope className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{doctor.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {doctor.specialty || '—'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {doctor.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" />
              <span>{patientCount} patients assigned</span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => navigate('/admin/dashboard')}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>

              <Button
                className="gap-2"
                onClick={() =>
                  navigate(`/admin/doctors/${doctor._id}/patients`)
                }
              >
                <Users className="h-4 w-4" />
                View Patients
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
