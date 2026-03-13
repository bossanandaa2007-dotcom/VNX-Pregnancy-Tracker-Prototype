import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from "@/config/api";
import {
  User,
  Mail,
  Phone,
  Shield,
  Hospital,
  MapPin,
  ArrowLeft,
  Save,
} from 'lucide-react';

type DoctorProfileShape = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  specialty?: string;
  qualification?: string;
  experience?: string;
  hospital?: string;
  location?: string;
};

const emptyDoctorProfile = {
  name: '',
  email: '',
  phone: '',
  specialization: '',
  qualification: '',
  experience: '',
  hospital: '',
  location: '',
};

export default function DoctorEditProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [doctorId, setDoctorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyDoctorProfile);

  useEffect(() => {
    const loadDoctorProfile = async () => {
      if (!user?.id || user.role !== 'doctor') return;
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/doctor/${user.id}`);
        const data = await res.json();

        if (!res.ok || !data?.success) {
          throw new Error(data?.message || 'Unable to load doctor profile');
        }

        const doctor = data.doctor as DoctorProfileShape;
        setDoctorId((doctor._id || doctor.id || user.id) as string);
        setForm({
          name: doctor.name || user.name || '',
          email: doctor.email || user.email || '',
          phone: doctor.phone || '',
          specialization: doctor.specialty || '',
          qualification: doctor.qualification || '',
          experience: doctor.experience || '',
          hospital: doctor.hospital || '',
          location: doctor.location || '',
        });
      } catch (error: any) {
        console.error('Doctor edit profile fetch error:', error);
        toast({
          title: 'Error',
          description: error?.message || 'Unable to load doctor profile',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadDoctorProfile();
  }, [toast, user?.email, user?.id, user?.name, user?.role]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!doctorId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/doctor/${doctorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          specialty: form.specialization.trim(),
          qualification: form.qualification.trim(),
          experience: form.experience.trim(),
          hospital: form.hospital.trim(),
          location: form.location.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to update profile');
      }

      updateUser({
        name: data.doctor.name,
        email: data.doctor.email,
        specialty: data.doctor.specialty,
        phone: data.doctor.phone,
        qualification: data.doctor.qualification,
        experience: data.doctor.experience,
        hospital: data.doctor.hospital,
        location: data.doctor.location,
      });

      toast({
        title: 'Saved',
        description: 'Doctor profile updated successfully',
      });

      navigate('/doctor/profile');
    } catch (error: any) {
      console.error('Doctor edit profile save error:', error);
      toast({
        title: 'Save failed',
        description: error?.message || 'Unable to save doctor profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => navigate('/doctor/profile')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Button>

        <div>
          <h1 className="text-2xl font-bold">Edit Doctor Profile</h1>
          <p className="text-muted-foreground">
            Update your professional information
          </p>
          {loading && <p className="text-xs text-muted-foreground mt-1">Loading profile...</p>}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              icon={User}
              label="Full Name"
              value={form.name}
              onChange={(v) => handleChange('name', v)}
            />

            <Field
              icon={Mail}
              label="Email"
              value={form.email}
              onChange={(v) => handleChange('email', v)}
            />

            <Field
              icon={Phone}
              label="Phone Number"
              value={form.phone}
              onChange={(v) => handleChange('phone', v)}
            />

            <Field
              icon={Shield}
              label="Specialization"
              value={form.specialization}
              onChange={(v) => handleChange('specialization', v)}
            />

            <Field
              label="Qualification"
              value={form.qualification}
              onChange={(v) => handleChange('qualification', v)}
            />

            <Field
              label="Experience"
              value={form.experience}
              onChange={(v) => handleChange('experience', v)}
            />

            <Field
              icon={Hospital}
              label="Hospital / Clinic"
              value={form.hospital}
              onChange={(v) => handleChange('hospital', v)}
            />

            <Field
              icon={MapPin}
              label="Location"
              value={form.location}
              onChange={(v) => handleChange('location', v)}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/doctor/profile')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button className="gap-2" onClick={handleSave} disabled={saving || loading}>
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon?: any;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`rounded-xl ${Icon ? 'pl-9' : ''}`}
        />
      </div>
    </div>
  );
}
