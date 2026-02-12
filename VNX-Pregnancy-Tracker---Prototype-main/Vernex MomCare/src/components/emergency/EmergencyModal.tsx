import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from "@/config/api";

interface Props {
  open: boolean;
  onClose: () => void;
}

type DoctorShape = {
  _id?: string;
  id?: string;
  phone?: string;
};

type PatientShape = {
  _id?: string;
  id?: string;
  name?: string;
  contactPhone?: string;
  husbandName?: string;
  husbandPhone?: string;
  doctorId?: string | DoctorShape;
};

const AMBULANCE_NUMBER = '108';

const toTel = (value?: string) => (value || '').replace(/[^\d+]/g, '');

export function EmergencyModal({ open, onClose }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [doctorPhone, setDoctorPhone] = useState('');
  const [husbandPhone, setHusbandPhone] = useState('');
  const [husbandName, setHusbandName] = useState('Husband');

  useEffect(() => {
    const loadEmergencyContacts = async () => {
      if (!open || !user?.id || user.role !== 'patient') return;
      setLoading(true);
      try {
        const patientRes = await fetch(`${API_BASE}/api/auth/patient/${user.id}`);
        const patientData = patientRes.ok ? await patientRes.json() : null;
        const patient = (patientData?.success ? patientData.patient : null) as PatientShape | null;

        if (!patient) {
          throw new Error('Unable to load patient profile');
        }

        const doctorRef = patient.doctorId;
        if (typeof doctorRef === 'object') {
          setDoctorPhone(toTel(doctorRef.phone));
        } else if (doctorRef) {
          const doctorRes = await fetch(`${API_BASE}/api/auth/doctor/${doctorRef}`);
          const doctorData = doctorRes.ok ? await doctorRes.json() : null;
          if (doctorData?.success) {
            setDoctorPhone(toTel(doctorData.doctor?.phone));
          } else {
            setDoctorPhone('');
          }
        } else {
          setDoctorPhone('');
        }

         const name = (patient.husbandName || '').trim();
        setHusbandName(name || 'Husband');
        setHusbandPhone(toTel(patient.husbandPhone || patient.contactPhone || ''));
     


      } catch (error) {
        console.error('Emergency contacts fetch error:', error);
        setDoctorPhone('');
        setHusbandPhone('');
      } finally {
        setLoading(false);
      }
    };

    loadEmergencyContacts();
  }, [open, user?.id, user?.role]);

  const doctorLabel = useMemo(
    () => (loading ? 'Loading...' : doctorPhone ? 'Call Doctor' : 'Doctor not available'),
    [doctorPhone, loading]
  );
  const husbandLabel = useMemo(
    () =>
      loading
        ? 'Loading...'
        : husbandPhone
        ? `Call ${husbandName}`
        : `${husbandName} not available`,
    [husbandName, husbandPhone, loading]
  );

  const callNumber = (number: string, unavailableMessage: string) => {
    if (!number) {
      toast({
        title: 'Contact unavailable',
        description: unavailableMessage,
        variant: 'destructive',
      });
      return;
    }
    window.location.href = `tel:${number}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Emergency Assistance</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Button
            className="w-full"
            disabled={loading || !doctorPhone}
            onClick={() => callNumber(doctorPhone, 'Assigned doctor phone is not available')}
          >
            Call Doctor
          </Button>

          <Button className="w-full" onClick={() => callNumber(AMBULANCE_NUMBER, 'Ambulance number unavailable')}>
            Call Ambulance
          </Button>

          <Button
            className="w-full"
            disabled={loading || !husbandPhone}
            onClick={() => callNumber(husbandPhone, 'Emergency contact number is not available')}
          >
            {husbandLabel}
          </Button>

          {!loading && !doctorPhone && !husbandPhone && (
            <p className="text-xs text-muted-foreground">
              Add doctor or emergency contact phone number in your profile.
            </p>
          )}
          {!loading && doctorPhone && !husbandPhone && (
            <p className="text-xs text-muted-foreground">
              Add husband phone in profile edit to enable quick emergency call.
            </p>
          )}
          {!loading && !doctorPhone && husbandPhone && (
            <p className="text-xs text-muted-foreground">{doctorLabel}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
