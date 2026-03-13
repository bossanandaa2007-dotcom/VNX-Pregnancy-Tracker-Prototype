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
  status: AppointmentStatus;
}
