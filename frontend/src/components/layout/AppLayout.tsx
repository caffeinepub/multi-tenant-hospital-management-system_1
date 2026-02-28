import React from 'react';
import { Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { DarkModeToggle } from '@/components/DarkModeToggle';
import { AlertNotifications } from '@/components/AlertNotifications';
import { Footer } from '@/components/layout/Footer';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { AppRole } from '../../backend';
import type { UserProfile } from '../../backend';
import {
  LayoutDashboard,
  Pill,
  Truck,
  BedDouble,
  Droplets,
  Stethoscope,
  CalendarDays,
  Users,
  BarChart3,
  Building2,
  LogOut,
  User,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

function getNavItems(role: AppRole): NavItem[] {
  switch (role) {
    case AppRole.superAdmin:
      return [
        { label: 'Dashboard', path: '/super-admin', icon: LayoutDashboard },
        { label: 'Hospitals', path: '/super-admin/hospitals', icon: Building2 },
        { label: 'Reports', path: '/super-admin/reports', icon: BarChart3 },
      ];
    case AppRole.hospitalAdmin:
      return [
        { label: 'Dashboard', path: '/hospital-admin', icon: LayoutDashboard },
        { label: 'Medicines', path: '/hospital-admin/medicines', icon: Pill },
        { label: 'Suppliers', path: '/hospital-admin/suppliers', icon: Truck },
        { label: 'Beds', path: '/hospital-admin/beds', icon: BedDouble },
        { label: 'Blood Bank', path: '/hospital-admin/blood-bank', icon: Droplets },
        { label: 'Doctors', path: '/hospital-admin/doctors', icon: Stethoscope },
        { label: 'Appointments', path: '/hospital-admin/appointments', icon: CalendarDays },
        { label: 'Staff', path: '/hospital-admin/staff', icon: Users },
        { label: 'Reports', path: '/hospital-admin/reports', icon: BarChart3 },
      ];
    case AppRole.doctor:
      return [
        { label: 'Dashboard', path: '/doctor', icon: LayoutDashboard },
        { label: 'Appointments', path: '/doctor/appointments', icon: CalendarDays },
        { label: 'Medicines', path: '/doctor/medicines', icon: Pill },
      ];
    case AppRole.patient:
      return [
        { label: 'Dashboard', path: '/patient', icon: LayoutDashboard },
        { label: 'Appointments', path: '/patient/appointments', icon: CalendarDays },
        { label: 'Bed Availability', path: '/patient/beds', icon: BedDouble },
        { label: 'Blood Bank', path: '/patient/blood-bank', icon: Droplets },
      ];
    default:
      return [];
  }
}

interface AppLayoutProps {
  userProfile: UserProfile;
}

export function AppLayout({ userProfile }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const navItems = getNavItems(userProfile.appRole);
  const hospitalId = userProfile.hospitalId;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/' });
  };

  const initials = userProfile.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleLabel: Record<AppRole, string> = {
    [AppRole.superAdmin]: 'Super Admin',
    [AppRole.hospitalAdmin]: 'Hospital Admin',
    [AppRole.doctor]: 'Doctor',
    [AppRole.patient]: 'Patient',
  };

  return (
    <SidebarProvider>
      <Sidebar className="border-r-0">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/hms-logo-icon.dim_128x128.png"
              alt="HMS Logo"
              className="h-8 w-8 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-sidebar-foreground truncate">HMS Portal</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {roleLabel[userProfile.appRole]}
              </p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-2 py-3">
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider px-2 mb-1">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => navigate({ to: item.path })}
                        className="cursor-pointer"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-3 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-sidebar-accent transition-colors text-left">
                <Avatar className="h-7 w-7 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sidebar-foreground truncate">
                    {userProfile.name}
                  </p>
                  {hospitalId && (
                    <p className="text-[10px] text-sidebar-foreground/50 truncate">
                      {hospitalId}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-3 w-3 text-sidebar-foreground/40 flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-48">
              <DropdownMenuItem disabled>
                <User className="h-4 w-4 mr-2" />
                {userProfile.name}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex flex-col min-h-screen">
        {/* Top navbar */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5" />
          <div className="flex-1" />
          {hospitalId && <AlertNotifications hospitalId={hospitalId} />}
          <DarkModeToggle />
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 animate-fade-in">
          <Outlet />
        </main>

        <Footer />
      </SidebarInset>
    </SidebarProvider>
  );
}
