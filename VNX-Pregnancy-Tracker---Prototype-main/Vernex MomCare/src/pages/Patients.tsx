import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { PatientCard } from '@/components/ui/patient-card';
import { PatientRegistrationDialog } from '@/components/dashboard/PatientRegistrationDialog';
import { PatientDetailDialog } from '@/components/dashboard/PatientDetailDialog';
import { Patient } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Filter, Users } from 'lucide-react';
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

export default function Patients() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

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
    const fetchPatients = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/doctor/patients/${user.id}`);
        const data = await res.json();

        if (!res.ok || !data?.success) {
          throw new Error(data?.message || 'Failed to load patients');
        }

        setPatients((data.patients || []).map(mapApiPatient));
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

    fetchPatients();
  }, [user?.id]);

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'all' || p.riskStatus === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const handlePatientRegistered = (newPatient: Patient) => {
    const mapped = mapApiPatient(newPatient);
    setPatients((prev) => [...prev, mapped]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            </SelectContent>
          </Select>
        </div>

        {/* Patient Grid */}
        {loading ? (
          <div className="rounded-2xl border border-border p-8 text-center text-muted-foreground">
            Loading patients...
          </div>
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
