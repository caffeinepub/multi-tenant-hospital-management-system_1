import React, { useState } from 'react';
import { CalendarDays, BedDouble, Droplets, Plus, Loader2, Clock, CheckCircle } from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useGetBedStats, useGetAllBloodStock } from '@/hooks/useQueries';
import { bloodGroupLabel } from '@/lib/utils';
import type { HospitalId } from '../../backend';
import { toast } from 'sonner';

interface PatientDashboardProps {
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

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  availability: string;
  hospitalId: string;
}

const APPOINTMENTS_KEY = 'hms-appointments';
const DOCTORS_KEY = 'hms-doctors';

function getMyAppointments(hospitalId: string, patientName: string): Appointment[] {
  try {
    const all: Appointment[] = JSON.parse(localStorage.getItem(APPOINTMENTS_KEY) || '[]');
    return all.filter(
      (a) => a.hospitalId === hospitalId && a.patientName.toLowerCase() === patientName.toLowerCase()
    );
  } catch {
    return [];
  }
}

function getDoctors(hospitalId: string): Doctor[] {
  try {
    const all: Doctor[] = JSON.parse(localStorage.getItem(DOCTORS_KEY) || '[]');
    return all.filter((d) => d.hospitalId === hospitalId);
  } catch {
    return [];
  }
}

function addAppointment(appt: Appointment) {
  try {
    const all: Appointment[] = JSON.parse(localStorage.getItem(APPOINTMENTS_KEY) || '[]');
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify([...all, appt]));
  } catch {
    // ignore
  }
}

const statusColors: Record<AppointmentStatus, string> = {
  scheduled: 'bg-info/10 text-info border-info',
  completed: 'bg-success/10 text-success border-success',
  cancelled: 'bg-destructive/10 text-destructive border-destructive',
};

export function PatientDashboard({ hospitalId }: PatientDashboardProps) {
  const { data: bedStats } = useGetBedStats(hospitalId);
  const { data: bloodStock = [] } = useGetAllBloodStock(hospitalId);

  const [patientName, setPatientName] = useState('');
  const [nameSet, setNameSet] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showBookModal, setShowBookModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ doctorName: '', dateTime: '', notes: '' });

  const doctors = getDoctors(hospitalId);

  const handleSetName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) return;
    setNameSet(true);
    setAppointments(getMyAppointments(hospitalId, patientName.trim()));
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const newAppt: Appointment = {
        id: `appt-${Date.now()}`,
        hospitalId,
        patientName: patientName.trim(),
        status: 'scheduled',
        ...form,
      };
      addAppointment(newAppt);
      setAppointments((prev) => [...prev, newAppt]);
      setShowBookModal(false);
      setForm({ doctorName: '', dateTime: '', notes: '' });
      toast.success('Appointment booked successfully');
    } catch {
      toast.error('Failed to book appointment');
    } finally {
      setSaving(false);
    }
  };

  const upcoming = appointments.filter((a) => a.status === 'scheduled');
  const past = appointments.filter((a) => a.status !== 'scheduled');

  if (!nameSet) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-lg">Welcome, Patient</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetName} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Your Full Name</Label>
                <Input
                  placeholder="Enter your full name"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Used to retrieve your appointments
                </p>
              </div>
              <Button type="submit" className="w-full">
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patient Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Welcome, {patientName}</p>
        </div>
        <Button onClick={() => setShowBookModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Book Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="My Appointments"
          value={appointments.length}
          icon={CalendarDays}
          color="primary"
        />
        <StatCard
          title="Available Beds"
          value={bedStats ? String(bedStats.available) : '—'}
          icon={BedDouble}
          color={bedStats && bedStats.available > 0n ? 'success' : 'destructive'}
          subtitle={bedStats ? `${String(bedStats.total)} total` : undefined}
        />
        <StatCard
          title="Blood Groups Available"
          value={bloodStock.filter((bs) => bs.quantity > 0n).length}
          icon={Droplets}
          color="info"
          subtitle={`of ${bloodStock.length} tracked`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Appointments */}
        <div className="lg:col-span-2 space-y-4">
          {/* Upcoming */}
          <div>
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">
              Upcoming Appointments ({upcoming.length})
            </h2>
            {upcoming.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  No upcoming appointments. Book one now!
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {upcoming.map((appt) => (
                  <Card key={appt.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{appt.doctorName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(appt.dateTime).toLocaleString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          {appt.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{appt.notes}</p>
                          )}
                        </div>
                        <Badge variant="outline" className={statusColors[appt.status]}>
                          <Clock className="h-3 w-3 mr-1" />
                          Scheduled
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-2">
                Past Appointments ({past.length})
              </h2>
              <div className="space-y-2">
                {past.map((appt) => (
                  <Card key={appt.id} className="opacity-75">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{appt.doctorName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(appt.dateTime).toLocaleString()}
                          </p>
                          {appt.treatmentNotes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              Treatment: {appt.treatmentNotes}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className={statusColors[appt.status]}>
                          {appt.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Blood Stock */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            Blood Availability
          </h2>
          <Card>
            <CardContent className="p-4 space-y-2">
              {bloodStock.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No blood stock data
                </p>
              ) : (
                bloodStock.map((bs) => (
                  <div
                    key={bs.bloodGroup}
                    className="flex items-center justify-between text-sm py-1.5 border-b last:border-0"
                  >
                    <span className="font-bold">{bloodGroupLabel(bs.bloodGroup)}</span>
                    <Badge
                      variant="outline"
                      className={
                        bs.quantity < bs.minQuantity
                          ? 'text-destructive border-destructive'
                          : 'text-success border-success'
                      }
                    >
                      {String(bs.quantity)} units
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Book Appointment Modal */}
      <Dialog open={showBookModal} onOpenChange={setShowBookModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              Select a doctor and preferred time slot
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBook} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Doctor</Label>
              {doctors.length > 0 ? (
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  value={form.doctorName}
                  onChange={(e) => setForm((f) => ({ ...f, doctorName: e.target.value }))}
                  required
                >
                  <option value="">Select a doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} — {d.specialization}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  placeholder="Doctor name"
                  value={form.doctorName}
                  onChange={(e) => setForm((f) => ({ ...f, doctorName: e.target.value }))}
                  required
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Preferred Date & Time</Label>
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
                placeholder="Reason for visit"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowBookModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Book Appointment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
