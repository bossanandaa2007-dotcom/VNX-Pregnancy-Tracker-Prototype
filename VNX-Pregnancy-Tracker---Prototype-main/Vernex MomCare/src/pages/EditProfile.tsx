import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from "@/config/api";

type PatientProfile = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  age?: number;
  contactPhone?: string;
  husbandName?: string;
  husbandPhone?: string;
  pregnancyStartDate?: string;
  doctorId?: string | { _id?: string; name?: string; email?: string };
};

type DoctorProfile = {
  _id: string;
  name: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [patientId, setPatientId] = useState('');
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    age: '',
    phone: '',
    husbandName: '',
    husbandPhone: '',
    pregnancyStartDate: '',
  });

  const expectedDueDate = useMemo(() => {
    if (!form.pregnancyStartDate) return '';
    const start = new Date(form.pregnancyStartDate);
    if (Number.isNaN(start.getTime())) return '';
    const due = new Date(start.getTime() + 280 * DAY_MS);
    return due.toISOString().slice(0, 10);
  }, [form.pregnancyStartDate]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id || user.role !== 'patient') return;
      setLoading(true);

      try {
        let data: any = null;

        const byIdRes = await fetch(`${API_BASE}/api/auth/patient/${user.id}`);
        if (byIdRes.ok) {
          data = await byIdRes.json();
        } else if (user.email) {
          const byEmailRes = await fetch(
            `${API_BASE}/api/auth/patient/by-email/${encodeURIComponent(user.email)}`
          );
          if (byEmailRes.ok) data = await byEmailRes.json();
        }

        const p: PatientProfile | null = data?.success ? data.patient : (user as unknown as PatientProfile);
        if (!p) return;

        setPatientId((p._id || p.id || user.id) as string);
        setForm({
          fullName: p.name || user.name || '',
          email: p.email || user.email || '',
          age: p.age !== undefined && p.age !== null ? String(p.age) : '',
          phone: p.contactPhone || '',
          husbandName: p.husbandName || '',
          husbandPhone: p.husbandPhone || '',
          pregnancyStartDate: p.pregnancyStartDate
            ? new Date(p.pregnancyStartDate).toISOString().slice(0, 10)
            : '',
        });

        if (p.doctorId && typeof p.doctorId === 'object' && p.doctorId.name) {
          setDoctor({
            _id: p.doctorId._id || '',
            name: p.doctorId.name,
          });
        } else if (typeof p.doctorId === 'string' && p.doctorId) {
          const docRes = await fetch(`${API_BASE}/api/auth/doctor/${p.doctorId}`);
          const docData = await docRes.json();
          if (docRes.ok && docData?.success) {
            setDoctor(docData.doctor as DoctorProfile);
          }
        }
      } catch (err) {
        console.error('Edit profile fetch error:', err);
        toast({
          title: 'Error',
          description: 'Unable to load profile details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.id, user?.email, user?.role]);

  const handleSave = async () => {
    if (!patientId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/patient/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.fullName.trim(),
          email: form.email.trim(),
          age: form.age ? Number(form.age) : null,
          contactPhone: form.phone.trim(),
          husbandName: form.husbandName.trim(),
          husbandPhone: form.husbandPhone.trim(),
          pregnancyStartDate: form.pregnancyStartDate || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Failed to update profile');
      }

      updateUser({
        name: data.patient.name,
        email: data.patient.email,
        age: data.patient.age,
        contactPhone: data.patient.contactPhone,
        pregnancyStartDate: data.patient.pregnancyStartDate,
        gestationalWeek: data.patient.gestationalWeek,
        doctorId:
          typeof data.patient.doctorId === 'object'
            ? data.patient.doctorId?._id
            : data.patient.doctorId,
        riskStatus: data.patient.riskStatus,
        husbandPhone: data.patient.husbandPhone,
      });

      toast({
        title: 'Saved',
        description: 'Profile updated successfully',
      });

      navigate('/profile');
    } catch (err: any) {
      console.error('Edit profile save error:', err);
      toast({
        title: 'Save failed',
        description: err?.message || 'Unable to save profile',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        {loading && <p className="text-sm text-muted-foreground">Loading profile...</p>}

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input value={form.fullName} onChange={(e) => handleChange('fullName', e.target.value)} />
            </div>

            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
            </div>

            <div>
              <Label>Age</Label>
              <Input
                type="number"
                min={1}
                value={form.age}
                onChange={(e) => handleChange('age', e.target.value)}
              />
            </div>

            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
            </div>

            <div>
              <Label>Husband&apos;s Name</Label>
              <Input
                value={form.husbandName}
                onChange={(e) => handleChange('husbandName', e.target.value)}
              />
            </div>

            <div>
              <Label>Husband&apos;s Phone</Label>
              <Input
                value={form.husbandPhone}
                onChange={(e) => handleChange('husbandPhone', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pregnancy Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Pregnancy Start Date</Label>
              <Input
                type="date"
                value={form.pregnancyStartDate}
                onChange={(e) => handleChange('pregnancyStartDate', e.target.value)}
              />
            </div>

            <div>
              <Label>Expected Due Date</Label>
              <Input type="date" value={expectedDueDate} disabled />
            </div>

            <div>
              <Label>Assigned Doctor</Label>
              <Input value={doctor?.name || 'Not assigned'} disabled />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/profile')} disabled={saving}>
            Cancel
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
