import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Appointment } from '@/types/appointment';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from "@/config/api";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
} from 'lucide-react';

type AppointmentApiShape = {
  _id?: string;
  id?: string;
  patientName?: string;
  patientId?: string;
  doctorName?: string;
  doctorId?: string;
  date?: string;
  time?: string;
  notes?: string;
  status?: Appointment['status'];
};

const formatMonth = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

const mapAppointment = (appt: AppointmentApiShape): Appointment => ({
  id: appt._id || appt.id || `${Date.now()}`,
  patientName: appt.patientName || 'Patient',
  doctorName: appt.doctorName || '',
  patientId: appt.patientId,
  doctorId: appt.doctorId,
  date: appt.date || '',
  time: appt.time || '',
  notes: appt.notes || '',
  status: appt.status || 'pending',
});

function EmptyPlaceholder({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

export default function DoctorAppointments() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadAppointments = async () => {
      if (!user?.id || user.role !== 'doctor') return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/appointments/doctor/${user.id}`);
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || 'Unable to load appointments');
        }
        setAppointments((data.appointments || []).map(mapAppointment));
      } catch (error: any) {
        console.error('Doctor appointments fetch error:', error);
        toast({
          title: 'Error',
          description: error?.message || 'Unable to load appointments',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadAppointments();
  }, [toast, user?.id, user?.role]);

  const updateStatus = async (
    id: string | number,
    status: 'approved' | 'rejected' | 'completed'
  ) => {
    try {
      const res = await fetch(`${API_BASE}/api/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Unable to update status');
      }

      const updated = mapAppointment(data.appointment);
      setAppointments((prev) => prev.map((a) => (String(a.id) === String(id) ? updated : a)));

      toast({
        title: 'Updated',
        description: `Appointment marked as ${status}`,
      });
    } catch (error: any) {
      console.error('Appointment status update error:', error);
      toast({
        title: 'Update failed',
        description: error?.message || 'Unable to update appointment status',
        variant: 'destructive',
      });
    }
  };

  const pending = useMemo(() => appointments.filter((a) => a.status === 'pending'), [appointments]);
  const todayAppointments = useMemo(
    () => appointments.filter((a) => a.status === 'approved' && a.date === today),
    [appointments, today]
  );
  const upcoming = useMemo(
    () => appointments.filter((a) => a.status === 'approved' && a.date > today),
    [appointments, today]
  );

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const appointmentsByDate = useMemo(
    () =>
      appointments.reduce<Record<string, Appointment[]>>((acc, appt) => {
        acc[appt.date] = acc[appt.date] || [];
        acc[appt.date].push(appt);
        return acc;
      }, {}),
    [appointments]
  );

  return (
    <DashboardLayout>
      <div className="max-w-5xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Appointments</h1>
            <p className="text-muted-foreground">Manage patient appointment requests and schedules</p>
            {loading && <p className="text-xs text-muted-foreground mt-1">Loading appointments...</p>}
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant={view === 'list' ? 'default' : 'outline'} onClick={() => setView('list')}>
              List
            </Button>
            <Button
              size="sm"
              variant={view === 'calendar' ? 'default' : 'outline'}
              onClick={() => setView('calendar')}
              className="gap-2"
            >
              <CalendarDays className="h-4 w-4" />
              Calendar
            </Button>
          </div>
        </div>

        {view === 'list' && (
          <div className="space-y-10">
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Pending Requests</h2>

              {pending.length > 0 ? (
                pending.map((appt) => (
                  <Card key={String(appt.id)} className="border-l-4 border-primary">
                    <CardContent className="p-5 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{appt.patientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {appt.date} · {appt.time}
                        </p>
                        <p className="text-xs text-warning">Awaiting approval</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateStatus(appt.id, 'approved')}>
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(appt.id, 'rejected')}>
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <EmptyPlaceholder text="No pending appointment requests." />
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Today</h2>

              {todayAppointments.length > 0 ? (
                todayAppointments.map((appt) => (
                  <Card key={String(appt.id)}>
                    <CardContent className="p-5 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{appt.patientName}</p>
                        <p className="text-sm text-muted-foreground">{appt.time}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => updateStatus(appt.id, 'completed')}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark Completed
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <EmptyPlaceholder text="No appointments scheduled for today." />
              )}
            </section>

            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Upcoming</h2>

              {upcoming.length > 0 ? (
                upcoming.map((appt) => (
                  <Card key={String(appt.id)}>
                    <CardContent className="p-5 flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{appt.patientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {appt.date} · {appt.time}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <EmptyPlaceholder text="No upcoming appointments." />
              )}
            </section>
          </div>
        )}

        {view === 'calendar' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>
                <ChevronLeft />
              </Button>

              <h2 className="text-lg font-semibold">{formatMonth(currentMonth)}</h2>

              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>
                <ChevronRight />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                const hasAppt = !!appointmentsByDate[dateStr];

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`rounded-xl border p-3 text-sm transition ${
                      hasAppt ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-accent'
                    } ${selectedDate === dateStr ? 'ring-2 ring-primary' : ''}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Appointments on {selectedDate}</p>

                {(appointmentsByDate[selectedDate] || []).length > 0 ? (
                  (appointmentsByDate[selectedDate] || []).map((appt) => (
                    <div
                      key={String(appt.id)}
                      className="rounded-lg bg-accent/40 p-3 flex justify-between text-sm"
                    >
                      <span>
                        {appt.time} · {appt.patientName}
                      </span>
                      <span className="capitalize text-xs">{appt.status}</span>
                    </div>
                  ))
                ) : (
                  <EmptyPlaceholder text="No appointments on this date." />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
