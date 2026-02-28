import React, { useState } from 'react';
import { Plus, Pencil, Loader2, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DataTable, Column } from '@/components/common/DataTable';
import type { HospitalId } from '../../../backend';
import { toast } from 'sonner';

interface DoctorsPageProps {
  hospitalId: HospitalId;
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  availability: string;
  hospitalId: string;
  principalId: string;
}

type DoctorRow = Doctor & Record<string, unknown>;

const DOCTORS_KEY = 'hms-doctors';

function getDoctors(hospitalId: string): Doctor[] {
  try {
    const all: Doctor[] = JSON.parse(localStorage.getItem(DOCTORS_KEY) || '[]');
    return all.filter((d) => d.hospitalId === hospitalId);
  } catch {
    return [];
  }
}

function saveDoctors(doctors: Doctor[], hospitalId: string, allDoctors: Doctor[]) {
  const others = allDoctors.filter((d) => d.hospitalId !== hospitalId);
  localStorage.setItem(DOCTORS_KEY, JSON.stringify([...others, ...doctors]));
}

export function DoctorsPage({ hospitalId }: DoctorsPageProps) {
  const [allDoctors] = useState<Doctor[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(DOCTORS_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const [doctors, setDoctors] = useState<Doctor[]>(() => getDoctors(hospitalId));
  const [showForm, setShowForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    specialization: '',
    availability: '',
    principalId: '',
  });

  const openAdd = () => {
    setEditingDoctor(null);
    setForm({ name: '', specialization: '', availability: '', principalId: '' });
    setShowForm(true);
  };

  const openEdit = (doc: Doctor) => {
    setEditingDoctor(doc);
    setForm({
      name: doc.name,
      specialization: doc.specialization,
      availability: doc.availability,
      principalId: doc.principalId,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let updated: Doctor[];
      if (editingDoctor) {
        updated = doctors.map((d) =>
          d.id === editingDoctor.id ? { ...d, ...form } : d
        );
        toast.success('Doctor updated');
      } else {
        const newDoc: Doctor = {
          id: `doc-${Date.now()}`,
          hospitalId,
          ...form,
        };
        updated = [...doctors, newDoc];
        toast.success('Doctor added');
      }
      setDoctors(updated);
      saveDoctors(updated, hospitalId, allDoctors);
      setShowForm(false);
    } catch {
      toast.error('Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<DoctorRow>[] = [
    { key: 'name', header: 'Name' },
    {
      key: 'specialization',
      header: 'Specialization',
      render: (row) => (
        <Badge variant="secondary">{String(row.specialization)}</Badge>
      ),
    },
    { key: 'availability', header: 'Availability' },
    {
      key: 'principalId',
      header: 'Principal ID',
      render: (row) =>
        row.principalId ? (
          <span className="font-mono text-xs text-muted-foreground truncate max-w-[120px] block">
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
          <h1 className="text-xl font-bold">Doctors</h1>
          <p className="text-sm text-muted-foreground">{doctors.length} doctors registered</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Doctor
        </Button>
      </div>

      <DataTable
        data={doctors as DoctorRow[]}
        columns={columns}
        searchPlaceholder="Search doctors..."
        emptyMessage="No doctors found. Add your first doctor."
        actions={(row) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => openEdit(row as Doctor)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDoctor ? 'Edit Doctor' : 'Add Doctor'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                placeholder="Dr. Jane Smith"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Specialization</Label>
              <Input
                placeholder="e.g. Cardiology"
                value={form.specialization}
                onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Availability Schedule</Label>
              <Textarea
                placeholder="e.g. Mon-Fri 9am-5pm"
                value={form.availability}
                onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Principal ID (optional)</Label>
              <Input
                placeholder="Internet Identity principal"
                value={form.principalId}
                onChange={(e) => setForm((f) => ({ ...f, principalId: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Link this doctor to their Internet Identity principal
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingDoctor ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
