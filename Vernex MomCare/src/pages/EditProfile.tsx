import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from "@/config/api";
import { Camera, Trash2, User } from 'lucide-react';

type PatientProfile = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  age?: number;
  profilePhoto?: string;
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
const MAX_PROFILE_IMAGE_DIMENSION = 1200;
const PROFILE_IMAGE_QUALITY = 0.78;

const resizeImageDataUrl = (source: string) =>
  new Promise<string>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      const scale = Math.min(
        1,
        MAX_PROFILE_IMAGE_DIMENSION / Math.max(image.width || 1, image.height || 1)
      );
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round((image.width || 1) * scale));
      canvas.height = Math.max(1, Math.round((image.height || 1) * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Image processing unavailable'));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', PROFILE_IMAGE_QUALITY));
    };
    image.onerror = () => reject(new Error('Image load failed'));
    image.src = source;
  });

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [patientId, setPatientId] = useState('');
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingProfilePhoto, setPendingProfilePhoto] = useState<string | null>(null);
  const [removeProfilePhoto, setRemoveProfilePhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const profilePhoto = removeProfilePhoto
    ? ''
    : pendingProfilePhoto ?? patientProfile?.profilePhoto ?? user?.profilePhoto ?? '';

  const handlePhotoSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Unable to read image'));
        reader.readAsDataURL(file);
      });

      const optimized = await resizeImageDataUrl(dataUrl);
      setPendingProfilePhoto(optimized);
      setRemoveProfilePhoto(false);
    } catch (err: unknown) {
      console.error('Edit profile photo process error:', err);
      toast({
        title: 'Image failed',
        description: err instanceof Error ? err.message : 'Unable to process selected image',
        variant: 'destructive',
      });
    }
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

        setPatientProfile(p);
        setPendingProfilePhoto(null);
        setRemoveProfilePhoto(false);
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
          profilePhoto: removeProfilePhoto ? '' : pendingProfilePhoto,
          clearProfilePhoto: removeProfilePhoto,
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
        profilePhoto: data.patient.profilePhoto,
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
      setPatientProfile(data.patient as PatientProfile);
      setPendingProfilePhoto(null);
      setRemoveProfilePhoto(false);

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
            <CardTitle>Profile Photo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-24 w-24 rounded-2xl bg-primary/10">
              <AvatarImage src={profilePhoto} alt={form.fullName || user?.name || 'Profile'} className="object-cover" />
              <AvatarFallback className="rounded-2xl bg-primary/10">
                <User className="h-10 w-10 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handlePhotoSelect}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" className="gap-2 rounded-xl" disabled={saving || loading}>
                    <Camera className="h-4 w-4" />
                    Edit Photo
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44 rounded-xl">
                  <DropdownMenuItem
                    className="gap-2"
                    onSelect={(event) => {
                      event.preventDefault();
                      fileInputRef.current?.click();
                    }}
                  >
                    <Camera className="h-4 w-4" />
                    Change Photo
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 text-destructive focus:text-destructive"
                    disabled={!profilePhoto}
                    onSelect={(event) => {
                      event.preventDefault();
                      setPendingProfilePhoto(null);
                      setRemoveProfilePhoto(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove Photo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-xs text-muted-foreground">
                Changes to the photo will be saved only when you click Save Changes.
              </p>
            </div>
          </CardContent>
        </Card>

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
