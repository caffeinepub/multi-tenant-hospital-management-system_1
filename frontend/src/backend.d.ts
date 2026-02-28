import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type BedId = bigint;
export type Time = bigint;
export interface BloodStock {
    hospitalId: HospitalId;
    bloodGroup: BloodGroup;
    quantity: bigint;
    minQuantity: bigint;
}
export interface Bed {
    id: BedId;
    status: BedStatus;
    bedType: BedType;
    hospitalId: HospitalId;
}
export type MedicineId = bigint;
export type SupplierId = bigint;
export interface Medicine {
    id: MedicineId;
    expiryDate: Time;
    name: string;
    hospitalId: HospitalId;
    quantity: bigint;
    minQuantity: bigint;
    supplierId?: SupplierId;
}
export interface Supplier {
    id: SupplierId;
    contactInfo: string;
    name: string;
    hospitalId: HospitalId;
}
export interface UserProfile {
    appRole: AppRole;
    name: string;
    hospitalId?: HospitalId;
}
export type HospitalId = string;
export enum AppRole {
    patient = "patient",
    doctor = "doctor",
    superAdmin = "superAdmin",
    hospitalAdmin = "hospitalAdmin"
}
export enum BedStatus {
    occupied = "occupied",
    available = "available"
}
export enum BedType {
    ICU = "ICU",
    general = "general"
}
export enum BloodGroup {
    Aneg = "Aneg",
    Apos = "Apos",
    Bneg = "Bneg",
    Bpos = "Bpos",
    Oneg = "Oneg",
    Opos = "Opos",
    ABneg = "ABneg",
    ABpos = "ABpos"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addBed(hospitalId: HospitalId, bedType: BedType): Promise<BedId>;
    addMedicine(hospitalId: HospitalId, name: string, quantity: bigint, minQuantity: bigint, expiryDate: Time, supplierId: SupplierId | null): Promise<void>;
    addSupplier(hospitalId: HospitalId, name: string, contactInfo: string): Promise<SupplierId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignUserProfile(user: Principal, profile: UserProfile): Promise<void>;
    deleteMedicine(id: MedicineId): Promise<void>;
    getAllBloodStock(hospitalId: HospitalId): Promise<Array<BloodStock>>;
    getAllMedicines(hospitalId: HospitalId): Promise<Array<Medicine>>;
    getAllSuppliers(hospitalId: HospitalId): Promise<Array<Supplier>>;
    getBed(id: BedId): Promise<Bed | null>;
    getBedStats(hospitalId: HospitalId): Promise<{
        total: bigint;
        occupied: bigint;
        available: bigint;
        icuOccupied: bigint;
        icuAvailable: bigint;
    }>;
    getBedStatsLegacy(hospitalId: HospitalId): Promise<{
        icuBeds: bigint;
        occupiedBeds: bigint;
        totalBeds: bigint;
        availableBeds: bigint;
    }>;
    getBedsByStatus(hospitalId: HospitalId, status: BedStatus): Promise<Array<Bed>>;
    getBedsByTypeAndStatus(hospitalId: HospitalId, bedType: BedType, status: BedStatus): Promise<Array<Bed>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getExpiringMedicines(hospitalId: HospitalId): Promise<Array<Medicine>>;
    getLowStockBloodGroups(hospitalId: HospitalId): Promise<Array<BloodGroup>>;
    getLowStockMedicines(hospitalId: HospitalId): Promise<Array<Medicine>>;
    getMedicinesBySupplier(supplierId: SupplierId): Promise<Array<Medicine>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateBedStatus(id: BedId, status: BedStatus): Promise<void>;
    updateBloodStock(hospitalId: HospitalId, bloodGroup: BloodGroup, quantity: bigint, minQuantity: bigint): Promise<void>;
    updateMedicine(id: MedicineId, quantity: bigint | null, minQuantity: bigint | null, expiryDate: Time | null, supplierId: SupplierId | null): Promise<void>;
    updateSupplier(id: SupplierId, contactInfo: string): Promise<void>;
}
