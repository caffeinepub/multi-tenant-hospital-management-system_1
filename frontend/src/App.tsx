import React from 'react';
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
  Navigate,
} from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { useInternetIdentity } from '@/hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '@/hooks/useQueries';
import { AppRole } from './backend';
import { LoginPage } from '@/components/LoginPage';
import { ProfileSetupModal } from '@/components/ProfileSetupModal';
import { AppLayout } from '@/components/layout/AppLayout';
import { SuperAdminDashboard } from '@/components/dashboards/SuperAdminDashboard';
import { HospitalAdminDashboard } from '@/components/dashboards/HospitalAdminDashboard';
import { DoctorDashboard } from '@/components/dashboards/DoctorDashboard';
import { PatientDashboard } from '@/components/dashboards/PatientDashboard';
import { MedicinesPage } from '@/components/dashboards/admin/MedicinesPage';
import { SuppliersPage } from '@/components/dashboards/admin/SuppliersPage';
import { BedsPage } from '@/components/dashboards/admin/BedsPage';
import { BloodBankPage } from '@/components/dashboards/admin/BloodBankPage';
import { DoctorsPage } from '@/components/dashboards/admin/DoctorsPage';
import { AppointmentsPage } from '@/components/dashboards/admin/AppointmentsPage';
import { StaffPage } from '@/components/dashboards/admin/StaffPage';
import { ReportsPage } from '@/components/dashboards/admin/ReportsPage';
import { Loader2 } from 'lucide-react';

// ── Root gate component ───────────────────────────────────────────────────

function RootGate() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: profile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const loading = isInitializing || (isAuthenticated && profileLoading);
  const showProfileSetup = isAuthenticated && isFetched && profile === null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading HMS Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (showProfileSetup) {
    return <ProfileSetupModal open={true} />;
  }

  if (profile) {
    switch (profile.appRole) {
      case AppRole.superAdmin:
        return <Navigate to="/super-admin" />;
      case AppRole.hospitalAdmin:
        return <Navigate to="/hospital-admin" />;
      case AppRole.doctor:
        return <Navigate to="/doctor" />;
      case AppRole.patient:
        return <Navigate to="/patient" />;
    }
  }

  return <LoginPage />;
}

// ── Layout wrapper that passes profile ───────────────────────────────────

function AuthenticatedLayout() {
  const { identity } = useInternetIdentity();
  const { data: profile } = useGetCallerUserProfile();

  if (!identity || !profile) {
    return <Navigate to="/" />;
  }

  return <AppLayout userProfile={profile} />;
}

// ── Hospital Admin sub-page wrapper ──────────────────────────────────────

function HospitalAdminWrapper({ children }: { children: React.ReactNode }) {
  const { data: profile } = useGetCallerUserProfile();
  if (!profile || profile.appRole !== AppRole.hospitalAdmin) return <Navigate to="/" />;
  const hospitalId = profile.hospitalId;
  if (!hospitalId) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No hospital assigned to your account. Contact your Super Admin.
      </div>
    );
  }
  return <>{children}</>;
}

// ── Routes ────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: RootGate,
});

// Authenticated layout route
const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  component: AuthenticatedLayout,
});

// Super Admin
const superAdminRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/super-admin',
  component: SuperAdminDashboard,
});

const superAdminHospitalsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/super-admin/hospitals',
  component: SuperAdminDashboard,
});

const superAdminReportsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/super-admin/reports',
  component: SuperAdminDashboard,
});

// Hospital Admin
const hospitalAdminRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/hospital-admin',
  component: HospitalAdminIndex,
});

function HospitalAdminIndex() {
  const { data: profile } = useGetCallerUserProfile();
  if (!profile || profile.appRole !== AppRole.hospitalAdmin) return <Navigate to="/" />;
  const hospitalId = profile.hospitalId;
  if (!hospitalId) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No hospital assigned to your account. Contact your Super Admin.
      </div>
    );
  }
  return <HospitalAdminDashboard hospitalId={hospitalId} />;
}

const medicinesRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/hospital-admin/medicines',
  component: MedicinesIndex,
});

function MedicinesIndex() {
  const { data: profile } = useGetCallerUserProfile();
  const hospitalId = profile?.hospitalId;
  if (!hospitalId) return <Navigate to="/hospital-admin" />;
  return <MedicinesPage hospitalId={hospitalId} />;
}

const suppliersRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/hospital-admin/suppliers',
  component: SuppliersIndex,
});

function SuppliersIndex() {
  const { data: profile } = useGetCallerUserProfile();
  const hospitalId = profile?.hospitalId;
  if (!hospitalId) return <Navigate to="/hospital-admin" />;
  return <SuppliersPage hospitalId={hospitalId} />;
}

const bedsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/hospital-admin/beds',
  component: BedsIndex,
});

