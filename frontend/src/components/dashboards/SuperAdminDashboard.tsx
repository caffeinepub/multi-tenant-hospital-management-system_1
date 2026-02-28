import React, { useState } from 'react';
import { Building2, Users, BarChart3, Plus, Loader2, CheckCircle } from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAssignUserProfile } from '@/hooks/useQueries';
import { AppRole } from '../../backend';
import { toast } from 'sonner';

// Since the backend doesn't have a hospitals collection, we manage hospital creation
// by assigning Hospital Admin profiles with hospitalIds
interface HospitalEntry {
  id: string;
  name: string;
  adminPrincipal: string;
  createdAt: string;
}

const HOSPITALS_STORAGE_KEY = 'hms-hospitals';

function getStoredHospitals(): HospitalEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HOSPITALS_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveHospitals(hospitals: HospitalEntry[]) {
  localStorage.setItem(HOSPITALS_STORAGE_KEY, JSON.stringify(hospitals));
}

export function SuperAdminDashboard() {
  const [hospitals, setHospitals] = useState<HospitalEntry[]>(getStoredHospitals);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({ name: '', id: '', adminPrincipal: '' });
  const assignProfile = useAssignUserProfile();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.id.trim()) return;

    try {
      if (form.adminPrincipal.trim()) {
        await assignProfile.mutateAsync({
          user: form.adminPrincipal.trim(),
          profile: {
            name: `Admin of ${form.name}`,
            appRole: AppRole.hospitalAdmin,
            hospitalId: form.id.trim(),
          },
        });
      }

      const newHospital: HospitalEntry = {
        id: form.id.trim(),
        name: form.name.trim(),
        adminPrincipal: form.adminPrincipal.trim(),
        createdAt: new Date().toLocaleDateString(),
      };

      const updated = [...hospitals, newHospital];
      setHospitals(updated);
      saveHospitals(updated);
      setShowCreateModal(false);
      setForm({ name: '', id: '', adminPrincipal: '' });
      toast.success('Hospital created successfully');
    } catch (err) {
      toast.error('Failed to create hospital');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Super Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage hospitals and system-wide operations
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Hospital
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Hospitals"
          value={hospitals.length}
          icon={Building2}
          color="primary"
        />
        <StatCard
          title="Registered Admins"
          value={hospitals.filter((h) => h.adminPrincipal).length}
          icon={Users}
          color="success"
        />
        <StatCard
          title="System Status"
          value="Active"
          icon={BarChart3}
          color="info"
          subtitle="All systems operational"
        />
      </div>

      {/* Hospitals Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Registered Hospitals</CardTitle>
        </CardHeader>
        <CardContent>
          {hospitals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No hospitals registered yet</p>
              <p className="text-sm mt-1">Click "Add Hospital" to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {hospitals.map((hospital) => (
                <div
                  key={hospital.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{hospital.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {hospital.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-xs font-medium">{hospital.createdAt}</p>
                    </div>
                    <Badge variant={hospital.adminPrincipal ? 'default' : 'secondary'}>
                      {hospital.adminPrincipal ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Admin Assigned
                        </>
                      ) : (
                        'No Admin'
                      )}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Hospital Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Hospital</DialogTitle>
            <DialogDescription>
              Register a new hospital and optionally assign a Hospital Admin
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="hname">Hospital Name</Label>
              <Input
                id="hname"
                placeholder="e.g. City General Hospital"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hid">Hospital ID</Label>
              <Input
                id="hid"
                placeholder="e.g. hospital-001"
                value={form.id}
                onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                required
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier used for data scoping
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adminPrincipal">Admin Principal (optional)</Label>
              <Input
                id="adminPrincipal"
                placeholder="Principal ID of the Hospital Admin"
                value={form.adminPrincipal}
                onChange={(e) => setForm((f) => ({ ...f, adminPrincipal: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={assignProfile.isPending}>
                {assignProfile.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Create Hospital
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
