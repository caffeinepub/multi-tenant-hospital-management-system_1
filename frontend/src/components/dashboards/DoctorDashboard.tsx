import React, { useState } from 'react';
import { CalendarDays, Pill, User, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetAllMedicines } from '@/hooks/useQueries';
import type { HospitalId } from '../../backend';
import { toast } from 'sonner';

interface DoctorDashboardProps {
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
  treatmentNotes?: string;
}

const APPOINTMENTS_KEY = 'hms-appointments';

function getAppointments(hospitalId: string): Appointment[] {
  try {
    const all: Appointment[] = JSON.parse(localStorage.getItem(APPOINTMENTS_KEY) || '[]');
    return all.filter((a) => a.hospitalId === hospitalId);
  } catch {
    return [];
  }
}

function saveAppointment(appt: Appointment) {
  try {
    const all: Appointment[] = JSON.parse(localStorage.getItem(APPOINTMENTS_KEY) || '[]');
    const updated = all.map((a) => (a.id === appt.id ? appt : a));
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

const statusColors: Record<AppointmentStatus, string> = {
  scheduled: 'bg-info/10 text-info border-info',
  completed: 'bg-success/10 text-success border-success',
  cancelled: 'bg-destructive/10 text-destructive border-destructive',
};

export function DoctorDashboard({ hospitalId }: DoctorDashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(() =>
    getAppointments(hospitalId)
  );
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [treatmentNotes, setTreatmentNotes] = useState('');
  const [newStatus, setNewStatus] = useState<AppointmentStatus>('scheduled');
  const [saving, setSaving] = useState(false);

  const { data: medicines = [] } = useGetAllMedicines(hospitalId);

  const scheduled = appointments.filter((a) => a.status === 'scheduled');
  const completed = appointments.filter((a) => a.status === 'completed');

  const openTreatment = (appt: Appointment) => {
    setSelectedAppt(appt);
    setTreatmentNotes(appt.treatmentNotes || '');
    setNewStatus(appt.status);
  };

  const handleSaveTreatment = async () => {
    if (!selectedAppt) return;
    setSaving(true);
    try {
      const updated: Appointment = {
        ...selectedAppt,
        status: newStatus,
        treatmentNotes,
      };
      saveAppointment(updated);
      setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setSelectedAppt(null);
      toast.success('Treatment notes saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your appointments and patient treatments
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Appointments"
          value={appointments.length}
          icon={CalendarDays}
          color="primary"
        />
        <StatCard
          title="Scheduled"
          value={scheduled.length}
          icon={Clock}
          color="info"
        />
        <StatCard
          title="Completed"
          value={completed.length}
          icon={CheckCircle}
          color="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Appointments List */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            My Appointments
          </h2>
          {appointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No appointments assigned yet</p>
              </CardContent>
            </Card>
          ) : (
            appointments.map((appt) => (
              <Card key={appt.id} className="hover:shadow-card-hover transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{appt.patientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(appt.dateTime).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {appt.treatmentNotes && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            Notes: {appt.treatmentNotes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant="outline"
                        className={statusColors[appt.status]}
                      >
                        {appt.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => openTreatment(appt)}
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Medicine Availability */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Medicine Availability
          </h2>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Pill className="h-4 w-4 text-primary" />
                Current Stock
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-80 overflow-y-auto">
              {medicines.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No medicines in stock
                </p>
              ) : (
                medicines.map((med) => (
                  <div
                    key={String(med.id)}
                    className="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
                  >
                    <span className="truncate flex-1">{med.name}</span>
                    <Badge
                      variant="outline"
                      className={
                        med.quantity < med.minQuantity
                          ? 'text-warning border-warning ml-2 flex-shrink-0'
                          : 'text-success border-success ml-2 flex-shrink-0'
                      }
                    >
                      {String(med.quantity)}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Treatment Update Modal */}
      <Dialog open={selectedAppt != null} onOpenChange={() => setSelectedAppt(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Treatment — {selectedAppt?.patientName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Appointment Status</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as AppointmentStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Treatment Notes</Label>
              <Textarea
                placeholder="Enter treatment notes, prescribed medicines, etc."
                value={treatmentNotes}
                onChange={(e) => setTreatmentNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAppt(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTreatment} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Treatment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
