import React, { useState } from 'react';
import { Bell, AlertTriangle, Package, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useGetLowStockMedicines, useGetExpiringMedicines, useGetLowStockBloodGroups } from '@/hooks/useQueries';
import { bloodGroupLabel, formatDate } from '@/lib/utils';
import type { HospitalId } from '../backend';

interface AlertNotificationsProps {
  hospitalId: HospitalId | undefined;
}

export function AlertNotifications({ hospitalId }: AlertNotificationsProps) {
  const [open, setOpen] = useState(false);

  const { data: lowStockMeds = [] } = useGetLowStockMedicines(hospitalId);
  const { data: expiringMeds = [] } = useGetExpiringMedicines(hospitalId);
  const { data: lowBloodGroups = [] } = useGetLowStockBloodGroups(hospitalId);

  const totalAlerts = lowStockMeds.length + expiringMeds.length + lowBloodGroups.length;

  if (!hospitalId) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          <Bell className="h-4 w-4" />
          {totalAlerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {totalAlerts > 9 ? '9+' : totalAlerts}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <p className="text-xs text-muted-foreground">{totalAlerts} active alerts</p>
        </div>
        <ScrollArea className="max-h-80">
          {totalAlerts === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No alerts at this time
            </div>
          ) : (
            <div className="divide-y">
              {lowStockMeds.map((med) => (
                <div key={String(med.id)} className="flex items-start gap-3 p-3 hover:bg-muted/30">
                  <div className="p-1.5 rounded-md bg-warning/10 flex-shrink-0 mt-0.5">
                    <Package className="h-3.5 w-3.5 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">Low Stock: {med.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {String(med.quantity)} units remaining (min: {String(med.minQuantity)})
                    </p>
                  </div>
                </div>
              ))}
              {expiringMeds.map((med) => (
                <div key={`exp-${String(med.id)}`} className="flex items-start gap-3 p-3 hover:bg-muted/30">
                  <div className="p-1.5 rounded-md bg-destructive/10 flex-shrink-0 mt-0.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">Expiring: {med.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires: {formatDate(med.expiryDate)}
                    </p>
                  </div>
                </div>
              ))}
              {lowBloodGroups.map((bg) => (
                <div key={bg} className="flex items-start gap-3 p-3 hover:bg-muted/30">
                  <div className="p-1.5 rounded-md bg-destructive/10 flex-shrink-0 mt-0.5">
                    <Droplets className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">Low Blood Stock: {bloodGroupLabel(bg)}</p>
                    <p className="text-xs text-muted-foreground">Below minimum threshold</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
