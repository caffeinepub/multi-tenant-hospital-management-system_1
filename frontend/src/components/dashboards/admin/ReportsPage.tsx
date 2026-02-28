import React from 'react';
import { FileDown, Pill, BedDouble, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useGetAllMedicines,
  useGetBedStats,
  useGetBedsByStatus,
  useGetAllBloodStock,
} from '@/hooks/useQueries';
import { formatDate, isExpired, isExpiringSoon, bloodGroupLabel } from '@/lib/utils';
import { exportToPDF } from '@/utils/pdfExport';
import { BedStatus, type HospitalId } from '../../../backend';

interface ReportsPageProps {
  hospitalId: HospitalId;
}

export function ReportsPage({ hospitalId }: ReportsPageProps) {
  const { data: medicines = [], isLoading: medsLoading } = useGetAllMedicines(hospitalId);
  const { data: bedStats } = useGetBedStats(hospitalId);
  const { data: availableBeds = [] } = useGetBedsByStatus(hospitalId, BedStatus.available);
  const { data: occupiedBeds = [] } = useGetBedsByStatus(hospitalId, BedStatus.occupied);
  const { data: bloodStock = [], isLoading: bloodLoading } = useGetAllBloodStock(hospitalId);

  const allBeds = [...availableBeds, ...occupiedBeds];

  const handleExportMedicines = () => {
    exportToPDF({
      title: 'Medicine Stock Report',
      subtitle: `Hospital: ${hospitalId}`,
      columns: [
        { header: 'Medicine Name', key: 'name' },
        { header: 'Quantity', key: 'quantity' },
        { header: 'Min Quantity', key: 'minQuantity' },
        { header: 'Expiry Date', key: 'expiryDate' },
        { header: 'Status', key: 'status' },
      ],
      rows: medicines.map((m) => ({
        name: m.name,
        quantity: String(m.quantity),
        minQuantity: String(m.minQuantity),
        expiryDate: formatDate(m.expiryDate),
        status: isExpired(m.expiryDate)
          ? 'Expired'
          : isExpiringSoon(m.expiryDate)
          ? 'Expiring Soon'
          : m.quantity < m.minQuantity
          ? 'Low Stock'
          : 'Normal',
      })),
    });
  };

  const handleExportBeds = () => {
    exportToPDF({
      title: 'Bed Occupancy Report',
      subtitle: `Hospital: ${hospitalId}`,
      columns: [
        { header: 'Bed ID', key: 'id' },
        { header: 'Type', key: 'bedType' },
        { header: 'Status', key: 'status' },
      ],
      rows: allBeds.map((b) => ({
        id: `#${String(b.id)}`,
        bedType: b.bedType === 'ICU' ? 'ICU' : 'General',
        status: b.status === 'available' ? 'Available' : 'Occupied',
      })),
    });
  };

  const handleExportBlood = () => {
    exportToPDF({
      title: 'Blood Stock Report',
      subtitle: `Hospital: ${hospitalId}`,
      columns: [
        { header: 'Blood Group', key: 'bloodGroup' },
        { header: 'Quantity (units)', key: 'quantity' },
        { header: 'Min Quantity', key: 'minQuantity' },
        { header: 'Status', key: 'status' },
      ],
      rows: bloodStock.map((bs) => ({
        bloodGroup: bloodGroupLabel(bs.bloodGroup),
        quantity: String(bs.quantity),
        minQuantity: String(bs.minQuantity),
        status: bs.quantity < bs.minQuantity ? 'Low Stock' : 'Normal',
      })),
    });
  };

  const occupancyPct = bedStats
    ? Math.round((Number(bedStats.occupied) / Math.max(Number(bedStats.total), 1)) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Generate and export hospital reports
        </p>
      </div>

      <Tabs defaultValue="medicines">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="medicines">
            <Pill className="h-3.5 w-3.5 mr-1.5" />
            Medicines
          </TabsTrigger>
          <TabsTrigger value="beds">
            <BedDouble className="h-3.5 w-3.5 mr-1.5" />
            Beds
          </TabsTrigger>
          <TabsTrigger value="blood">
            <Droplets className="h-3.5 w-3.5 mr-1.5" />
            Blood Stock
          </TabsTrigger>
        </TabsList>

        {/* Medicine Stock Report */}
        <TabsContent value="medicines">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Medicine Stock Report</CardTitle>
              <Button size="sm" variant="outline" onClick={handleExportMedicines}>
                <FileDown className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </CardHeader>
            <CardContent>
              {medsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Name</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Min Qty</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No medicines found
                          </TableCell>
                        </TableRow>
                      ) : (
                        medicines.map((med) => {
                          const expired = isExpired(med.expiryDate);
                          const expiring = isExpiringSoon(med.expiryDate);
                          const lowStock = med.quantity < med.minQuantity;
                          return (
                            <TableRow key={String(med.id)}>
                              <TableCell className="font-medium">{med.name}</TableCell>
                              <TableCell>{String(med.quantity)}</TableCell>
                              <TableCell>{String(med.minQuantity)}</TableCell>
                              <TableCell className={expired ? 'text-destructive' : expiring ? 'text-warning' : ''}>
                                {formatDate(med.expiryDate)}
                              </TableCell>
                              <TableCell>
                                {expired ? (
                                  <Badge variant="destructive">Expired</Badge>
                                ) : expiring ? (
                                  <Badge className="bg-warning text-warning-foreground">Expiring Soon</Badge>
                                ) : lowStock ? (
                                  <Badge variant="outline" className="text-warning border-warning">Low Stock</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-success border-success">Normal</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bed Occupancy Report */}
        <TabsContent value="beds">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Bed Occupancy Report</CardTitle>
              <Button size="sm" variant="outline" onClick={handleExportBeds}>
                <FileDown className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {bedStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Total', value: String(bedStats.total), color: 'text-foreground' },
                    { label: 'Available', value: String(bedStats.available), color: 'text-success' },
                    { label: 'Occupied', value: String(bedStats.occupied), color: 'text-warning' },
                    { label: 'Occupancy', value: `${occupancyPct}%`, color: occupancyPct > 80 ? 'text-destructive' : 'text-foreground' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="p-3 rounded-lg border text-center">
                      <p className={`text-xl font-bold ${color}`}>{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Bed ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allBeds.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No beds found
                        </TableCell>
                      </TableRow>
                    ) : (
                      allBeds.map((bed) => (
                        <TableRow key={String(bed.id)}>
                          <TableCell className="font-mono">#{String(bed.id)}</TableCell>
                          <TableCell>
                            <Badge variant={bed.bedType === 'ICU' ? 'destructive' : 'secondary'}>
                              {bed.bedType === 'ICU' ? 'ICU' : 'General'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                bed.status === 'available'
                                  ? 'text-success border-success'
                                  : 'text-destructive border-destructive'
                              }
                            >
                              {bed.status === 'available' ? 'Available' : 'Occupied'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blood Stock Report */}
        <TabsContent value="blood">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Blood Stock Report</CardTitle>
              <Button size="sm" variant="outline" onClick={handleExportBlood}>
                <FileDown className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </CardHeader>
            <CardContent>
              {bloodLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Blood Group</TableHead>
                        <TableHead>Quantity (units)</TableHead>
                        <TableHead>Min Quantity</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bloodStock.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No blood stock data found
                          </TableCell>
                        </TableRow>
                      ) : (
                        bloodStock.map((bs) => {
                          const isLow = bs.quantity < bs.minQuantity;
                          return (
                            <TableRow key={bs.bloodGroup}>
                              <TableCell className="font-bold">{bloodGroupLabel(bs.bloodGroup)}</TableCell>
                              <TableCell>{String(bs.quantity)}</TableCell>
                              <TableCell>{String(bs.minQuantity)}</TableCell>
                              <TableCell>
                                {isLow ? (
                                  <Badge variant="destructive">Low Stock</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-success border-success">Normal</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
