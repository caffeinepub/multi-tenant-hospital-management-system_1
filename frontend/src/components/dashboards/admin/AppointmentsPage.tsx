import React, { useState } from 'react';
import { CalendarDays, Plus, Loader2 } from 'lucide-react';
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

interface AppointmentsPageProps {
  hospitalId: HospitalId;
}

type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  dateTime: string;
  status: AppointmentStatus;
  hospitalId: string;
  notes: string;
}

type AppointmentRow = Appointment & Record<string, unknown>;

const APPOINTMENTS_KEY = 'hms-appointments';

function getAppointments(hospitalId: string): Appointment[] {
  try {
    const all: Appointment[] = JSON.parse(localStorage.getItem(APPOINTMENTS_KEY) || '[]');
    return all.filter((a) => a.hospitalId === hospitalId);
  } catch {
    return [];
  }
}

function saveAppointments(appts: Appointment[], hospitalId: string) {
  try {
    const all: Appointment[] = JSON.parse(localStorage.getItem(APPOINTMENTS_KEY) || '[]');
    const others = all.filter((a) => a.hospitalId !== hospitalId);
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify([...others, ...appts]));
  } catch {
    // ignore
  }
}

const statusColors: Record<AppointmentStatus, string> = {
  scheduled: 'bg-info/10 text-info border-info',
  completed: 'bg-success/10 text-success border-success',
  cancelled: 'bg-destructive/10 text-destructive border-destructive',
};

export function AppointmentsPage({ hospitalId }: AppointmentsPageProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    getAppointments(hospitalId)
  );
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    patientName: '',
    doctorName: '',
    dateTime: '',
    notes: '',
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newAppt: Appointment = {
        id: `appt-${Date.now()}`,
        hospitalId,
        status: 'scheduled',
        ...form,
      };
      const updated = [...appointments, newAppt];
      setAppointments(updated);
      saveAppointments(updated, hospitalId);
      setShowForm(false);
      setForm({ patientName: '', doctorName: '', dateTime: '', notes: '' });
      toast.success('Appointment created');
    } catch {
      toast.error('Failed to create appointment');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (id: string, status: AppointmentStatus) => {
    const updated = appointments.map((a) => (a.id === id ? { ...a, status } : a));
    setAppointments(updated);
    saveAppointments(updated, hospitalId);
    toast.success('Status updated');
  };

  const filterOptions = [
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  const columns: Column<AppointmentRow>[] = [
    { key: 'patientName', header: 'Patient' },
    { key: 'doctorName', header: 'Doctor' },
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (row) => (
        <span className="text-sm">
          {new Date(String(row.dateTime)).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge
          variant="outline"
          className={statusColors[row.status as AppointmentStatus]}
        >
          {String(row.status).charAt(0).toUpperCase() + String(row.status).slice(1)}
        </Badge>
      ),
    },
    { key: 'notes', header: 'Notes', render: (row) => <span className="text-muted-foreground text-sm truncate max-w-[150px] block">{String(row.notes) || '—'}</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Appointments</h1>
          <p className="text-sm text-muted-foreground">
            {appointments.length} appointments total
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </div>

      <DataTable
        data={appointments as AppointmentRow[]}
        columns={columns}
        searchPlaceholder="Search appointments..."
        filterOptions={filterOptions}
        filterKey="status"
        emptyMessage="No appointments found."
        actions={(row) => (
          <Select
            value={String(row.status)}
            onValueChange={(v) => handleStatusChange(String(row.id), v as AppointmentStatus)}
          >
            <SelectTrigger className="h-7 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        )}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Appointment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Patient Name</Label>
              <Input
                placeholder="Patient full name"
                value={form.patientName}
                onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Doctor Name</Label>
              <Input
                placeholder="Doctor full name"
                value={form.doctorName}
                onChange={(e) => setForm((f) => ({ ...f, doctorName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date & Time</Label>
              <Input
                type="datetime-local"
                value={form.dateTime}
                onChange={(e) => setForm((f) => ({ ...f, dateTime: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Additional notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
