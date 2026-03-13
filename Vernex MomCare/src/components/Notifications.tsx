import { Card } from '@/components/ui/card';

export function Notifications() {
  return (
    <Card className="p-4 bg-accent/30">
      <p className="text-sm font-medium">
        🔔 Reminder
      </p>
      <p className="text-xs text-muted-foreground">
        Your appointment with Dr. Sarah Mitchell is tomorrow at 10:30 AM
      </p>
    </Card>
  );
}
