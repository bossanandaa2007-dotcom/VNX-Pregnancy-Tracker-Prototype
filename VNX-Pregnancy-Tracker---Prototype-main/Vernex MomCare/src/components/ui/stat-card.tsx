import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  variant?: 'default' | 'primary' | 'warning' | 'danger';
  className?: string;
}

const variantStyles = {
  default: 'bg-card',
  primary: 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20',
  warning: 'bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20',
  danger: 'bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20',
};

const iconVariantStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/20 text-primary',
  warning: 'bg-warning/20 text-warning',
  danger: 'bg-destructive/20 text-destructive',
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-6 transition-all duration-300 hover:shadow-lg animate-fade-in',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'text-sm font-medium',
                  trend.positive ? 'text-success' : 'text-destructive'
                )}
              >
                {trend.positive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl',
            iconVariantStyles[variant]
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
