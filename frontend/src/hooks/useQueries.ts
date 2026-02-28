import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import {
  type UserProfile,
  type Medicine,
  type Supplier,
  type Bed,
  type BloodStock,
  type HospitalId,
  type MedicineId,
  type SupplierId,
  type BedId,
  AppRole,
  BedType,
  BedStatus,
  BloodGroup,
} from '../backend';

// ── User Profile ──────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useAssignUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, profile }: { user: string; profile: UserProfile }) => {
      if (!actor) throw new Error('Actor not available');
      const { Principal } = await import('@dfinity/principal');
      return actor.assignUserProfile(Principal.fromText(user), profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ── Medicines ─────────────────────────────────────────────────────────────

export function useGetAllMedicines(hospitalId: HospitalId | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Medicine[]>({
    queryKey: ['medicines', hospitalId],
    queryFn: async () => {
      if (!actor || !hospitalId) return [];
      return actor.getAllMedicines(hospitalId);
    },
    enabled: !!actor && !isFetching && !!hospitalId,
  });
}

export function useGetLowStockMedicines(hospitalId: HospitalId | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Medicine[]>({
    queryKey: ['medicines-low-stock', hospitalId],
    queryFn: async () => {
      if (!actor || !hospitalId) return [];
      return actor.getLowStockMedicines(hospitalId);
    },
    enabled: !!actor && !isFetching && !!hospitalId,
  });
}

export function useGetExpiringMedicines(hospitalId: HospitalId | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Medicine[]>({
    queryKey: ['medicines-expiring', hospitalId],
    queryFn: async () => {
      if (!actor || !hospitalId) return [];
      return actor.getExpiringMedicines(hospitalId);
    },
    enabled: !!actor && !isFetching && !!hospitalId,
  });
}

export function useAddMedicine() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      hospitalId: HospitalId;
      name: string;
      quantity: bigint;
      minQuantity: bigint;
      expiryDate: bigint;
      supplierId: SupplierId | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addMedicine(
        params.hospitalId,
        params.name,
        params.quantity,
        params.minQuantity,
        params.expiryDate,
        params.supplierId
      );
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['medicines', vars.hospitalId] });
      queryClient.invalidateQueries({ queryKey: ['medicines-low-stock', vars.hospitalId] });
      queryClient.invalidateQueries({ queryKey: ['medicines-expiring', vars.hospitalId] });
    },
  });
}

export function useUpdateMedicine() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: MedicineId;
      hospitalId: HospitalId;
      quantity: bigint | null;
      minQuantity: bigint | null;
      expiryDate: bigint | null;
      supplierId: SupplierId | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateMedicine(
        params.id,
        params.quantity,
        params.minQuantity,
        params.expiryDate,
        params.supplierId
      );
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['medicines', vars.hospitalId] });
      queryClient.invalidateQueries({ queryKey: ['medicines-low-stock', vars.hospitalId] });
      queryClient.invalidateQueries({ queryKey: ['medicines-expiring', vars.hospitalId] });
    },
  });
}

export function useDeleteMedicine() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, hospitalId }: { id: MedicineId; hospitalId: HospitalId }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMedicine(id);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['medicines', vars.hospitalId] });
      queryClient.invalidateQueries({ queryKey: ['medicines-low-stock', vars.hospitalId] });
      queryClient.invalidateQueries({ queryKey: ['medicines-expiring', vars.hospitalId] });
    },
  });
}

// ── Suppliers ─────────────────────────────────────────────────────────────

export function useGetAllSuppliers(hospitalId: HospitalId | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<Supplier[]>({
    queryKey: ['suppliers', hospitalId],
    queryFn: async () => {
      if (!actor || !hospitalId) return [];
      return actor.getAllSuppliers(hospitalId);
    },
    enabled: !!actor && !isFetching && !!hospitalId,
  });
}

export function useAddSupplier() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { hospitalId: HospitalId; name: string; contactInfo: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addSupplier(params.hospitalId, params.name, params.contactInfo);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', vars.hospitalId] });
    },
  });
}

export function useUpdateSupplier() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: SupplierId; hospitalId: HospitalId; contactInfo: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateSupplier(params.id, params.contactInfo);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', vars.hospitalId] });
    },
  });
}

// ── Beds ──────────────────────────────────────────────────────────────────

export function useGetBedStats(hospitalId: HospitalId | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['bed-stats', hospitalId],
    queryFn: async () => {
      if (!actor || !hospitalId) return null;
      return actor.getBedStats(hospitalId);
    },
    enabled: !!actor && !isFetching && !!hospitalId,
  });
}

export function useGetBedsByStatus(hospitalId: HospitalId | undefined, status: BedStatus) {
  const { actor, isFetching } = useActor();

  return useQuery<Bed[]>({
    queryKey: ['beds-by-status', hospitalId, status],
    queryFn: async () => {
      if (!actor || !hospitalId) return [];
      return actor.getBedsByStatus(hospitalId, status);
    },
    enabled: !!actor && !isFetching && !!hospitalId,
  });
}

export function useAddBed() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { hospitalId: HospitalId; bedType: BedType }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addBed(params.hospitalId, params.bedType);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['bed-stats', vars.hospitalId] });
      queryClient.invalidateQueries({ queryKey: ['beds-by-status', vars.hospitalId] });
    },
  });
}

export function useUpdateBedStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: BedId; hospitalId: HospitalId; status: BedStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateBedStatus(params.id, params.status);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['bed-stats', vars.hospitalId] });
      queryClient.invalidateQueries({ queryKey: ['beds-by-status', vars.hospitalId] });
    },
  });
}

// ── Blood Stock ───────────────────────────────────────────────────────────

export function useGetAllBloodStock(hospitalId: HospitalId | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<BloodStock[]>({
    queryKey: ['blood-stock', hospitalId],
    queryFn: async () => {
      if (!actor || !hospitalId) return [];
      return actor.getAllBloodStock(hospitalId);
    },
    enabled: !!actor && !isFetching && !!hospitalId,
  });
}

export function useGetLowStockBloodGroups(hospitalId: HospitalId | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery<BloodGroup[]>({
    queryKey: ['blood-stock-low', hospitalId],
    queryFn: async () => {
      if (!actor || !hospitalId) return [];
      return actor.getLowStockBloodGroups(hospitalId);
    },
    enabled: !!actor && !isFetching && !!hospitalId,
  });
}

export function useUpdateBloodStock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      hospitalId: HospitalId;
      bloodGroup: BloodGroup;
      quantity: bigint;
      minQuantity: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateBloodStock(
        params.hospitalId,
        params.bloodGroup,
        params.quantity,
        params.minQuantity
      );
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['blood-stock', vars.hospitalId] });
      queryClient.invalidateQueries({ queryKey: ['blood-stock-low', vars.hospitalId] });
    },
  });
}
