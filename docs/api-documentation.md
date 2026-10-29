# Smart Hospital Management System — Comprehensive REST API Specification

## 1. Global API Standards

- **Base URL**: `http://localhost:5000/api`
- **Content-Type**: `application/json` (or `multipart/form-data` for file uploads)
- **Authentication**: JWT Bearer token in the `Authorization` header:
  ```http
  Authorization: Bearer <jwt_token>
  ```
- **Standard Response Envelope**:
  ```json
  {
    "success": true,
    "message": "Operation completed successfully",
    "data": { ... }
  }
  ```
- **Standard Error Envelope**:
  ```json
  {
    "success": false,
    "message": "Error description message",
    "stack": "Stack trace (development mode only)"
  }
  ```

---

## 2. Authentication & Profile Endpoints (`/api/auth`)

### 2.1 User Registration
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "password": "Password123!",
    "role": "PATIENT",
    "phone": "+1-555-0199",
    "gender": "FEMALE",
    "bloodGroup": "O+"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": {
      "_id": "67b0d...",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "role": "PATIENT"
    }
  }
  ```

### 2.2 User Login
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "admin@smarthospital.com",
    "password": "Password123!"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": {
      "_id": "67b0d...",
      "name": "Dr. Alexander Wright",
      "email": "admin@smarthospital.com",
      "role": "ADMIN"
    }
  }
  ```

### 2.3 Get Current Authenticated User Profile
- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Access**: Authenticated (Any role)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": {
      "_id": "67b0d...",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "role": "PATIENT",
      "phone": "+1-555-0199",
      "dateOfBirth": "1994-06-15T00:00:00.000Z",
      "bloodGroup": "O+",
      "allergies": ["Penicillin"]
    }
  }
  ```

### 2.4 Update Profile Details
- **Method**: `PUT`
- **Path**: `/api/auth/profile`
- **Access**: Authenticated (Any role)
- **Request Body**: Partial user document (e.g. `phone`, `address`, `allergies`, `medicalHistory`)

### 2.5 Change Password
- **Method**: `PUT`
- **Path**: `/api/auth/password`
- **Access**: Authenticated (Any role)
- **Request Body**:
  ```json
  {
    "currentPassword": "Password123!",
    "newPassword": "NewSecurePassword456!"
  }
  ```

---

## 3. Department Endpoints (`/api/departments`)

### 3.1 Get All Departments
- **Method**: `GET`
- **Path**: `/api/departments`
- **Access**: Public / Authenticated
- **Success Response (200 OK)**: Array of department objects with populated `headOfDepartment`.

### 3.2 Create New Department
- **Method**: `POST`
- **Path**: `/api/departments`
- **Access**: Restricted (`ADMIN`)
- **Request Body**:
  ```json
  {
    "name": "Cardiology",
    "code": "CARD",
    "description": "Comprehensive diagnostic and surgical heart care",
    "location": "Wing B, Floor 2"
  }
  ```

---

## 4. User & Staff Management Endpoints (`/api/users`)

### 4.1 Query Doctors
- **Method**: `GET`
- **Path**: `/api/users/doctors?department=<id>&specialization=Cardiologist`
- **Access**: Public / Authenticated
- **Success Response (200 OK)**: Filtered array of doctor profiles with fees, ratings, and schedules.

### 4.2 Query System Patients
- **Method**: `GET`
- **Path**: `/api/users/patients`
- **Access**: Restricted (`DOCTOR`, `ADMIN`)

### 4.3 Admin User Management
- `GET /api/users` — Paginated list of all users across roles.
- `POST /api/users` — Admin onboarding of doctors, lab technicians, or pharmacists.
- `PUT /api/users/:id` — Update user attributes or role.
- `DELETE /api/users/:id` — Soft-deactivate or delete user.

---

## 5. Appointment Endpoints (`/api/appointments`)

### 5.1 Dynamic Slot Optimizer
- **Method**: `GET`
- **Path**: `/api/appointments/doctor/:doctorId/available-slots?date=2026-10-20`
- **Access**: Authenticated
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "doctorId": "67b0d...",
    "date": "2026-10-20",
    "availableSlots": [
      "09:00 AM",
      "10:00 AM",
      "11:00 AM",
      "02:00 PM"
    ],
    "bookedSlots": [
      "09:30 AM"
    ]
  }
  ```