function BedsIndex() {
  const { data: profile } = useGetCallerUserProfile();
  const hospitalId = profile?.hospitalId;
  if (!hospitalId) return <Navigate to="/hospital-admin" />;
  return <BedsPage hospitalId={hospitalId} />;
}

const bloodBankRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/hospital-admin/blood-bank',
  component: BloodBankIndex,
});

function BloodBankIndex() {
  const { data: profile } = useGetCallerUserProfile();
  const hospitalId = profile?.hospitalId;
  if (!hospitalId) return <Navigate to="/hospital-admin" />;
  return <BloodBankPage hospitalId={hospitalId} />;
}

const doctorsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/hospital-admin/doctors',
  component: DoctorsIndex,
});

function DoctorsIndex() {
  const { data: profile } = useGetCallerUserProfile();
  const hospitalId = profile?.hospitalId;
  if (!hospitalId) return <Navigate to="/hospital-admin" />;
  return <DoctorsPage hospitalId={hospitalId} />;
}

const appointmentsAdminRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/hospital-admin/appointments',
  component: AppointmentsAdminIndex,
});

function AppointmentsAdminIndex() {
  const { data: profile } = useGetCallerUserProfile();
  const hospitalId = profile?.hospitalId;
  if (!hospitalId) return <Navigate to="/hospital-admin" />;
  return <AppointmentsPage hospitalId={hospitalId} />;
}

const staffRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/hospital-admin/staff',
  component: StaffIndex,
});

function StaffIndex() {
  const { data: profile } = useGetCallerUserProfile();
  const hospitalId = profile?.hospitalId;
  if (!hospitalId) return <Navigate to="/hospital-admin" />;
  return <StaffPage hospitalId={hospitalId} />;
}

const reportsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/hospital-admin/reports',
  component: ReportsIndex,
});

function ReportsIndex() {
  const { data: profile } = useGetCallerUserProfile();
  const hospitalId = profile?.hospitalId;
  if (!hospitalId) return <Navigate to="/hospital-admin" />;
  return <ReportsPage hospitalId={hospitalId} />;
}

// Doctor
const doctorRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/doctor',
  component: DoctorIndex,
});

function DoctorIndex() {
  const { data: profile } = useGetCallerUserProfile();
  if (!profile || profile.appRole !== AppRole.doctor) return <Navigate to="/" />;
  const hospitalId = profile.hospitalId;
  if (!hospitalId) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No hospital assigned. Contact your administrator.
      </div>
    );
  }
  return <DoctorDashboard hospitalId={hospitalId} />;
}

const doctorAppointmentsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/doctor/appointments',
  component: DoctorIndex,
});

const doctorMedicinesRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/doctor/medicines',
  component: DoctorMedicinesIndex,
});

function DoctorMedicinesIndex() {
  const { data: profile } = useGetCallerUserProfile();
  const hospitalId = profile?.hospitalId;
  if (!hospitalId) return <Navigate to="/doctor" />;
  return <MedicinesPage hospitalId={hospitalId} />;
}

// Patient
const patientRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/patient',
  component: PatientIndex,
});

function PatientIndex() {
  const { data: profile } = useGetCallerUserProfile();
  if (!profile || profile.appRole !== AppRole.patient) return <Navigate to="/" />;
  const hospitalId = profile.hospitalId;
  if (!hospitalId) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No hospital assigned. Contact your administrator.
      </div>
    );
  }
  return <PatientDashboard hospitalId={hospitalId} />;
}

const patientAppointmentsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/patient/appointments',
  component: PatientIndex,
});

const patientBedsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/patient/beds',
  component: PatientBedsIndex,
});

function PatientBedsIndex() {
  const { data: profile } = useGetCallerUserProfile();
  const hospitalId = profile?.hospitalId;
  if (!hospitalId) return <Navigate to="/patient" />;
  return <BedsPage hospitalId={hospitalId} />;
}

const patientBloodBankRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/patient/blood-bank',
  component: PatientBloodBankIndex,
});

function PatientBloodBankIndex() {
  const { data: profile } = useGetCallerUserProfile();
  const hospitalId = profile?.hospitalId;
  if (!hospitalId) return <Navigate to="/patient" />;
  return <BloodBankPage hospitalId={hospitalId} />;
}

// ── Router ────────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  indexRoute,
  authenticatedRoute.addChildren([
    superAdminRoute,
    superAdminHospitalsRoute,
    superAdminReportsRoute,
    hospitalAdminRoute,
    medicinesRoute,
    suppliersRoute,
    bedsRoute,
    bloodBankRoute,
    doctorsRoute,
    appointmentsAdminRoute,
    staffRoute,
    reportsRoute,
    doctorRoute,
    doctorAppointmentsRoute,
    doctorMedicinesRoute,
    patientRoute,
    patientAppointmentsRoute,
    patientBedsRoute,
    patientBloodBankRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// ── App ───────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  );
}
