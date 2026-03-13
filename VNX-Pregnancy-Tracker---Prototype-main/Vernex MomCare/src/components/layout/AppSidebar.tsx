import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  User,
  BarChart3,
  BookOpen,
  Library,
  MessageCircle,
  LogOut,
  Heart,
  NotebookPen,
  CalendarDays,
  Stethoscope,
  Hospital,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  doctorOnly?: boolean;
  patientOnly?: boolean;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Patients', path: '/patients', doctorOnly: true },

  { icon: User, label: 'Profile', path: '/profile' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },

  { icon: BookOpen, label: 'Guide', path: '/guide', patientOnly: true },
  { icon: Library, label: 'Library', path: '/library' },

  { icon: MessageCircle, label: 'Chat', path: '/chat' },

  // ✅ Patient utilities
  { icon: NotebookPen, label: 'Diary', path: '/diary', patientOnly: true },
  { icon: CalendarDays, label: 'Appointments', path: '/appointments', patientOnly: true },
  { icon: Stethoscope, label: 'Doctor Info', path: '/doctorinfo', patientOnly: true },
  { icon: Hospital, label: 'Hospital Info', path: '/hospitalinfo', patientOnly: true },
];

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const filteredItems = navItems.filter((item) => {
    if (item.doctorOnly && user?.role !== 'doctor') return false;
    if (item.patientOnly && user?.role !== 'patient') return false;
    return true;
  });

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose(); // close drawer on mobile
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Overlay (mobile only) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 border-r border-border bg-sidebar transition-transform duration-300',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">

          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Heart className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">VNX</h1>
                <p className="text-xs text-muted-foreground">
                  Pregnancy Tracker
                </p>
              </div>
            </div>

            {/* Close (mobile only) */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="border-b p-4">
            <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs capitalize text-muted-foreground">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            {filteredItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-sidebar-accent'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="border-t p-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
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
