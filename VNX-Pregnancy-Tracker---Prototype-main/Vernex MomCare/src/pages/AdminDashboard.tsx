import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogOut, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { DoctorCard } from '@/components/ui/doctor-card';
import { RegisterDoctorDialog, Doctor } from '@/components/admin/RegisterDoctorDialog';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from "@/config/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [openRegister, setOpenRegister] = useState(false);

  /* ================= FETCH DOCTORS + PATIENT COUNT ================= */
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        // 1️⃣ Fetch doctors
        const res = await fetch(`${API_BASE}/api/auth/admin/doctors`);
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error('Failed to fetch doctors');
        }

        // 2️⃣ For each doctor, fetch patient count
        const doctorsWithCount: Doctor[] = await Promise.all(
          data.doctors.map(async (doc: any) => {
            try {
              const patientRes = await fetch(
                `${API_BASE}/api/auth/doctor/patients/${doc._id}`
              );
              const patientData = await patientRes.json();

              return {
                id: doc._id,
                name: doc.name,
                email: doc.email,
                specialty: doc.specialty,
                phone: doc.phone,
                patientCount: patientData.success
                  ? patientData.patients.length
                  : 0,
              };
            } catch {
              return {
                id: doc._id,
                name: doc.name,
                email: doc.email,
                specialty: doc.specialty,
                phone: doc.phone,
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

    fetchDoctors();
  }, []);

  const handleDoctorRegistered = (doctor: Doctor) => {
    setDoctors((prev) => [...prev, doctor]);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-primary/10 p-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage doctors and monitor patient assignments
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              className="gap-2 rounded-xl"
              onClick={() => setOpenRegister(true)}
            >
              <Plus className="h-4 w-4" />
              Register Doctor
            </Button>

            <Button
              variant="outline"
              className="gap-2 rounded-xl"
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

        {/* Doctors Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onClick={() => navigate(`/admin/doctors/${doctor.id}`)}
            />
          ))}
        </div>

        {/* Empty State */}
        {doctors.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed p-12">
            <p className="text-muted-foreground">
              No doctors registered yet
            </p>
            <Button
              variant="link"
              onClick={() => setOpenRegister(true)}
            >
              Register first doctor
            </Button>
          </div>
        )}

        {/* Register Doctor Dialog */}
        <RegisterDoctorDialog
          open={openRegister}
          onOpenChange={setOpenRegister}
          onDoctorRegistered={handleDoctorRegistered}
        />
      </div>
    </div>
  );
}
