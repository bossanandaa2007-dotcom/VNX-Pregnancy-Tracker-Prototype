import { Users, Stethoscope } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DoctorCardProps {
  doctor: {
    id: string;
    name: string;
    email: string;
    specialty: string;
    patientCount: number;
  };
  onClick?: () => void;
}

export function DoctorCard({ doctor, onClick }: DoctorCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-2xl border transition hover:shadow-md hover:border-primary/40'
      )}
    >
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{doctor.name}</p>
              <p className="text-xs text-muted-foreground">
                {doctor.specialty}
              </p>
            </div>
          </div>
        </div>

        {/* Email */}
        <p className="text-sm text-muted-foreground truncate">
          {doctor.email}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between rounded-lg bg-accent/30 px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary" />
            <span>{doctor.patientCount} patients</span>
          </div>

          <span className="text-xs text-primary font-medium">
            View Profile →
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
