import React, { useState } from 'react';
import { Droplets, Pencil, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useGetAllBloodStock, useGetLowStockBloodGroups, useUpdateBloodStock } from '@/hooks/useQueries';
import { bloodGroupLabel } from '@/lib/utils';
import { BloodGroup, type HospitalId, type BloodStock } from '../../../backend';
import { toast } from 'sonner';

interface BloodBankPageProps {
  hospitalId: HospitalId;
}

const ALL_BLOOD_GROUPS: BloodGroup[] = [
  BloodGroup.Apos, BloodGroup.Aneg,
  BloodGroup.Bpos, BloodGroup.Bneg,
  BloodGroup.ABpos, BloodGroup.ABneg,
  BloodGroup.Opos, BloodGroup.Oneg,
];

export function BloodBankPage({ hospitalId }: BloodBankPageProps) {
  const { data: bloodStock = [], isLoading } = useGetAllBloodStock(hospitalId);
  const { data: lowGroups = [] } = useGetLowStockBloodGroups(hospitalId);
  const updateBloodStock = useUpdateBloodStock();

  const [editingGroup, setEditingGroup] = useState<BloodGroup | null>(null);
  const [form, setForm] = useState({ quantity: '', minQuantity: '' });

  const getStockForGroup = (bg: BloodGroup): BloodStock | undefined =>
    bloodStock.find((s) => s.bloodGroup === bg);

  const openEdit = (bg: BloodGroup) => {
    const stock = getStockForGroup(bg);
    setForm({
      quantity: stock ? String(stock.quantity) : '0',
      minQuantity: stock ? String(stock.minQuantity) : '10',
    });
    setEditingGroup(bg);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup) return;
    try {
      await updateBloodStock.mutateAsync({
        hospitalId,
        bloodGroup: editingGroup,
        quantity: BigInt(form.quantity),
        minQuantity: BigInt(form.minQuantity),
      });
      toast.success(`Blood stock updated for ${bloodGroupLabel(editingGroup)}`);
      setEditingGroup(null);
    } catch {
      toast.error('Failed to update blood stock');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Blood Bank</h1>
        <p className="text-sm text-muted-foreground">
          Manage blood group inventory for your hospital
        </p>
      </div>

      {lowGroups.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive">
            Low stock alert: {lowGroups.map(bloodGroupLabel).join(', ')}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 h-24" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ALL_BLOOD_GROUPS.map((bg) => {
            const stock = getStockForGroup(bg);
            const isLow = lowGroups.includes(bg);
            const qty = stock ? Number(stock.quantity) : 0;
            const minQty = stock ? Number(stock.minQuantity) : 0;
            const pct = minQty > 0 ? Math.min(100, Math.round((qty / minQty) * 100)) : 100;

            return (
              <Card
                key={bg}
                className={`relative overflow-hidden transition-all hover:shadow-card-hover ${
                  isLow ? 'border-destructive/50' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isLow ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                        <Droplets className={`h-4 w-4 ${isLow ? 'text-destructive' : 'text-primary'}`} />
                      </div>
                      <span className="font-bold text-lg">{bloodGroupLabel(bg)}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openEdit(bg)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Units</span>
                      <span className={`font-semibold ${isLow ? 'text-destructive' : 'text-foreground'}`}>
                        {qty}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isLow ? 'bg-destructive' : pct > 50 ? 'bg-success' : 'bg-warning'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Min: {minQty}</span>
                      {isLow && (
                        <Badge variant="destructive" className="text-[10px] h-4 px-1">
                          Low
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={editingGroup != null} onOpenChange={() => setEditingGroup(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Update Blood Stock — {editingGroup ? bloodGroupLabel(editingGroup) : ''}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Current Quantity (units)</Label>
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
              <Label>Minimum Quantity (units)</Label>
              <Input
                type="number"
                min="0"
                placeholder="10"
                value={form.minQuantity}
                onChange={(e) => setForm((f) => ({ ...f, minQuantity: e.target.value }))}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingGroup(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateBloodStock.isPending}>
                {updateBloodStock.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Update
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
