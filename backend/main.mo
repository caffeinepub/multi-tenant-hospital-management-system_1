import Runtime "mo:core/Runtime";
import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Timer "mo:core/Timer";
import Nat64 "mo:core/Nat64";
import Int64 "mo:core/Int64";
import Float "mo:core/Float";
import Principal "mo:core/Principal";
import MixinStorage "blob-storage/Mixin";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Authorization
  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);
  include MixinStorage();

  // Data types

  type HospitalId = Text;
  type MedicineId = Nat;
  type SupplierId = Nat;
  type DoctorId = Nat;
  type BedId = Nat;
  type BloodGroup = {
    #Apos;
    #Aneg;
    #Bpos;
    #Bneg;
    #ABpos;
    #ABneg;
    #Opos;
    #Oneg;
  };
  type BedType = { #general; #ICU };
  type BedStatus = { #available; #occupied };

  type AppRole = {
    #superAdmin;
    #hospitalAdmin;
    #doctor;
    #patient;
  };

  type UserProfile = {
    name : Text;
    appRole : AppRole;
    hospitalId : ?HospitalId;
  };

  type Medicine = {
    id : MedicineId;
    hospitalId : HospitalId;
    name : Text;
    quantity : Nat;
    minQuantity : Nat;
    expiryDate : Time.Time;
    supplierId : ?SupplierId;
  };

  type Supplier = {
    id : SupplierId;
    hospitalId : HospitalId;
    name : Text;
    contactInfo : Text;
  };

  type Bed = {
    id : BedId;
    hospitalId : HospitalId;
    bedType : BedType;
    status : BedStatus;
  };

  type BloodStock = {
    hospitalId : HospitalId;
    bloodGroup : BloodGroup;
    quantity : Nat;
    minQuantity : Nat;
  };

  // User profiles
  let userProfiles = Map.empty<Principal, UserProfile>();

  // State
  let medicines = Map.empty<MedicineId, Medicine>();
  let suppliers = Map.empty<SupplierId, Supplier>();
  let beds = Map.empty<BedId, Bed>();
  let bloodStocks = Map.empty<Text, BloodStock>();

  // ID counters
  var nextMedicineId = 1;
  var nextSupplierId = 1;
  var nextBedId = 1;

  // Helper: get caller's hospitalId from their profile
  func getCallerHospitalId(caller : Principal) : ?HospitalId {
    switch (userProfiles.get(caller)) {
      case (?profile) { profile.hospitalId };
      case (null) { null };
    };
  };

  // Helper: check if caller is a Super Admin
  func isSuperAdmin(caller : Principal) : Bool {
    switch (userProfiles.get(caller)) {
      case (?profile) {
        switch (profile.appRole) {
          case (#superAdmin) { true };
          case (_) { false };
        };
      };
      case (null) { false };
    };
  };

  // Helper: check if caller is a Hospital Admin for the given hospitalId
  func isHospitalAdmin(caller : Principal, hospitalId : HospitalId) : Bool {
    switch (userProfiles.get(caller)) {
      case (?profile) {
        switch (profile.appRole) {
          case (#hospitalAdmin) {
            switch (profile.hospitalId) {
              case (?hid) { hid == hospitalId };
              case (null) { false };
            };
          };
          case (_) { false };
        };
      };
      case (null) { false };
    };
  };

  // Helper: check if caller can manage the given hospital (super admin or hospital admin for that hospital)
  func canManageHospital(caller : Principal, hospitalId : HospitalId) : Bool {
    isSuperAdmin(caller) or isHospitalAdmin(caller, hospitalId)
  };

  // Helper: check if caller can view data for the given hospital
  func canViewHospital(caller : Principal, hospitalId : HospitalId) : Bool {
    if (isSuperAdmin(caller)) { return true };
    switch (userProfiles.get(caller)) {
      case (?profile) {
        switch (profile.hospitalId) {
          case (?hid) { hid == hospitalId };
          case (null) { false };
        };
      };
      case (null) { false };
    };
  };

  // Compare Functions
  module MedicineOrd {
    public func compareByExpiry(m1 : Medicine, m2 : Medicine) : Order.Order {
      Int.compare(m1.expiryDate, m2.expiryDate);
    };

    public func compare(m1 : Medicine, m2 : Medicine) : Order.Order {
      Nat.compare(m1.id, m2.id);
    };
  };

  module BedOrd {
    public func compareByType(b1 : Bed, b2 : Bed) : Order.Order {
      switch (b1.bedType, b2.bedType) {
        case (#general, #ICU) { #less };
        case (#ICU, #general) { #greater };
        case (_, _) { Nat.compare(b1.id, b2.id) };
      };
    };

    public func compareByStatus(b1 : Bed, b2 : Bed) : Order.Order {
      switch (b1.status, b2.status) {
        case (#available, #occupied) { #less };
        case (#occupied, #available) { #greater };
        case (_, _) { compareByType(b1, b2) };
      };
    };
  };

  // ── User Profile Management ──────────────────────────────────────────────

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can get their profile");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only authenticated users can save their profile");
    };
    // Prevent non-admins from self-assigning superAdmin role
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      switch (profile.appRole) {
        case (#superAdmin) {
          Runtime.trap("Unauthorized: Cannot self-assign Super Admin role");
        };
        case (_) {};
      };
    };
    userProfiles.add(caller, profile);
  };

  // Admin can assign profiles to any user (e.g., to set hospitalId and role)
  public shared ({ caller }) func assignUserProfile(user : Principal, profile : UserProfile) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can assign profiles to other users");
    };
    userProfiles.add(user, profile);
  };

  // ── Medicine Management ──────────────────────────────────────────────────

  public shared ({ caller }) func addMedicine(
    hospitalId : HospitalId,
    name : Text,
    quantity : Nat,
    minQuantity : Nat,
    expiryDate : Time.Time,
    supplierId : ?SupplierId,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to add medicines");
    };
    if (not canManageHospital(caller, hospitalId)) {
      Runtime.trap("Unauthorized: Only Hospital Admins or Super Admins can add medicines");
    };

    let id = nextMedicineId;
    nextMedicineId += 1;

    let medicine : Medicine = {
      id;
      hospitalId;
      name;
      quantity;
      minQuantity;
      expiryDate;
      supplierId;
    };

    medicines.add(id, medicine);
  };

  public shared ({ caller }) func updateMedicine(
    id : MedicineId,
    quantity : ?Nat,
    minQuantity : ?Nat,
    expiryDate : ?Time.Time,
    supplierId : ?SupplierId,
  ) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to update medicines");
    };
    switch (medicines.get(id)) {
      case (null) { Runtime.trap("Medicine not found") };
      case (?medicine) {
        if (not canManageHospital(caller, medicine.hospitalId)) {
          Runtime.trap("Unauthorized: Only Hospital Admins or Super Admins can update medicines");
        };
        let updatedMedicine = {
          medicine with
          quantity = switch (quantity) { case (?q) { q }; case (null) { medicine.quantity } };
          minQuantity = switch (minQuantity) {
            case (?mq) { mq };
            case (null) { medicine.minQuantity };
          };
          expiryDate = switch (expiryDate) { case (?ed) { ed }; case (null) { medicine.expiryDate } };
          supplierId = supplierId;
        };
        medicines.add(id, updatedMedicine);
      };
    };
  };

  public shared ({ caller }) func deleteMedicine(id : MedicineId) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to delete medicines");
    };
    switch (medicines.get(id)) {
      case (null) { Runtime.trap("Medicine not found") };
      case (?medicine) {
        if (not canManageHospital(caller, medicine.hospitalId)) {
          Runtime.trap("Unauthorized: Only Hospital Admins or Super Admins can delete medicines");
        };
        medicines.remove(id);
      };
    };
  };

  public query ({ caller }) func getLowStockMedicines(hospitalId : HospitalId) : async [Medicine] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to view medicines");
    };
    if (not canViewHospital(caller, hospitalId)) {
      Runtime.trap("Unauthorized: Cannot view medicines for this hospital");
    };
    let filtered = medicines.values().toArray().filter(
      func(med) {
        med.hospitalId == hospitalId and med.quantity < med.minQuantity
      }
    );
    filtered;
  };

  public query ({ caller }) func getExpiringMedicines(hospitalId : HospitalId) : async [Medicine] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to view medicines");
    };
    if (not canViewHospital(caller, hospitalId)) {
      Runtime.trap("Unauthorized: Cannot view medicines for this hospital");
    };
    let now = Time.now();
    let in7Days = now + (7 * 24 * 60 * 60 * 1_000_000_000);

    let filtered = medicines.values().toArray().filter(
      func(med) {
        med.hospitalId == hospitalId and med.expiryDate <= in7Days
      }
    );
    filtered.sort(MedicineOrd.compareByExpiry);
  };

  public query ({ caller }) func getAllMedicines(hospitalId : HospitalId) : async [Medicine] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to view medicines");
    };
    if (not canViewHospital(caller, hospitalId)) {
      Runtime.trap("Unauthorized: Cannot view medicines for this hospital");
    };
    medicines.values().toArray().filter(func(med) { med.hospitalId == hospitalId });
  };

  // ── Supplier Management ──────────────────────────────────────────────────

  public shared ({ caller }) func addSupplier(hospitalId : HospitalId, name : Text, contactInfo : Text) : async SupplierId {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to add suppliers");
    };
    if (not canManageHospital(caller, hospitalId)) {
      Runtime.trap("Unauthorized: Only Hospital Admins or Super Admins can add suppliers");
    };

    let id = nextSupplierId;
    nextSupplierId += 1;

    let supplier : Supplier = {
      id;
      hospitalId;
      name;
      contactInfo;
    };

    suppliers.add(id, supplier);
    id;
  };

  public shared ({ caller }) func updateSupplier(id : SupplierId, contactInfo : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to update suppliers");
    };
    switch (suppliers.get(id)) {
      case (null) { Runtime.trap("Supplier not found") };
      case (?supplier) {
        if (not canManageHospital(caller, supplier.hospitalId)) {
          Runtime.trap("Unauthorized: Only Hospital Admins or Super Admins can update suppliers");
        };
        let updatedSupplier = { supplier with contactInfo };
        suppliers.add(id, updatedSupplier);
      };
    };
  };

  public query ({ caller }) func getMedicinesBySupplier(supplierId : SupplierId) : async [Medicine] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to view medicines by supplier");
    };
    // Scope results to caller's hospital unless super admin
    let callerHospitalId = getCallerHospitalId(caller);
    medicines.values().toArray().filter(
      func(med) {
        let supplierMatch = switch (med.supplierId) {
          case (?sid) { sid == supplierId };
          case (null) { false };
        };
        if (not supplierMatch) { return false };
        if (isSuperAdmin(caller)) { return true };
        switch (callerHospitalId) {
          case (?hid) { med.hospitalId == hid };
          case (null) { false };
        };
      }
    );
  };

  public query ({ caller }) func getAllSuppliers(hospitalId : HospitalId) : async [Supplier] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to view suppliers");
    };
    if (not canViewHospital(caller, hospitalId)) {
      Runtime.trap("Unauthorized: Cannot view suppliers for this hospital");
    };
    suppliers.values().toArray().filter(func(s) { s.hospitalId == hospitalId });
  };

  // ── Bed Management ───────────────────────────────────────────────────────

  public shared ({ caller }) func addBed(hospitalId : HospitalId, bedType : BedType) : async BedId {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to add beds");
    };
    if (not canManageHospital(caller, hospitalId)) {
      Runtime.trap("Unauthorized: Only Hospital Admins or Super Admins can add beds");
    };

    let id = nextBedId;
    nextBedId += 1;

    let bed : Bed = {
      id;
      hospitalId;
      bedType;
      status = #available;
    };

    beds.add(id, bed);
    id;
  };

  public shared ({ caller }) func updateBedStatus(id : BedId, status : BedStatus) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to update bed status");
    };
    switch (beds.get(id)) {
      case (null) { Runtime.trap("Bed not found") };
      case (?bed) {
        if (not canManageHospital(caller, bed.hospitalId)) {
          Runtime.trap("Unauthorized: Only Hospital Admins or Super Admins can update bed status");
        };
        let updatedBed = { bed with status };
        beds.add(id, updatedBed);
      };
    };
  };

  public query ({ caller }) func getBedStats(hospitalId : HospitalId) : async {
    total : Nat;
    available : Nat;
    icuAvailable : Nat;
    occupied : Nat;
    icuOccupied : Nat;
  } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to view bed stats");
    };
    if (not canViewHospital(caller, hospitalId)) {
      Runtime.trap("Unauthorized: Cannot view bed stats for this hospital");
    };

    var total = 0 : Nat;
    var available = 0 : Nat;
    var icuAvailable = 0 : Nat;
    var occupied = 0 : Nat;
    var icuOccupied = 0 : Nat;

    for (bed in beds.values()) {
      if (bed.hospitalId == hospitalId) {
        total += 1;
        switch (bed.status) {
          case (#available) {
            available += 1;
            if (bed.bedType == #ICU) { icuAvailable += 1 };
          };
          case (#occupied) {
            occupied += 1;
            if (bed.bedType == #ICU) { icuOccupied += 1 };
          };
        };
      };
    };

    {
      total;
      available;
      icuAvailable;
      occupied;
      icuOccupied;
    };
  };

  // ── Blood Bank Management ────────────────────────────────────────────────

  public shared ({ caller }) func updateBloodStock(hospitalId : HospitalId, bloodGroup : BloodGroup, quantity : Nat, minQuantity : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to update blood stock");
    };
    if (not canManageHospital(caller, hospitalId)) {
      Runtime.trap("Unauthorized: Only Hospital Admins or Super Admins can update blood stock");
    };

    let key = hospitalId # "_" # bloodGroupToText(bloodGroup);
    let bloodStock : BloodStock = {
      hospitalId;
      bloodGroup;
      quantity;
      minQuantity;
    };

    bloodStocks.add(key, bloodStock);
  };

  public query ({ caller }) func getLowStockBloodGroups(hospitalId : HospitalId) : async [BloodGroup] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to view blood stock");
    };
    if (not canViewHospital(caller, hospitalId)) {
      Runtime.trap("Unauthorized: Cannot view blood stock for this hospital");
    };

    let result = List.empty<BloodGroup>();

    for ((key, bs) in bloodStocks.entries()) {
      if (bs.hospitalId == hospitalId and bs.quantity < bs.minQuantity) {
        result.add(bs.bloodGroup);
      };
    };

    result.toArray();
  };

  public query ({ caller }) func getAllBloodStock(hospitalId : HospitalId) : async [BloodStock] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to view blood stock");
    };
    if (not canViewHospital(caller, hospitalId)) {
      Runtime.trap("Unauthorized: Cannot view blood stock for this hospital");
    };

    let result = List.empty<BloodStock>();
    for ((key, bs) in bloodStocks.entries()) {
      if (bs.hospitalId == hospitalId) {
        result.add(bs);
      };
    };
    result.toArray();
  };

  // ── Bed Queries ──────────────────────────────────────────────────────────

  public query ({ caller }) func getBedStatsLegacy(hospitalId : HospitalId) : async {
    totalBeds : Nat;
    availableBeds : Nat;
    icuBeds : Nat;
    occupiedBeds : Nat;
  } {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to view bed stats");
    };
    if (not canViewHospital(caller, hospitalId)) {
      Runtime.trap("Unauthorized: Cannot view bed stats for this hospital");
    };

    var totalBeds = 0 : Nat;
    var availableBeds = 0 : Nat;
    var icuBeds = 0 : Nat;
    var occupiedBeds = 0 : Nat;

    for (bed in beds.values()) {
      if (bed.hospitalId == hospitalId) {
        totalBeds += 1;
        switch (bed.status) {
          case (#available) {
            availableBeds += 1;
            if (bed.bedType == #ICU) { icuBeds += 1 };
          };
          case (#occupied) {
            occupiedBeds += 1;
            if (bed.bedType == #ICU) { icuBeds += 1 };
          };
        };
      };
    };

    {
      totalBeds;
      availableBeds;
      icuBeds;
      occupiedBeds;
    };
  };

  public query ({ caller }) func getBed(id : BedId) : async ?Bed {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to view beds");
    };
    switch (beds.get(id)) {
      case (null) { null };
      case (?bed) {
        if (not canViewHospital(caller, bed.hospitalId)) {
          Runtime.trap("Unauthorized: Cannot view beds for this hospital");
        };
        ?bed;
      };
    };
  };

  public query ({ caller }) func getBedsByTypeAndStatus(hospitalId : HospitalId, bedType : BedType, status : BedStatus) : async [Bed] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to view beds");
    };
    if (not canViewHospital(caller, hospitalId)) {
      Runtime.trap("Unauthorized: Cannot view beds for this hospital");
    };
    let filteredBeds = beds.values().toArray().filter(
      func(bed) { bed.hospitalId == hospitalId and bed.bedType == bedType and bed.status == status }
    );
    filteredBeds.sort(BedOrd.compareByType);
  };

  public query ({ caller }) func getBedsByStatus(hospitalId : HospitalId, status : BedStatus) : async [Bed] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Must be authenticated to view beds");
    };
    if (not canViewHospital(caller, hospitalId)) {
      Runtime.trap("Unauthorized: Cannot view beds for this hospital");
    };
    let filteredBeds = beds.values().toArray().filter(
      func(bed) { bed.hospitalId == hospitalId and bed.status == status }
    );
    filteredBeds.sort(BedOrd.compareByStatus);
  };

  // ── Helper Functions ─────────────────────────────────────────────────────

  func bloodGroupToText(bg : BloodGroup) : Text {
    switch (bg) {
      case (#Apos) { "Apos" };
      case (#Aneg) { "Aneg" };
      case (#Bpos) { "Bpos" };
      case (#Bneg) { "Bneg" };
      case (#ABpos) { "ABpos" };
      case (#ABneg) { "ABneg" };
      case (#Opos) { "Opos" };
      case (#Oneg) { "Oneg" };
    };
  };
};
