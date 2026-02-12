import { Appointment } from '@/types/appointment';

export const mockAppointments: Appointment[] = [
  {
    id: 1,
    patientName: 'Emily',
    doctorName: 'Dr. Sarah Mitchell',
    date: '2025-03-10',
    time: '10:30 AM',
    notes: 'Routine checkup',
    status: 'pending',
  },
  {
    id: 2,
    patientName: 'Emily',
    doctorName: 'Dr. Sarah Mitchell',
    date: '2025-03-15',
    time: '11:00 AM',
    status: 'approved',
  },
];
