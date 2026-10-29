# Smart Hospital Management System (HMS) — Complete MERN Application

> **An enterprise-grade, full-stack healthcare information and clinical management platform built with React.js, Node.js, Express.js, MongoDB (Mongoose), JWT, and Recharts.**

---

## 1. System Overview

The **Smart Hospital Management System** is a unified, secure, and reactive healthcare operating platform engineered for modern hospitals, medical centers, and clinical practices. It digitizes the complete patient care journey — from symptom-based department triage and dynamic outpatient scheduling to inpatient bed telemetry, multi-item electronic prescriptions, pathology report processing, and itemized billing.

The application enforces a **Single Shared Database Architecture** with **exactly 11 logical collections**, strictly adhering to enterprise design patterns and role-based access control (RBAC) across 5 primary roles:

- 🏥 **Administrator**: Hospital governance, medical staff directory, clinical departments, bed telemetry, admission/discharge oversight, and executive analytics.
- 🩺 **Doctor**: Clinical queue, patient encounter history, digital multi-item prescriptions, and diagnostic test ordering.
- 🔬 **Laboratory**: Specimen collection workflow, biomarker metrics entry, automated status progression, and PDF report uploads.
- 💊 **Pharmacy**: Medicine formulary management, real-time inventory reorder/expiry alerts, and prescription dispensing.
- 👤 **Patient**: Smart symptom-to-specialty triage, dynamic doctor slot optimizer, personal health record access, and invoice settlement.

---

## 2. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, React Router v6, Axios, Recharts (6 custom executive charts), Lucide Icons, Modern CSS Flex/Grid |
| **Backend** | Node.js, Express.js, Mongoose 8, JWT (jsonwebtoken), bcryptjs, Multer, Helmet, CORS, Express-Rate-Limit |
| **Database** | MongoDB 7.0 (MongoDB Atlas compatible + automatic MongoMemoryServer local fallback) |
| **Security** | BCrypt 10-round salted password hashing, stateless JWT Bearer authorization, RBAC middleware, strict MIME & size file whitelisting |

---

## 3. Strict Compliance Matrix

| Requirement | Implementation Detail | Status |
| :--- | :--- | :---: |
| **Exactly 11 Collections** | `users`, `departments`, `appointments`, `medicalRecords`, `prescriptions`, `medicines`, `labReports`, `beds`, `admissions`, `bills`, `notifications` | ✅ VERIFIED |
| **No Standalone Collections** | Patients and Doctors are stored inside `users` using discriminator role fields. Diagnostic requests and tests are handled in `labReports`. | ✅ VERIFIED |
| **5 Dedicated Roles** | Separate dashboard views, navigation sidebars, and protected route guards for `PATIENT`, `DOCTOR`, `LAB`, `PHARMACY`, `ADMIN`. | ✅ VERIFIED |
| **4 Smart Features** | 1. Rule-based symptom triage & department recommendation<br>2. Dynamic appointment slot optimizer & double-booking guard<br>3. Predictive medicine low-stock & expiry alert engine<br>4. Hospital bed telemetry & occupancy tracking | ✅ VERIFIED |

---

## 4. Intelligent Smart Algorithms

### 4.1 Rule-Based Symptom Triage & Department Recommender
- **Location**: `backend/utils/departmentRecommender.js`
- **Algorithm**: Parses patient-reported symptoms against clinical specialty matrices (Cardiology, Neurology, Orthopedics, Pediatrics, Dermatology, General Medicine). Automatically suggests the most suitable medical department and highlights available specialists, complete with a mandatory clinical disclaimer.

### 4.2 Dynamic Appointment Slot Optimizer & Double-Booking Guard
- **Location**: `backend/controllers/appointmentController.js`
- **Algorithm**: Computes valid consultation intervals from the doctor's weekly roster, queries real-time database bookings, and dynamically strips out reserved slots. Employs a compound MongoDB unique index `(doctorId, appointmentDate, timeSlot)` to eliminate race-condition double-bookings.

