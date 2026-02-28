import React, { useState } from 'react';
import { Plus, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, Column } from '@/components/common/DataTable';
import type { HospitalId } from '../../../backend';
import { toast } from 'sonner';

interface StaffPageProps {
  hospitalId: HospitalId;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  hospitalId: string;
  principalId: string;
}

type StaffRow = StaffMember & Record<string, unknown>;

const STAFF_KEY = 'hms-staff';

function getStaff(hospitalId: string): StaffMember[] {
  try {
    const all: StaffMember[] = JSON.parse(localStorage.getItem(STAFF_KEY) || '[]');
    return all.filter((s) => s.hospitalId === hospitalId);
  } catch {
    return [];
  }
}

function saveStaff(staff: StaffMember[], hospitalId: string) {
  try {
    const all: StaffMember[] = JSON.parse(localStorage.getItem(STAFF_KEY) || '[]');
    const others = all.filter((s) => s.hospitalId !== hospitalId);
    localStorage.setItem(STAFF_KEY, JSON.stringify([...others, ...staff]));
  } catch {
    // ignore
  }
}

const ROLES = ['Nurse', 'Receptionist', 'Lab Technician', 'Pharmacist', 'Radiologist', 'Administrator', 'Cleaner', 'Security'];

export function StaffPage({ hospitalId }: StaffPageProps) {
  const [staff, setStaff] = useState<StaffMember[]>(() => getStaff(hospitalId));
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    role: 'Nurse',
    department: '',
    principalId: '',
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newMember: StaffMember = {
        id: `staff-${Date.now()}`,
        hospitalId,
        ...form,
      };
      const updated = [...staff, newMember];
      setStaff(updated);
      saveStaff(updated, hospitalId);
      setShowForm(false);
      setForm({ name: '', role: 'Nurse', department: '', principalId: '' });
      toast.success('Staff member added');
    } catch {
      toast.error('Failed to add staff member');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<StaffRow>[] = [
    { key: 'name', header: 'Name' },
    {
      key: 'role',
      header: 'Role',
      render: (row) => <Badge variant="secondary">{String(row.role)}</Badge>,
    },
    { key: 'department', header: 'Department' },
    {
      key: 'principalId',
      header: 'Principal ID',
      render: (row) =>
        row.principalId ? (
          <span className="font-mono text-xs text-muted-foreground">
            {String(row.principalId).slice(0, 16)}...
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Staff Management</h1>
          <p className="text-sm text-muted-foreground">{staff.length} staff members</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      <DataTable
        data={staff as StaffRow[]}
        columns={columns}
        searchPlaceholder="Search staff..."
        emptyMessage="No staff members found. Add your first staff member."
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                placeholder="Staff member name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input
                placeholder="e.g. Emergency, ICU"
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Principal ID (optional)</Label>
              <Input
                placeholder="Internet Identity principal"
                value={form.principalId}
                onChange={(e) => setForm((f) => ({ ...f, principalId: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Staff
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
