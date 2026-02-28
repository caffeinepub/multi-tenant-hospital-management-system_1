import React, { useState } from 'react';
import { Plus, Loader2, BedDouble } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatCard } from '@/components/common/StatCard';
import { useGetBedStats, useGetBedsByStatus, useAddBed, useUpdateBedStatus } from '@/hooks/useQueries';
import { BedType, BedStatus, type Bed, type HospitalId } from '../../../backend';
import { toast } from 'sonner';

interface BedsPageProps {
  hospitalId: HospitalId;
}

type BedRow = Bed & Record<string, unknown>;

export function BedsPage({ hospitalId }: BedsPageProps) {
  const { data: bedStats, isLoading: statsLoading } = useGetBedStats(hospitalId);
  const { data: availableBeds = [], isLoading: bedsLoading } = useGetBedsByStatus(hospitalId, BedStatus.available);
  const { data: occupiedBeds = [] } = useGetBedsByStatus(hospitalId, BedStatus.occupied);
  const addBed = useAddBed();
  const updateBedStatus = useUpdateBedStatus();

  const [showAddModal, setShowAddModal] = useState(false);
  const [bedType, setBedType] = useState<BedType>(BedType.general);

  const allBeds: BedRow[] = [...availableBeds, ...occupiedBeds].map((b) => ({
    ...b,
  }));

  const handleAddBed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addBed.mutateAsync({ hospitalId, bedType });
      toast.success('Bed added');
      setShowAddModal(false);
    } catch {
      toast.error('Failed to add bed');
    }
  };

  const handleToggleStatus = async (bed: Bed) => {
    const newStatus = bed.status === BedStatus.available ? BedStatus.occupied : BedStatus.available;
    try {
      await updateBedStatus.mutateAsync({ id: bed.id, hospitalId, status: newStatus });
      toast.success(`Bed marked as ${newStatus}`);
    } catch {
      toast.error('Failed to update bed status');
    }
  };

  const columns: Column<BedRow>[] = [
    {
      key: 'id',
      header: 'Bed ID',
      render: (row) => <span className="font-mono text-sm">#{String(row.id)}</span>,
    },
    {
      key: 'bedType',
      header: 'Type',
      render: (row) => (
        <Badge variant={row.bedType === BedType.ICU ? 'destructive' : 'secondary'}>
          {row.bedType === BedType.ICU ? 'ICU' : 'General'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge
          variant="outline"
          className={
            row.status === BedStatus.available
              ? 'text-success border-success'
              : 'text-destructive border-destructive'
          }
        >
          {row.status === BedStatus.available ? 'Available' : 'Occupied'}
        </Badge>
      ),
    },
  ];

  const filterOptions = [
    { label: 'Available', value: BedStatus.available },
    { label: 'Occupied', value: BedStatus.occupied },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Bed Management</h1>
          <p className="text-sm text-muted-foreground">
            {bedStats ? String(bedStats.total) : 0} total beds
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Bed
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Beds"
          value={bedStats ? String(bedStats.total) : '—'}
          icon={BedDouble}
          color="primary"
          isLoading={statsLoading}
        />
        <StatCard
          title="Available"
          value={bedStats ? String(bedStats.available) : '—'}
          icon={BedDouble}
          color="success"
          isLoading={statsLoading}
        />
        <StatCard
          title="Occupied"
          value={bedStats ? String(bedStats.occupied) : '—'}
          icon={BedDouble}
          color="warning"
          isLoading={statsLoading}
        />
        <StatCard
          title="ICU Available"
          value={bedStats ? String(bedStats.icuAvailable) : '—'}
          icon={BedDouble}
          color="destructive"
          isLoading={statsLoading}
        />
      </div>

      <DataTable
        data={allBeds}
        columns={columns}
        isLoading={bedsLoading}
        searchPlaceholder="Search beds..."
        filterOptions={filterOptions}
        filterKey="status"
        emptyMessage="No beds found. Add beds to get started."
        actions={(row) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleStatus(row as Bed)}
            disabled={updateBedStatus.isPending}
            className="text-xs"
          >
            {row.status === BedStatus.available ? 'Mark Occupied' : 'Mark Available'}
          </Button>
        )}
      />

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add New Bed</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddBed} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Bed Type</Label>
              <Select value={bedType} onValueChange={(v) => setBedType(v as BedType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BedType.general}>General</SelectItem>
                  <SelectItem value={BedType.ICU}>ICU</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addBed.isPending}>
                {addBed.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Bed
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