### 4.3 Predictive Pharmacy Stock & Expiry Alert Engine
- **Location**: `backend/controllers/medicineController.js`
- **Algorithm**: Periodically aggregates drug stock levels against safety minimums (`stock <= minStockLevel`) and scans expiry dates within a 30-day window (`expiryDate <= Date.now() + 30 days`), dispatching alerts directly to pharmacists.

### 4.4 Hospital Bed Occupancy & Telemetry Engine
- **Location**: `backend/controllers/bedController.js` & `admissionController.js`
- **Algorithm**: Tracks live bed status (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`) across multiple wards (ICU, General, Emergency, Pediatric, Maternity, Surgical), computing real-time ward capacity and occupancy percentages.

---

## 5. Portal Authentication & User Modules

The authentication system is organized into three consolidated, modern portals with medical tech backgrounds and interactive quick-fill selectors:

### 5.1 Unified Doctor Authentication Module
- **Single Clinical Gateway**: Consolidates all doctor logins into a single, unified module rather than fragmented components.
- **Multi-Doctor Credential Support**: Includes an interactive 1-click staff physician roster (Dr. Sarah Jenkins, Dr. Robert Chen, Dr. Emily Watson) with active specialty previews, or supports manual entry for any physician.
- **Dynamic Profile & Dashboard Binding**: Once authenticated, the Doctor Dashboard immediately adapts to that specific doctor's clinical profile, fee schedule, availability, and outpatient queue.

### 5.2 Dedicated Patient Auth & Registration Flow
- **Dual-Mode Experience**: Offers both inline portal authentication and a standalone interactive modal.
- **Clean Styled Action Switch**: Features segmented pill switch buttons between `"Sign In (Registered Patient)"` and `"Create Account (New Patient)"`.
- **Streamlined Onboarding**: New patients enter their health demographics (blood group, gender, emergency address) and are immediately logged in to their patient portal upon registration.

### 5.3 Demo Accounts & Credentials

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Doctor** | `doctor.sarah@smarthospital.com` | `Password123!` | Interventional Cardiology, Harvard MD, consultation queue & prescriptions |
| **Doctor** | `doctor.robert@smarthospital.com`| `Password123!` | Internal & General Medicine, Johns Hopkins MD, primary care |
| **Doctor** | `doctor.emily@smarthospital.com` | `Password123!` | Neurology & Neurophysiology, Stanford MD, neuro consultations |
| **Patient** | `patient.john@smarthospital.com` | `Password123!` | Outpatient booking, symptom triage, active prescriptions & bill settlement |
| **Patient** | `patient.mary@smarthospital.com` | `Password123!` | Inpatient history, invoices, notifications |
| **Admin** | `admin@smarthospital.com` | `Password123!` | System-wide governance, beds, staff, financial & clinical analytics |
| **Laboratory** | `lab@smarthospital.com` | `Password123!` | Lab requests, specimen updates, diagnostic test results, PDF reports |
| **Pharmacy** | `pharmacy@smarthospital.com` | `Password123!` | Drug formulary, stock adjustments, low-stock alerts, dispensing |

---

## 6. Project Directory Structure

```text
smart_hospital/
├── backend/
│   ├── config/
│   │   └── db.js                 # Database connection (Atlas URI + Local Memory Server fallback)
│   ├── controllers/              # 13 REST API controllers
│   ├── middleware/               # Auth, RBAC, Error, and Multer upload middleware
│   ├── models/                   # 11 Mongoose schema models
│   ├── routes/                   # 13 Express route modules
│   ├── uploads/                  # Upload directory for diagnostic PDFs & assets
│   ├── utils/                    # Seed script, JWT generator, symptom recommender, notifications
│   ├── .env                      # Environment configuration
│   ├── .env.example              # Environment template
│   ├── app.js                    # Express app configuration & middleware pipeline
│   ├── server.js                 # HTTP server bootstrap
│   └── package.json
│
├── frontend/
│   ├── public/                   # Static icons and assets
│   ├── src/
│   │   ├── assets/               # Branding graphics
│   │   ├── components/           # Reusable UI components
│   │   │   ├── common/           # Button, Modal, Input, Select, StatusBadge, etc.
│   │   │   └── layout/           # DashboardLayout, Navbar, Sidebar
│   │   ├── context/              # AuthContext (JWT session management)
│   │   ├── pages/                # 24 Dedicated pages across all 5 roles
│   │   │   ├── admin/            # 8 Admin pages (Dashboard, Users, Beds, Bills, etc.)
│   │   │   ├── auth/             # Login & Register with 1-click demo buttons
│   │   │   ├── doctor/           # 7 Doctor pages (Queue, Records, Prescriptions, etc.)
│   │   │   ├── laboratory/       # 4 Lab pages (Requests, Tests, PDF Uploads)
│   │   │   ├── patient/          # 9 Patient pages (Triage, Appointments, Bills, etc.)
│   │   │   └── pharmacy/         # 5 Pharmacy pages (Formulary, Alerts, Dispensing)
│   │   ├── routes/               # ProtectedRoute & RoleRoute guards
│   │   ├── services/             # Axios instance + 13 domain-specific API clients
│   │   ├── App.jsx               # Application router & route hierarchy
│   │   ├── index.css             # Comprehensive design system stylesheet
│   │   └── main.jsx              # React entry point
│   ├── .env                      # Vite environment variables
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── docs/                         # Comprehensive engineering documentation
│   ├── architecture.md           # System architecture, RBAC, and data flow diagrams
│   ├── database-schema.md        # Complete schema specification for all 11 collections
│   ├── api-documentation.md      # REST API endpoints, request/response contracts
│   └── testing.md                # QA validation matrix, role scenarios, security tests
│
└── README.md                     # Project guide
```

---

## 7. Quick Start Guide (Windows & VS Code)

### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0 or higher)
- **MongoDB** (Optional: local MongoDB service or MongoDB Atlas connection string. If omitted, the backend will automatically spin up an embedded in-memory MongoDB engine for zero-configuration evaluation.)

### Step 1: Clone or Open Workspace in VS Code
Open the root directory `d:\FSD` in VS Code.

### Step 2: Configure Environment Variables
Verify or adjust `smart_hospital/backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/smart_hospital
JWT_SECRET=super_secret_jwt_key_hospital_management_2026_xyz!
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=uploads
```
*(If you have a MongoDB Atlas connection string, you can paste it directly into `MONGO_URI`.)*

### Step 3: Seed the Database
Run the pre-configured database seeding script to populate all 11 collections with realistic test data:
```powershell
npm run seed
```
*Or directly from the backend folder:*
```powershell
cd smart_hospital/backend
npm run seed
```

### Step 4: Run the Full Application
From the root directory (`d:\FSD`), launch both backend and frontend concurrently:
```powershell
npm run dev
```

Alternatively, run in separate terminal tabs:
- **Terminal 1 (Backend)**:
  ```powershell
  cd smart_hospital/backend
  npm run dev
  ```
- **Terminal 2 (Frontend)**:
  ```powershell
  cd smart_hospital/frontend
  npm run dev
  ```

### Step 5: Access the Application
Open your web browser and navigate to:
```text
http://localhost:5173
```
Click any of the **Quick Demo Login** buttons (Admin, Doctor, Lab, Pharmacy, Patient) to immediately test the platform!

---

## 8. Documentation References

For exhaustive technical details, please consult the dedicated documentation in the `docs/` folder:
- 📘 [System Architecture & Design Guide](docs/architecture.md)
- 🗄️ [Database Schema & Collection Reference](docs/database-schema.md)
- 🔌 [REST API Endpoints Specification](docs/api-documentation.md)
- 🧪 [QA Testing & Persona Validation Matrix](docs/testing.md)
