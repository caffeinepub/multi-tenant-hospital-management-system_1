import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, AlertTriangle } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, Column } from '@/components/common/DataTable';
import {
  useGetAllMedicines,
  useGetAllSuppliers,
  useAddMedicine,
  useUpdateMedicine,
  useDeleteMedicine,
} from '@/hooks/useQueries';
import { formatDate, isExpired, isExpiringSoon, dateToNanoseconds } from '@/lib/utils';
import type { Medicine, HospitalId, SupplierId } from '../../../backend';
import { toast } from 'sonner';

interface MedicinesPageProps {
  hospitalId: HospitalId;
}

type MedicineRow = Medicine & Record<string, unknown>;

export function MedicinesPage({ hospitalId }: MedicinesPageProps) {
  const { data: medicines = [], isLoading } = useGetAllMedicines(hospitalId);
  const { data: suppliers = [] } = useGetAllSuppliers(hospitalId);
  const addMedicine = useAddMedicine();
  const updateMedicine = useUpdateMedicine();
  const deleteMedicine = useDeleteMedicine();

  const [showForm, setShowForm] = useState(false);
  const [editingMed, setEditingMed] = useState<Medicine | null>(null);
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [form, setForm] = useState({
    name: '',
    quantity: '',
    minQuantity: '',
    expiryDate: '',
    supplierId: '',
  });

  const openAdd = () => {
    setEditingMed(null);
    setForm({ name: '', quantity: '', minQuantity: '', expiryDate: '', supplierId: '' });
    setShowForm(true);
  };

  const openEdit = (med: Medicine) => {
    setEditingMed(med);
    const expMs = Number(med.expiryDate) / 1_000_000;
    const expDate = new Date(expMs).toISOString().split('T')[0];
    setForm({
      name: med.name,
      quantity: String(med.quantity),
      minQuantity: String(med.minQuantity),
      expiryDate: expDate,
      supplierId: med.supplierId != null ? String(med.supplierId) : '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const expiryNs = dateToNanoseconds(new Date(form.expiryDate));
    const supplierId = form.supplierId ? (BigInt(form.supplierId) as SupplierId) : null;

    try {
      if (editingMed) {
        await updateMedicine.mutateAsync({
          id: editingMed.id,
          hospitalId,
          quantity: BigInt(form.quantity),
          minQuantity: BigInt(form.minQuantity),
          expiryDate: expiryNs,
          supplierId,
        });
        toast.success('Medicine updated');
      } else {
        await addMedicine.mutateAsync({
          hospitalId,
          name: form.name,
          quantity: BigInt(form.quantity),
          minQuantity: BigInt(form.minQuantity),
          expiryDate: expiryNs,
          supplierId,
        });
        toast.success('Medicine added');
      }
      setShowForm(false);
    } catch {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async () => {
    if (deleteId == null) return;
    try {
      await deleteMedicine.mutateAsync({ id: deleteId, hospitalId });
      toast.success('Medicine deleted');
    } catch {
      toast.error('Delete failed');
    }
    setDeleteId(null);
  };

  const getStockStatus = (med: Medicine): string => {
    if (isExpired(med.expiryDate)) return 'expired';
    if (isExpiringSoon(med.expiryDate)) return 'expiring';
    if (med.quantity < med.minQuantity) return 'low';
    return 'normal';
  };

  const columns: Column<MedicineRow>[] = [
    { key: 'name', header: 'Name' },
    {
      key: 'quantity',
      header: 'Stock',
      render: (row) => (
        <span className={row.quantity < row.minQuantity ? 'text-warning font-medium' : ''}>
          {String(row.quantity)} / {String(row.minQuantity)} min
        </span>
      ),
    },
    {
      key: 'expiryDate',
      header: 'Expiry',
      render: (row) => {
        const expired = isExpired(row.expiryDate as bigint);
        const expiring = isExpiringSoon(row.expiryDate as bigint);
        return (
          <span className={expired ? 'text-destructive' : expiring ? 'text-warning' : ''}>
            {formatDate(row.expiryDate as bigint)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const status = getStockStatus(row as Medicine);
        if (status === 'expired') return <Badge variant="destructive">Expired</Badge>;
        if (status === 'expiring') return <Badge className="bg-warning text-warning-foreground">Expiring Soon</Badge>;
        if (status === 'low') return <Badge className="bg-warning/20 text-warning border-warning" variant="outline">Low Stock</Badge>;
        return <Badge variant="outline" className="text-success border-success">Normal</Badge>;
      },
    },
    {
      key: 'supplierId',
      header: 'Supplier',
      render: (row) => {
        if (row.supplierId == null) return <span className="text-muted-foreground">—</span>;
        const sup = suppliers.find((s) => s.id === row.supplierId);
        return sup ? sup.name : `#${String(row.supplierId)}`;
      },
    },
  ];

  const filterOptions = [
    { label: 'Low Stock', value: 'low' },
    { label: 'Expiring Soon', value: 'expiring' },
    { label: 'Expired', value: 'expired' },
    { label: 'Normal', value: 'normal' },
  ];

  const tableData: MedicineRow[] = medicines.map((m) => ({
    ...m,
    status: getStockStatus(m),
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Medicines</h1>
          <p className="text-sm text-muted-foreground">{medicines.length} medicines registered</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Medicine
        </Button>
      </div>

      <DataTable
        data={tableData}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search medicines..."
        filterOptions={filterOptions}
        filterKey="status"
        emptyMessage="No medicines found. Add your first medicine."
        actions={(row) => (
          <div className="flex items-center gap-1 justify-end">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row as Medicine)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => setDeleteId(row.id as bigint)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      />

      {/* Add/Edit Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMed ? 'Edit Medicine' : 'Add Medicine'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {!editingMed && (
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  placeholder="Medicine name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Min Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.minQuantity}
                  onChange={(e) => setForm((f) => ({ ...f, minQuantity: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Supplier (optional)</Label>
              <Select
                value={form.supplierId}
                onValueChange={(v) => setForm((f) => ({ ...f, supplierId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {suppliers.map((s) => (
                    <SelectItem key={String(s.id)} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMedicine.isPending || updateMedicine.isPending}>
                {(addMedicine.isPending || updateMedicine.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingMed ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteId != null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medicine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this medicine? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
