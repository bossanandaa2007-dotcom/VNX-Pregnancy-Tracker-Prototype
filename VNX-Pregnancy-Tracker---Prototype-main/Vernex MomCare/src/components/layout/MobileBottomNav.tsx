import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, MessageCircle, Library, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { label: 'Home', icon: Home, path: '/dashboard' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'Chat', icon: MessageCircle, path: '/chat' },
  { label: 'Library', icon: Library, path: '/library' },
  { label: 'Profile', icon: User, path: '/profile' },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background lg:hidden">
      <div className="flex justify-around py-2">
        {items.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center gap-1 text-xs',
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
