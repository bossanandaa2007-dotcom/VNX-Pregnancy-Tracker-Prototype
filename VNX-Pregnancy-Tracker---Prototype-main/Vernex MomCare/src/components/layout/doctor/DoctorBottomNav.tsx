import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BarChart3, MessageCircle, CalendarDays, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUnreadCount } from '@/lib/doctorChat';

export function DoctorBottomNav() {
  const { user } = useAuth();
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background lg:hidden">
      <div className="flex justify-around py-3">
        <BottomItem to="/dashboard" icon={LayoutDashboard} />
        <BottomItem to="/doctor/analytics" icon={BarChart3} />

        <div className="relative">
          <BottomItem to="/doctor/chat" icon={MessageCircle} />
          {unreadChatCount > 0 && (
            <span
              className="
              absolute -top-1 -right-2
              flex h-4 min-w-[16px] items-center justify-center
              rounded-full bg-primary
              text-[10px] font-medium text-primary-foreground
            "
            >
              {unreadChatCount}
            </span>
          )}
        </div>

        <BottomItem to="/doctor/appointments" icon={CalendarDays} />
        <BottomItem to="/doctor/profile" icon={User} />
      </div>
    </nav>
  );
}

function BottomItem({ to, icon: Icon }: { to: string; icon: any }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-1 px-3 py-1 text-xs transition
        ${isActive ? 'text-primary' : 'text-muted-foreground'}`
      }
    >
      <Icon className="h-6 w-6" />
    </NavLink>
  );
}
