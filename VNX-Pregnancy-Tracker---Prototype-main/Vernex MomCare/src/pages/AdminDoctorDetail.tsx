import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from "@/config/api";

interface PatientItem {
  _id: string;
  name: string;
  gestationalWeek: number;
  riskStatus: string;
}

export default function AdminDoctorDetail() {
  const { id: doctorId } = useParams(); // MongoDB doctor _id
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();

  const [patients, setPatients] = useState<PatientItem[]>([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH PATIENTS ================= */
  useEffect(() => {
    if (!doctorId) return;

    const fetchPatients = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `${API_BASE}/api/auth/doctor/patients/${doctorId}`
        );

        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to load patients');
        }

        setPatients(data.patients);
      } catch (error) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'Failed to load patients',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [doctorId, toast]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col gap-4 rounded-2xl bg-primary/10 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">
                Doctor Patients
              </h1>
              <p className="text-muted-foreground">
                Patients handled by selected doctor
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

          <Button
            variant="ghost"
            className="w-fit gap-2"
            onClick={() => navigate('/admin/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Dashboard
          </Button>
        </div>

        {/* Patients List */}
        <div className="space-y-4">
          {loading && (
            <p className="text-muted-foreground">Loading patients...</p>
          )}

          {!loading && patients.length === 0 && (
            <p className="text-muted-foreground text-center">
              No patients assigned to this doctor yet
            </p>
          )}

          {patients.map((p) => (
            <Card key={p._id} className="hover:shadow-sm transition">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>

                <div className="flex-1">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Week {p.gestationalWeek}
                  </p>
                </div>

                <span
                  className={`text-xs font-medium rounded-full px-3 py-1 ${
                    p.riskStatus === 'high-risk'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {p.riskStatus === 'high-risk' ? 'High Risk' : 'Normal'}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
}