### 5.2 Book Appointment
- **Method**: `POST`
- **Path**: `/api/appointments`
- **Access**: Restricted (`PATIENT`, `ADMIN`)
- **Request Body**:
  ```json
  {
    "doctorId": "67b0d...",
    "departmentId": "67b0c...",
    "appointmentDate": "2026-10-20",
    "timeSlot": "10:00 AM",
    "type": "GENERAL",
    "reason": "Persistent dry cough and mild fever",
    "symptoms": ["cough", "fever"]
  }
  ```

### 5.3 Update Appointment Status
- **Method**: `PUT`
- **Path**: `/api/appointments/:id/status`
- **Access**: Restricted (`DOCTOR`, `ADMIN`)
- **Request Body**:
  ```json
  {
    "status": "COMPLETED"
  }
  ```

---

## 6. Medical Record Endpoints (`/api/medical-records`)

### 6.1 Create Medical Record
- **Method**: `POST`
- **Path**: `/api/medical-records`
- **Access**: Restricted (`DOCTOR`, `ADMIN`)
- **Request Body**:
  ```json
  {
    "patientId": "67b0d...",
    "appointmentId": "67b0e...",
    "diagnosis": "Acute Bronchitis",
    "symptoms": ["productive cough", "low-grade fever", "wheezing"],
    "clinicalNotes": "Chest auscultation reveals mild bilateral wheezing. Oxygen saturation 98% on room air.",
    "treatmentPlan": "Bronchodilator therapy, oral antibiotics for 5 days, bed rest, and increased fluid intake.",
    "vitalSigns": {
      "bloodPressure": "120/80",
      "heartRate": 76,
      "temperature": 99.2,
      "oxygenSaturation": 98
    },
    "followUpDate": "2026-10-27"
  }
  ```

### 6.2 Fetch Patient Medical Records
- **Method**: `GET`
- **Path**: `/api/medical-records/patient/:patientId`
- **Access**: Restricted (`PATIENT` self-access, `DOCTOR`, `ADMIN`)

---

## 7. Prescription Endpoints (`/api/prescriptions`)

### 7.1 Issue Digital Prescription
- **Method**: `POST`
- **Path**: `/api/prescriptions`
- **Access**: Restricted (`DOCTOR`)
- **Request Body**:
  ```json
  {
    "patientId": "67b0d...",
    "appointmentId": "67b0e...",
    "diagnosis": "Acute Bronchitis",
    "medicines": [
      {
        "medicineId": "67b0f...",
        "medicineName": "Amoxicillin 500mg",
        "dosage": "500 mg",
        "frequency": "TID (Every 8 hours)",
        "duration": "5 days",
        "instructions": "Take with meals",
        "quantity": 15
      }
    ],
    "notes": "Avoid cold beverages. Report if breathing difficulty worsens."
  }
  ```

### 7.2 Dispense Prescription
- **Method**: `PUT`
- **Path**: `/api/prescriptions/:id/dispense`
- **Access**: Restricted (`PHARMACY`, `ADMIN`)
- **Effect**: Deducts prescribed quantities atomically from `Medicine` collection stock and updates prescription status to `DISPENSED`.

---

## 8. Medicine & Inventory Endpoints (`/api/medicines`)

### 8.1 Formulary Query & Search
- **Method**: `GET`
- **Path**: `/api/medicines?search=Amoxicillin&category=ANTIBIOTIC`
- **Access**: Authenticated

