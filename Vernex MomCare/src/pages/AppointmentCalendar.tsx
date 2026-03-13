import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { mockAppointments } from '@/data/mockAppointments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AppointmentCalendar() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold">Appointment Calendar</h1>

        <Card>
          <CardHeader>
            <CardTitle>March 2025</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-7 gap-3 text-center">
            {Array.from({ length: 31 }, (_, i) => {
              const day = i + 1;
              const hasAppointment = mockAppointments.some((a) =>
                a.date.endsWith(`-${day.toString().padStart(2, '0')}`)
              );

              return (
                <div
                  key={day}
                  className={`rounded-lg border p-2 ${
                    hasAppointment ? 'bg-primary/10 text-primary' : ''
                  }`}
                >
                  {day}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
