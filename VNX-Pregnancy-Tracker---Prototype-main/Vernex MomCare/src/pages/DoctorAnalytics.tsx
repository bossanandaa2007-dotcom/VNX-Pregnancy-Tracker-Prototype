import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { API_BASE } from "@/config/api";

interface DoctorPatient {
  id: string;
  name: string;
  week: number;
  risk: "normal" | "attention" | "high-risk";
}

const mapApiPatient = (p: any): DoctorPatient => ({
  id: p._id || p.id,
  name: p.name || "Unknown Patient",
  week: Number(p.gestationalWeek || 1),
  risk: (p.riskStatus || "normal") as DoctorPatient["risk"],
});

export default function DoctorAnalytics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [loading, setLoading] = useState(false);

  const getRiskStyles = (risk: DoctorPatient["risk"]) => {
    switch (risk) {
      case "normal":
        return "bg-success/10 text-success";
      case "attention":
        return "bg-warning/10 text-warning";
      case "high-risk":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const riskLabel = (risk: DoctorPatient["risk"]) => {
    if (risk === "high-risk") return "high";
    return risk;
  };

  useEffect(() => {
    const fetchPatients = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/doctor/patients/${user.id}`);
        const data = await res.json();

        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "Failed to load patients");
        }

        setPatients((data.patients || []).map(mapApiPatient));
      } catch (error: any) {
        console.error("Doctor analytics fetch error:", error);
        toast({
          title: "Error",
          description: error?.message || "Failed to load patients",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [user?.id]);

  const sortedPatients = useMemo(
    () => [...patients].sort((a, b) => b.week - a.week),
    [patients]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Patient Analytics</h1>
          <p className="text-muted-foreground">
            Select a patient to view detailed health analytics
          </p>
        </div>

        {loading && sortedPatients.length === 0 ? (
          <div className="rounded-xl border p-6 text-sm text-muted-foreground">
            Loading patients...
          </div>
        ) : sortedPatients.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedPatients.map((patient) => (
              <Card
                key={patient.id}
                onClick={() => navigate(`/doctor/analytics/${patient.id}`)}
                className="cursor-pointer border transition hover:border-primary hover:shadow-md"
              >
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold leading-none">{patient.name}</p>
                        <p className="text-xs text-muted-foreground">Ongoing Patient</p>
                      </div>
                    </div>

                    <Badge className={getRiskStyles(patient.risk)}>
                      {riskLabel(patient.risk)}
                    </Badge>
                  </div>

                  <div className="rounded-lg bg-muted/40 px-4 py-3">
                    <p className="text-sm text-muted-foreground">Pregnancy Week</p>
                    <p className="text-lg font-semibold">Week {patient.week}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border p-6 text-sm text-muted-foreground">
            No patients found for this doctor.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
