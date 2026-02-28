# Specification

## Summary
**Goal:** Build MediCore HMS, a multi-tenant Hospital Management System with Internet Identity authentication, role-based access control, and comprehensive hospital operations management across four dashboards.

**Planned changes:**

### Authentication & Authorization
- Internet Identity as the sole login method; no JWT or passwords stored
- Four roles mapped to principals: Super Admin, Hospital Admin, Doctor, Patient
- Role-based access control enforced on all backend endpoints

### Backend (Motoko, single actor, stable storage)
- Multi-tenancy: all records (Hospital Admin, Doctor, Supplier, Medicine, Bed, BloodStock, Appointment) scoped by `hospitalId`
- Data models and CRUD for: Users, Hospitals, Medicines, Suppliers, Beds, BloodStock, Appointments, Reports
- Medicine Management: stock tracking, low stock alerts (stock < minimum), expiry alerts (≤7 days or expired), auto-deduct on treatment
- Supplier Management: create/update suppliers, link medicines to suppliers, query medicines by supplier
- Bed Management: type (General/ICU), status (Available/Occupied), stats query (total, available, occupied, ICU counts)
- Blood Bank Management: all 8 ABO/Rh blood groups per hospital, low blood stock alerts
- Doctor Management: name, specialization, availability schedule; add/update by Hospital Admin
- Appointment System: patient booking, doctor view (own appointments), Hospital Admin view (all), status updates (scheduled/completed/cancelled)
- Reports module: medicine stock, bed occupancy rate, blood stock levels — per hospital; Super Admin aggregates across all hospitals

### Frontend Dashboards
- **Super Admin Dashboard:** stats cards (total hospitals, total users), hospitals table with status, create hospital form, assign Hospital Admin principal, system-wide report summaries
- **Hospital Admin Dashboard:** collapsible sidebar linking to Medicines, Suppliers, Beds, Blood Bank, Doctors, Appointments, Staff, Reports; summary stat cards on home; searchable/filterable data tables with add/edit forms per module
- **Doctor Dashboard:** assigned appointments list, update appointment status and treatment notes, medicine availability panel; treatment update triggers stock deduction
- **Patient Dashboard:** book appointments with doctor slot picker, view own appointments, bed availability card, blood group availability table, prescribed medicines per appointment

### Cross-Cutting Frontend Features
- Notification bell in navbar with unread count; dropdown panel listing low stock, expiring medicine, and low blood stock alerts scoped to user's hospital; refreshes on navigation
- Dark mode toggle in navbar; preference persisted in localStorage
- Client-side search and filter on all data tables; medicines filterable by stock status; appointments filterable by status
- PDF export button on each report page (Medicine Stock, Bed Occupancy, Blood Stock) using a frontend PDF library
- Clean medical-grade theme: white and teal/green palette, sans-serif typography, card-based layouts with subtle shadows, collapsible sidebar, status color coding (red/green/amber)
- Logo icon in sidebar header; hero illustration on login page

**User-visible outcome:** Users can log in via Internet Identity, land on their role-specific dashboard, and perform full hospital operations — managing medicines, beds, blood stock, suppliers, doctors, and appointments — with alerts, reports, PDF exports, dark mode, and data isolation between hospitals.
