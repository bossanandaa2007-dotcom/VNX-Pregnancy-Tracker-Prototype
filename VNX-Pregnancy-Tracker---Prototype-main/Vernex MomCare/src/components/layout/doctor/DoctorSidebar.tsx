import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  MessageCircle,
  CalendarDays,
  User,
  Library,
  LogOut,
  Heart,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { fetchUnreadCount } from '@/lib/doctorChat';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  showBadge?: boolean;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: BarChart3, label: 'Analytics', path: '/doctor/analytics' },
  { icon: MessageCircle, label: 'Chat', path: '/doctor/chat', showBadge: true },
  { icon: CalendarDays, label: 'Appointments', path: '/doctor/appointments' },
  { icon: Library, label: 'Library', path: '/library' },
  { icon: User, label: 'Profile', path: '/doctor/profile' },
];

export function DoctorSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    const loadUnread = async () => {
      if (!user?.id) return;
      try {
        const count = await fetchUnreadCount(user.id);
        setUnreadChatCount(count);
      } catch (err) {
        console.error('Unread count error:', err);
      }
    };

    loadUnread();
    const id = setInterval(loadUnread, 4000);
    return () => clearInterval(id);
  }, [user?.id]);

  return (
    <aside className="fixed left-0 top-0 z-50 h-screen w-64 border-r border-border bg-sidebar">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">VNX</h1>
              <p className="text-xs text-muted-foreground">Pregnancy Tracker</p>
            </div>
          </div>
        </div>

        <div className="border-b p-4">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs capitalize text-muted-foreground">{user?.role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition',
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-sidebar-accent'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5" />
                  {item.label}
                </div>

                {item.showBadge && unreadChatCount > 0 && (
                  <span
                    className="
                    flex h-5 min-w-[20px] items-center justify-center
                    rounded-full bg-primary px-1.5
                    text-[11px] font-medium text-primary-foreground
                  "
                  >
                    {unreadChatCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t p-4">
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
  );
}
