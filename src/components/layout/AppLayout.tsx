import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SettingsPage from '@/pages/Settings';
import Export from '@/pages/Export';

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AppSidebar onSettingsOpen={() => setSettingsOpen(true)} onExportOpen={() => setExportOpen(true)} />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <MobileSidebar onClose={() => setMobileMenuOpen(false)} onSettingsOpen={() => { setMobileMenuOpen(false); setSettingsOpen(true); }} onExportOpen={() => { setMobileMenuOpen(false); setExportOpen(true); }} />
        </SheetContent>
      </Sheet>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <SettingsPage />
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Export Data</DialogTitle>
          </DialogHeader>
          <Export />
        </DialogContent>
      </Dialog>

      {/* Main content */}
      <div className="lg:pl-64 min-h-screen flex flex-col">
        <AppHeader onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function MobileSidebar({ onClose, onSettingsOpen, onExportOpen }: { onClose: () => void; onSettingsOpen: () => void; onExportOpen: () => void }) {
  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center px-4 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2" onClick={onClose}>
          <Heart className="h-8 w-8 text-primary" />
          <span className="font-bold text-xl text-sidebar-foreground">HealthVault</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <MobileNavItems onItemClick={onClose} onSettingsOpen={onSettingsOpen} onExportOpen={onExportOpen} />
      </nav>
    </div>
  );
}

import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Stethoscope,
  Calendar,
  Bell,

  Download,
  Settings,
  Activity,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/profile', label: 'Profile & Family', icon: Users },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/doctor-notes', label: 'Doctor Notes', icon: Stethoscope },
  { path: '/appointments', label: 'Appointments', icon: Calendar },
  { path: '/reminders', label: 'Reminders & Symptoms', icon: Bell },

  { path: '/export', label: 'Export Data', icon: Download },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/activity', label: 'Activity Logs', icon: Activity },
];

function MobileNavItems({ onItemClick, onSettingsOpen, onExportOpen }: { onItemClick: () => void; onSettingsOpen: () => void; onExportOpen: () => void }) {
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <>
      <ul className="space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.path === '/settings') {
            return (
              <li key={item.path}>
                <Button
                  variant="ghost"
                  onClick={onSettingsOpen}
                  className={cn(
                    'w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Button>
              </li>
            );
          }

          if (item.path === '/export') {
            return (
              <li key={item.path}>
                <Button
                  variant="ghost"
                  onClick={onExportOpen}
                  className={cn(
                    'w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Button>
              </li>
            );
          }

          return (
            <li key={item.path}>
              <RouterLink
                to={item.path}
                onClick={onItemClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5 shrink-0')} />
                <span>{item.label}</span>
              </RouterLink>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto pt-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            logout();
            onItemClick();
          }}
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </>
  );
}
