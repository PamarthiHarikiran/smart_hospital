# Smart Hospital Management System — Testing & QA Validation Guide

## 1. QA Strategy & Testing Hierarchy

The Smart Hospital QA verification plan validates the system across four foundational tiers:
1. **Model & Unit Validation**: Mongoose schema validations, enum constraints, password hashing, and token signing.
2. **Integration & API Layer Validation**: Controller logic, route parameter parsing, JWT token authentication, and RBAC authorization middleware.
3. **Smart Algorithm Validation**: Triage recommender, slot optimizer, inventory alert engine, and bed telemetry.
4. **End-to-End Persona Scenarios**: Complete clinical and administrative workflows across all five roles.

---

## 2. Test Account Credentials

All demo accounts are pre-seeded and accessible via quick-fill buttons on the login page:

| Role | Email | Password | Primary Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@smarthospital.com` | `Password123!` | System-wide configuration, staff, beds, analytics |
| **Doctor** | `doctor.sarah@smarthospital.com` | `Password123!` | Appointments, medical records, prescriptions, lab requests |
| **Doctor** | `doctor.robert@smarthospital.com`| `Password123!` | Cardiology specialist consultations |
| **Doctor** | `doctor.emily@smarthospital.com` | `Password123!` | Pediatrics specialist consultations |
| **Laboratory** | `lab@smarthospital.com` | `Password123!` | Test requests, sample logging, results entry, PDF uploads |
| **Pharmacy** | `pharmacy@smarthospital.com` | `Password123!` | Drug formulary, stock updates, prescription dispensing |
| **Patient** | `patient.john@smarthospital.com` | `Password123!` | Personal booking, records, prescriptions, lab reports, bills |
| **Patient** | `patient.mary@smarthospital.com` | `Password123!` | Inpatient history, invoices, notifications |

---

## 3. End-to-End Persona Verification Matrix

### 3.1 Patient Workflow
| Step | Action | Expected Result | Pass / Fail Criteria |
| :---: | :--- | :--- | :--- |
| **P1** | Register new account at `/register` | Account created in `users` collection with `role: PATIENT`, JWT issued, auto-redirected to dashboard | HTTP 201, valid token in localStorage |
| **P2** | Log in with `patient.john@smarthospital.com` | Dashboard loads showing upcoming appointments, active prescriptions, recent lab reports, and billing summary | HTTP 200, dashboard stats rendered |
| **P3** | Navigate to `/patient/doctors` and use Symptom Triage | Enter "chest pain, heart palpitations". Recommender highlights Cardiology and filters Dr. Robert Chen | Correct department selected with medical disclaimer displayed |
| **P4** | Select date and view dynamic slots | Slot optimizer calls `/available-slots` and renders only free time intervals | Already booked slots are disabled/hidden |
| **P5** | Confirm appointment booking | Appointment record saved with `status: SCHEDULED`. Notification dispatched to doctor | HTTP 201, appointment appears in list |
| **P6** | Navigate to `/patient/bills` and view invoice | Printable invoice modal opens showing itemized consultation fee, taxes, and balance | Print button triggers browser print dialog |
| **P7** | Click "Pay Now" with Credit Card | Bill status transitions from `UNPAID` to `PAID`, receipt modal shows zero remaining balance | HTTP 200, status badge updates to `PAID` |

---

### 3.2 Doctor Workflow
| Step | Action | Expected Result | Pass / Fail Criteria |
| :---: | :--- | :--- | :--- |
| **D1** | Log in with `doctor.sarah@smarthospital.com` | Doctor dashboard loads showing today's patient queue, pending lab results, and patient stats | Queue table displays scheduled appointments |
| **D2** | Navigate to `/doctor/appointments` and select patient | Patient card opens with clinical history, pre-existing conditions, and allergies | Patient details correctly populated |
| **D3** | Update appointment status to `IN_PROGRESS` | Appointment state changes in real-time | HTTP 200 |
| **D4** | Navigate to `/doctor/medical-records` and create record | Enter diagnosis, symptoms, clinical notes, vitals, and treatment plan | Medical record saved with unique record number `MR-2026-XXXX` |
| **D5** | Navigate to `/doctor/prescriptions` and issue multi-drug prescription | Add Amoxicillin and Paracetamol with dosage, frequency, and instructions | Prescription generated with status `ACTIVE` |
| **D6** | Navigate to `/doctor/lab-reports` and order diagnostic test | Order "Complete Blood Count (CBC)", set priority to `URGENT` | Lab report created with status `REQUESTED`. Notification sent to lab technicians |

---

### 3.3 Laboratory Technician Workflow
| Step | Action | Expected Result | Pass / Fail Criteria |
| :---: | :--- | :--- | :--- |
| **L1** | Log in with `lab@smarthospital.com` | Lab dashboard displays pending test requests, completed tests, and urgent alerts | Urgent CBC request flagged in red badge |
| **L2** | Navigate to `/lab/requests` and update sample status | Click "Collect Sample". Status changes to `SAMPLE_COLLECTED` | HTTP 200, timestamp recorded |
| **L3** | Navigate to `/lab/reports/:id` and enter parameters | Enter Hemoglobin (14.2 g/dL), WBC (11,200 /mcL). Add diagnostic conclusion | Parameters saved, status updates to `COMPLETED` |
| **L4** | Upload diagnostic PDF | Select sample lab report PDF file (under 5MB). File uploaded via Multer | File stored in `backend/uploads/` and download link becomes active |
| **L5** | Verify notification dispatch | Ordering doctor and patient both receive `LAB_REPORT` notification | Notification appears in patient notification bell |

---

### 3.4 Pharmacist Workflow
| Step | Action | Expected Result | Pass / Fail Criteria |
| :---: | :--- | :--- | :--- |
| **PH1** | Log in with `pharmacy@smarthospital.com` | Pharmacy dashboard renders inventory health, low stock count, and pending prescriptions | Accurate counters for total SKUs and low stock items |
| **PH2** | Navigate to `/pharmacy/alerts` | View items approaching expiry (<30 days) and items below reorder threshold | Items flagged with `LOW_STOCK` or `EXPIRING_SOON` badges |
| **PH3** | Navigate to `/pharmacy/medicines` and restock item | Click "Update Stock" on Amoxicillin, add +50 units | Inventory level increases atomically in database |
| **PH4** | Navigate to `/pharmacy/prescriptions` and dispense | Select active prescription, click "Dispense All". Confirm drug interaction safety | Prescription status changes to `DISPENSED`, medicine inventory decreased by prescribed quantity |

---

### 3.5 Hospital Administrator Workflow
| Step | Action | Expected Result | Pass / Fail Criteria |
| :---: | :--- | :--- | :--- |
| **A1** | Log in with `admin@smarthospital.com` | Admin dashboard loads with 6 Recharts visualizations (Registrations, Revenue, Appointments, Bed Occupancy, Pharmacy Health, Weekly Trends) | All 6 charts render with real MongoDB aggregation data |
| **A2** | Navigate to `/admin/users` | Filter users by role. Create a new Doctor or Laboratory staff member | Staff member created with encrypted password |
| **A3** | Navigate to `/admin/beds` | Real-time bed grid renders with ward filters (ICU, General, Emergency) and occupancy rate | Correct percentage calculation matching database |
| **A4** | Navigate to `/admin/admissions` | Admit patient to an `AVAILABLE` bed in General Ward. Bed status transitions to `OCCUPIED` | Bed telemetry updates immediately |
| **A5** | Discharge inpatient | Click "Discharge Patient". Bed status transitions to `AVAILABLE`, discharge bill generated | Inpatient bill itemizes daily bed rate $\times$ duration |

---

## 4. Security & Boundary Penetration Tests

| Test ID | Vulnerability Tested | Test Payload / Action | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :---: |
| **SEC-01** | Unauthenticated Route Access | `GET /api/medical-records` with no Authorization header | HTTP 401 Unauthorized (`No token provided`) | PASS |
| **SEC-02** | Cross-Role Privilege Escalation | `POST /api/departments` using `PATIENT` JWT token | HTTP 403 Forbidden (`Access denied: insufficient permissions`) | PASS |
| **SEC-03** | Unauthorized Record Viewing | `GET /api/medical-records/patient/<id>` using another patient's token | HTTP 403 Forbidden (`Unauthorized access to another patient's records`) | PASS |
| **SEC-04** | Invalid JWT Signature | Tampered signature segment in JWT bearer token | HTTP 401 Unauthorized (`Invalid token`) | PASS |
| **SEC-05** | Double Booking Concurrency | Two simultaneous `POST /api/appointments` requests for identical doctor, date, and slot | First request returns 201 Created; second request returns 400 Bad Request (`Slot already booked`) | PASS |
| **SEC-06** | Malicious File Upload | Upload `.exe` or `.sh` script to `/api/lab-reports/:id/upload` | Multer rejects with HTTP 400 (`Invalid file type: Only PDF, JPG, and PNG allowed`) | PASS |
| **SEC-07** | File Size Limit Enforcement | Upload 15MB file to `/api/lab-reports/:id/upload` | Multer rejects with HTTP 400 (`File size exceeds 5MB limit`) | PASS |
| **SEC-08** | Rate Limiting Enforcement | Send 1,001 rapid requests from single IP in under 15 minutes | HTTP 429 Too Many Requests | PASS |
