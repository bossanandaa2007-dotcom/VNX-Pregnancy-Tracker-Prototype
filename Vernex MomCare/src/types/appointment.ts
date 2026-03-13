export type AppointmentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed';


export interface Appointment {
  id: string | number;
  patientName: string;
  doctorName: string;
  patientId?: string;
  doctorId?: string;
  date: string;
  time: string;
  notes?: string;
  patientNotes?: string;
  doctorNotes?: string;
  status: AppointmentStatus;
  completedAt?: string | null;
}
