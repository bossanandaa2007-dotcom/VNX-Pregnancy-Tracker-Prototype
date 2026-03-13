import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Library,
  NotebookPen,
  Stethoscope,
  Hospital,
  CalendarDays,
  AlertTriangle,
  Heart,
  User,
  LogOut,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { API_BASE } from '@/config/api';

interface Props {
  open: boolean;
  onClose: () => void;
  onEmergency: () => void;
}

export function MobileSideDrawer({ open, onClose, onEmergency }: Props) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [resolvedPhoto, setResolvedPhoto] = useState(user?.profilePhoto || '');

  useEffect(() => {
    setResolvedPhoto(user?.profilePhoto || '');
  }, [user?.profilePhoto]);

  useEffect(() => {
    const loadProfilePhoto = async () => {
      if (!user?.id || user?.profilePhoto) return;

      try {
        const endpoint =
          user.role === 'doctor'
            ? `${API_BASE}/api/auth/doctor/${user.id}`
            : `${API_BASE}/api/auth/patient/${user.id}`;

        const res = await fetch(endpoint);
        const data = await res.json().catch(() => null);
        const profile = data?.doctor || data?.patient;
        if (res.ok && data?.success && profile?.profilePhoto) {
          setResolvedPhoto(profile.profilePhoto);
        }
      } catch (error) {
        console.error('Mobile drawer photo fetch error:', error);
      }
    };

    if (open) {
      void loadProfilePhoto();
    }
  }, [open, user?.id, user?.profilePhoto, user?.role]);

  if (!open) return null;

  const items = [
    { label: 'Appointments', icon: CalendarDays, path: '/appointments' },
    { label: 'Guide', icon: BookOpen, path: '/guide' },
    { label: 'Library', icon: Library, path: '/library' },
    { label: 'Doctor Details', icon: Stethoscope, path: '/doctorinfo' },
    { label: 'Hospital Details', icon: Hospital, path: '/hospitalinfo' },
    
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed left-0 top-0 z-50 h-[100dvh] max-h-[100dvh] w-72 overflow-hidden border-r bg-background lg:hidden animate-in slide-in-from-left">
        <div className="flex h-full flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Heart className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold leading-none">VNX</p>
                <p className="text-xs text-muted-foreground">
                  Pregnancy Tracker
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3 rounded-xl bg-accent/40 p-3">
              <Avatar className="h-10 w-10 rounded-full bg-primary/10">
                <AvatarImage src={resolvedPhoto} alt={user?.name || 'Profile'} className="object-cover" />
                <AvatarFallback className="bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Utility Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium hover:bg-accent transition"
                >
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Emergency */}
          <div className="shrink-0 px-4 pb-3">
            <Button
              className="w-full bg-red-600 hover:bg-red-700 text-white gap-3"
              onClick={onEmergency}
            >
              <AlertTriangle className="h-5 w-5" />
              Emergency
            </Button>
          </div>

          {/* Logout */}
          <div className="shrink-0 border-t bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
