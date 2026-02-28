import React, { useState } from 'react';
import { Plus, Pencil, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DataTable, Column } from '@/components/common/DataTable';
import { useGetAllSuppliers, useAddSupplier, useUpdateSupplier } from '@/hooks/useQueries';
import type { Supplier, HospitalId } from '../../../backend';
import { toast } from 'sonner';

interface SuppliersPageProps {
  hospitalId: HospitalId;
}

type SupplierRow = Supplier & Record<string, unknown>;

export function SuppliersPage({ hospitalId }: SuppliersPageProps) {
  const { data: suppliers = [], isLoading } = useGetAllSuppliers(hospitalId);
  const addSupplier = useAddSupplier();
  const updateSupplier = useUpdateSupplier();

  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: '', contactInfo: '' });

  const openAdd = () => {
    setEditingSupplier(null);
    setForm({ name: '', contactInfo: '' });
    setShowForm(true);
  };

  const openEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setForm({ name: sup.name, contactInfo: sup.contactInfo });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await updateSupplier.mutateAsync({
          id: editingSupplier.id,
          hospitalId,
          contactInfo: form.contactInfo,
        });
        toast.success('Supplier updated');
      } else {
        await addSupplier.mutateAsync({
          hospitalId,
          name: form.name,
          contactInfo: form.contactInfo,
        });
        toast.success('Supplier added');
      }
      setShowForm(false);
    } catch {
      toast.error('Operation failed');
    }
  };

  const columns: Column<SupplierRow>[] = [
    { key: 'name', header: 'Supplier Name' },
    { key: 'contactInfo', header: 'Contact Information' },
    {
      key: 'id',
      header: 'ID',
      render: (row) => <span className="font-mono text-xs text-muted-foreground">#{String(row.id)}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Suppliers</h1>
          <p className="text-sm text-muted-foreground">{suppliers.length} suppliers registered</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <DataTable
        data={suppliers as SupplierRow[]}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search suppliers..."
        emptyMessage="No suppliers found. Add your first supplier."
        actions={(row) => (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row as Supplier)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {!editingSupplier && (
              <div className="space-y-1.5">
                <Label>Supplier Name</Label>
                <Input
                  placeholder="e.g. MedSupply Co."
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Contact Information</Label>
              <Textarea
                placeholder="Phone, email, address..."
                value={form.contactInfo}
                onChange={(e) => setForm((f) => ({ ...f, contactInfo: e.target.value }))}
                rows={3}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addSupplier.isPending || updateSupplier.isPending}>
                {(addSupplier.isPending || updateSupplier.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingSupplier ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
