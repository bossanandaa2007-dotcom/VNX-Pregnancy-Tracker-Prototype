import { ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { MobileSideDrawer } from '@/components/layout/MobileSideDrawer';
import { EmergencyModal } from '@/components/emergency/EmergencyModal';

// 👉 Doctor layout imports (NEW)
import { DoctorSidebar } from '@/components/layout/doctor/DoctorSidebar';
import { DoctorBottomNav } from '@/components/layout/doctor/DoctorBottomNav';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();

  const isPatient = user?.role === 'patient';
  const isDoctor = user?.role === 'doctor';

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">

      {/* ================= DESKTOP SIDEBAR ================= */}
      <div className="hidden lg:block">
        {isPatient && <AppSidebar isOpen={true} onClose={() => {}} />}
        {isDoctor && <DoctorSidebar />}
      </div>

      {/* ================= MOBILE TOP BAR (PATIENT ONLY) ================= */}
      {isPatient && (
        <div className="flex items-center gap-3 border-b bg-background px-4 py-3 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          <span className="font-semibold">VNX Pregnancy Tracker</span>
        </div>
      )}

      {/* ================= MAIN CONTENT ================= */}
      <main className={`${isPatient ? 'lg:pl-64' : 'lg:pl-64'} pb-16`}>
        <div className="min-h-screen p-4 lg:p-8">
          {children}
        </div>
      </main>

      {/* ================= MOBILE ONLY ================= */}
      {isPatient && (
        <>
          <MobileBottomNav />

          <MobileSideDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            onEmergency={() => {
              setDrawerOpen(false);
              setEmergencyOpen(true);
            }}
          />

          <EmergencyModal
            open={emergencyOpen}
            onClose={() => setEmergencyOpen(false)}
          />
        </>
      )}

      {/* ================= DOCTOR MOBILE ================= */}
      {isDoctor && (
        <DoctorBottomNav />
      )}
    </div>
  );
}
