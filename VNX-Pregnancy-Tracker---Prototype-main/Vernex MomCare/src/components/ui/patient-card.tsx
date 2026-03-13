import { Patient } from '@/types';
import { cn } from '@/lib/utils';
import { User, Calendar, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PatientCardProps {
  patient: Patient;
  onClick?: () => void;
  onChatClick?: (patient: Patient) => void;
}

const riskStatusConfig = {
  'normal': {
    label: 'Normal',
    icon: CheckCircle,
    className: 'bg-success/10 text-success border-success/20',
  },
  'attention': {
    label: 'Attention',
    icon: AlertCircle,
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  'high-risk': {
    label: 'High Risk',
    icon: AlertTriangle,
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
};

export function PatientCard({ patient, onClick, onChatClick }: PatientCardProps) {
  const riskConfig = riskStatusConfig[patient.riskStatus];
  const RiskIcon = riskConfig.icon;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all duration-300',
        'hover:shadow-lg hover:border-primary/30 cursor-pointer animate-fade-in'
      )}
      onClick={onClick}
    >
      {/* Risk Indicator */}
      <div className="absolute right-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-transparent to-transparent">
        <div
          className={cn(
            'h-full w-1/3 ml-auto',
            patient.riskStatus === 'normal' && 'bg-success',
            patient.riskStatus === 'attention' && 'bg-warning',
            patient.riskStatus === 'high-risk' && 'bg-destructive'
          )}
        />
      </div>

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <User className="h-6 w-6 text-primary" />
        </div>

        {/* Info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {patient.name}
            </h3>
            <Badge variant="outline" className={cn('gap-1', riskConfig.className)}>
              <RiskIcon className="h-3 w-3" />
              {riskConfig.label}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Week {patient.gestationalWeek}
            </span>
            <span>Age: {patient.age}</span>
          </div>

          {patient.medicalNotes && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {patient.medicalNotes}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          View Details
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onChatClick?.(patient);
          }}
        >
          Chat
        </Button>
      </div>
    </div>
  );
}
