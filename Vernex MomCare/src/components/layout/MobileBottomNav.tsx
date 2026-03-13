import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, MessageCircle, NotebookPen, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { label: 'Home', icon: Home, path: '/dashboard' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'Chat', icon: MessageCircle, path: '/chat' },
  { label: 'Diary', icon: NotebookPen, path: '/diary' },
  { label: 'Profile', icon: User, path: '/profile' },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[80] border-t border-border/80 bg-background lg:hidden">
      <div className="grid grid-cols-5 gap-1 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center gap-1 px-2 py-1.5 text-[11px] font-medium transition',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