### 8.2 Inventory Alert Monitor
- **Method**: `GET`
- **Path**: `/api/medicines/alerts`
- **Access**: Restricted (`PHARMACY`, `ADMIN`)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "lowStock": [
      { "_id": "...", "name": "Azithromycin 250mg", "stock": 8, "minStockLevel": 20 }
    ],
    "expiringSoon": [
      { "_id": "...", "name": "Cough Expectorant", "expiryDate": "2026-11-05" }
    ],
    "expired": []
  }
  ```

---

## 9. Laboratory Endpoints (`/api/lab-reports`)

### 9.1 Order Diagnostic Test
- **Method**: `POST`
- **Path**: `/api/lab-reports`
- **Access**: Restricted (`DOCTOR`, `ADMIN`)
- **Request Body**:
  ```json
  {
    "testName": "Complete Blood Count (CBC)",
    "category": "HEMATOLOGY",
    "patientId": "67b0d...",
    "isUrgent": true,
    "notes": "Check for elevated WBC and infection signs"
  }
  ```

### 9.2 Enter Diagnostic Results
- **Method**: `PUT`
- **Path**: `/api/lab-reports/:id/results`
- **Access**: Restricted (`LAB`, `ADMIN`)
- **Request Body**:
  ```json
  {
    "specimenType": "Venous Blood",
    "results": [
      { "parameter": "Hemoglobin", "value": "14.5", "unit": "g/dL", "referenceRange": "13.5-17.5", "status": "NORMAL" },
      { "parameter": "White Blood Cells", "value": "11200", "unit": "/mcL", "referenceRange": "4000-11000", "status": "HIGH" }
    ],
    "conclusion": "Mild leukocytosis consistent with active clinical respiratory infection."
  }
  ```

### 9.3 Upload Diagnostic PDF / Imaging
- **Method**: `POST`
- **Path**: `/api/lab-reports/:id/upload`
- **Content-Type**: `multipart/form-data`
- **Access**: Restricted (`LAB`, `ADMIN`)
- **Payload**: `reportFile` (PDF/JPG/PNG up to 5MB)

---

## 10. Bed & Inpatient Admission Endpoints

### 10.1 Bed Telemetry Summary (`/api/beds/summary`)
- **Method**: `GET`
- **Access**: Authenticated (`ADMIN`, `DOCTOR`)
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "totalBeds": 50,
    "occupiedBeds": 32,
    "availableBeds": 16,
    "maintenanceBeds": 2,
    "occupancyRate": 64.0,
    "wardBreakdown": {
      "ICU": { "total": 10, "occupied": 8, "available": 2 },
      "GENERAL": { "total": 25, "occupied": 15, "available": 10 }
    }
  }
  ```

### 10.2 Admit Inpatient (`/api/admissions`)
- **Method**: `POST`
- **Path**: `/api/admissions`
- **Access**: Restricted (`DOCTOR`, `ADMIN`)
- **Request Body**:
  ```json
  {
    "patientId": "67b0d...",
    "bedId": "67b1a...",
    "attendingDoctorId": "67b0d...",
    "departmentId": "67b0c...",
    "reasonForAdmission": "Post-operative surgical monitoring",
    "diagnosis": "Laparoscopic appendectomy"
  }
  ```

### 10.3 Inpatient Discharge (`/api/admissions/:id/discharge`)
- **Method**: `PUT`
- **Path**: `/api/admissions/:id/discharge`
- **Access**: Restricted (`DOCTOR`, `ADMIN`)
- **Effect**: Records `dischargeDate`, updates admission status to `DISCHARGED`, releases assigned bed back to `AVAILABLE`, and triggers automated billing calculation for bed occupancy days.

---

## 11. Billing & Financial Endpoints (`/api/bills`)

### 11.1 Create Invoice
- **Method**: `POST`
- **Path**: `/api/bills`
- **Access**: Restricted (`ADMIN`)
- **Request Body**:
  ```json
  {
    "patientId": "67b0d...",
    "appointmentId": "67b0e...",
    "items": [
      { "description": "Specialist Consultation Fee", "category": "CONSULTATION", "quantity": 1, "unitPrice": 75 },
      { "description": "Complete Blood Count Test", "category": "LAB_TEST", "quantity": 1, "unitPrice": 40 }
    ],
    "discount": 5,
    "tax": 8.8
  }
  ```

### 11.2 Settle Payment
- **Method**: `PUT`
- **Path**: `/api/bills/:id/pay`
- **Access**: Restricted (`PATIENT` self-payment, `ADMIN`)
- **Request Body**:
  ```json
  {
    "amount": 118.80,
    "paymentMethod": "CREDIT_CARD"
  }
  ```

---

## 12. Executive Analytics & Dashboard (`/api/dashboard`)

### 12.1 Overall KPI Metrics
- **Method**: `GET`
- **Path**: `/api/dashboard/overview`
- **Access**: Authenticated (Role-tailored stats)

### 12.2 Multi-Chart Analytics Data
- **Method**: `GET`
- **Path**: `/api/dashboard/analytics`
- **Access**: Restricted (`ADMIN`)
- **Payload Feeds 6 Visualizations**:
  1. Monthly Patient Registration Growth (Area Chart)
  2. Revenue Breakdown by Service Category (Donut/Pie Chart)
  3. Appointment Distribution by Medical Department (Bar Chart)
  4. Bed Occupancy Percentage by Ward (Radar / Radial Bar Chart)
  5. Pharmacy Stock Health Status (Bar Chart)
  6. Weekly Appointment Volume Trends (Line Chart)
