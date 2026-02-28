import React from 'react';
import { Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import {
  Pill,
  Truck,
  BedDouble,
  Droplets,
  Stethoscope,
  CalendarDays,
  AlertTriangle,
  TrendingDown,
} from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  useGetAllMedicines,
  useGetLowStockMedicines,
  useGetExpiringMedicines,
  useGetBedStats,
  useGetAllBloodStock,
  useGetLowStockBloodGroups,
} from '@/hooks/useQueries';
import { bloodGroupLabel, formatDate, isExpired } from '@/lib/utils';
import type { HospitalId } from '../../backend';

interface HospitalAdminDashboardProps {
  hospitalId: HospitalId;
}

export function HospitalAdminDashboard({ hospitalId }: HospitalAdminDashboardProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const { data: medicines = [], isLoading: medsLoading } = useGetAllMedicines(hospitalId);
  const { data: lowStockMeds = [] } = useGetLowStockMedicines(hospitalId);
  const { data: expiringMeds = [] } = useGetExpiringMedicines(hospitalId);
  const { data: bedStats, isLoading: bedsLoading } = useGetBedStats(hospitalId);
  const { data: bloodStock = [] } = useGetAllBloodStock(hospitalId);
  const { data: lowBloodGroups = [] } = useGetLowStockBloodGroups(hospitalId);

  // Only show home dashboard if on exact /hospital-admin path
  const isHome = location.pathname === '/hospital-admin';

  if (!isHome) {
    return <Outlet />;
  }

  const expiredCount = medicines.filter((m) => isExpired(m.expiryDate)).length;
  const occupancyPct = bedStats
    ? Math.round((Number(bedStats.occupied) / Math.max(Number(bedStats.total), 1)) * 100)
    : 0;

  const quickLinks = [
    { label: 'Medicines', path: '/hospital-admin/medicines', icon: Pill, color: 'primary' as const },
    { label: 'Suppliers', path: '/hospital-admin/suppliers', icon: Truck, color: 'info' as const },
    { label: 'Beds', path: '/hospital-admin/beds', icon: BedDouble, color: 'success' as const },
    { label: 'Blood Bank', path: '/hospital-admin/blood-bank', icon: Droplets, color: 'destructive' as const },
    { label: 'Doctors', path: '/hospital-admin/doctors', icon: Stethoscope, color: 'primary' as const },
    { label: 'Appointments', path: '/hospital-admin/appointments', icon: CalendarDays, color: 'warning' as const },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Hospital Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Hospital ID: <span className="font-mono text-primary">{hospitalId}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Medicines"
          value={medicines.length}
          icon={Pill}
          color="primary"
          isLoading={medsLoading}
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStockMeds.length}
          icon={TrendingDown}
          color={lowStockMeds.length > 0 ? 'warning' : 'success'}
          subtitle={`${expiredCount} expired`}
        />
        <StatCard
          title="Bed Occupancy"
          value={`${occupancyPct}%`}
          icon={BedDouble}
          color={occupancyPct > 80 ? 'destructive' : occupancyPct > 60 ? 'warning' : 'success'}
          subtitle={`${bedStats ? String(bedStats.available) : 0} available`}
          isLoading={bedsLoading}
        />
        <StatCard
          title="Blood Stock Alerts"
          value={lowBloodGroups.length}
          icon={Droplets}
          color={lowBloodGroups.length > 0 ? 'destructive' : 'success'}
          subtitle={`${bloodStock.length} groups tracked`}
        />
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Quick Access
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickLinks.map(({ label, path, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate({ to: path })}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:bg-accent hover:border-primary/30 transition-all text-center group"
            >
              <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Section */}
      {(lowStockMeds.length > 0 || expiringMeds.length > 0 || lowBloodGroups.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(lowStockMeds.length > 0 || expiringMeds.length > 0) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Medicine Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lowStockMeds.slice(0, 3).map((med) => (
                  <div key={String(med.id)} className="flex items-center justify-between text-sm">
                    <span className="truncate">{med.name}</span>
                    <Badge variant="outline" className="text-warning border-warning ml-2 flex-shrink-0">
                      Low Stock: {String(med.quantity)}
                    </Badge>
                  </div>
                ))}
                {expiringMeds.slice(0, 3).map((med) => (
                  <div key={`exp-${String(med.id)}`} className="flex items-center justify-between text-sm">
                    <span className="truncate">{med.name}</span>
                    <Badge variant="destructive" className="ml-2 flex-shrink-0">
                      {isExpired(med.expiryDate) ? 'Expired' : 'Expiring Soon'}
                    </Badge>
                  </div>
                ))}
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-primary"
                  onClick={() => navigate({ to: '/hospital-admin/medicines' })}
                >
                  View all medicines →
                </Button>
              </CardContent>
            </Card>
          )}

          {lowBloodGroups.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-destructive" />
                  Blood Stock Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {lowBloodGroups.map((bg) => (
                  <div key={bg} className="flex items-center justify-between text-sm">
                    <span>{bloodGroupLabel(bg)}</span>
                    <Badge variant="destructive">Low Stock</Badge>
                  </div>
                ))}
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-primary"
                  onClick={() => navigate({ to: '/hospital-admin/blood-bank' })}
                >
                  Manage blood bank →
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
