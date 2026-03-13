import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Camera,
  Trash2,
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
  profilePhoto?: string;
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

export default function DoctorEditProfile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [doctorId, setDoctorId] = useState('');
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfileShape | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingProfilePhoto, setPendingProfilePhoto] = useState<string | null>(null);
  const [removeProfilePhoto, setRemoveProfilePhoto] = useState(false);
  const [form, setForm] = useState(emptyDoctorProfile);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setDoctorProfile(doctor);
        setPendingProfilePhoto(null);
        setRemoveProfilePhoto(false);
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

  const profilePhoto = removeProfilePhoto
    ? ''
    : pendingProfilePhoto ?? doctorProfile?.profilePhoto ?? user?.profilePhoto ?? '';

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
    } catch (error: unknown) {
      console.error('Doctor edit profile photo process error:', error);
      toast({
        title: 'Image failed',
        description: error instanceof Error ? error.message : 'Unable to process selected image',
        variant: 'destructive',
      });
    }
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
          profilePhoto: removeProfilePhoto ? '' : pendingProfilePhoto,
          clearProfilePhoto: removeProfilePhoto,
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
        profilePhoto: data.doctor.profilePhoto,
      });
      setDoctorProfile(data.doctor as DoctorProfileShape);
      setPendingProfilePhoto(null);
      setRemoveProfilePhoto(false);

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
            <CardTitle>Profile Photo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-24 w-24 rounded-2xl bg-primary/10">
              <AvatarImage src={profilePhoto} alt={form.name || user?.name || 'Doctor'} className="object-cover" />
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
