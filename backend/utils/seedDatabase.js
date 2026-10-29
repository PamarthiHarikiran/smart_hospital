require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB, closeDB } = require('../config/db');

// Models
const User = require('../models/User');
const Department = require('../models/Department');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');
const LabReport = require('../models/LabReport');
const Bed = require('../models/Bed');
const Admission = require('../models/Admission');
const Bill = require('../models/Bill');
const Notification = require('../models/Notification');
const Doctor = require('../models/Doctor');
const Conversation = require('../models/Conversation');
const ChatMessage = require('../models/ChatMessage');
const EmergencyAlert = require('../models/EmergencyAlert');

const seedData = async (shouldClose = true) => {
  try {
    console.log('--- Starting EliteCare Hospital Database Seeding ---');
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // Clear existing data
    console.log('Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Department.deleteMany({}),
      Appointment.deleteMany({}),
      MedicalRecord.deleteMany({}),
      Prescription.deleteMany({}),
      Medicine.deleteMany({}),
      LabReport.deleteMany({}),
      Bed.deleteMany({}),
      Admission.deleteMany({}),
      Bill.deleteMany({}),
      Notification.deleteMany({}),
      Conversation.deleteMany({}),
      ChatMessage.deleteMany({}),
      EmergencyAlert.deleteMany({}),
    ]);

    // 1. Seed Departments
    console.log('Seeding Departments...');
    const departmentsData = [
      { name: 'General Medicine', description: 'Primary healthcare, internal medicine, diagnosis and common ailments.' },
      { name: 'Cardiology', description: 'Comprehensive heart and cardiovascular disease treatment.' },
      { name: 'Neurology', description: 'Disorders of the nervous system, brain, and spinal cord.' },
      { name: 'Orthopedics', description: 'Musculoskeletal system, bone fractures, joints, and spine care.' },
      { name: 'Pediatrics', description: 'Medical care for infants, children, and adolescents.' },
      { name: 'Dermatology', description: 'Skin, hair, nail disorders, and aesthetic dermatology.' },
      { name: 'ENT', description: 'Ear, Nose, and Throat diseases and head-neck surgeries.' },
      { name: 'Gynecology', description: 'Women reproductive health, obstetrics, and maternal care.' },
      { name: 'Ophthalmology', description: 'Comprehensive eye care, cataract surgery, and vision correction.' },
    ];
    const departments = await Department.insertMany(departmentsData);
    const deptMap = {};
    departments.forEach((d) => {
      deptMap[d.name] = d._id;
    });

    // 2. Hash common password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123!', salt);

    // 3. Seed Users
    console.log('Seeding Users (Admin, Doctors, Lab, Pharmacy, Patients)...');
    const usersData = [
      // Admin
      {
        name: 'Chief Administrator',
        email: 'admin.elitecare@gmail.com',
        password: hashedPassword,
        role: 'ADMIN',
        phone: '+1-555-0100',
        gender: 'OTHER',
        address: '100 Medical Plaza, Healthcare City',
        status: 'ACTIVE',
      },
      // Doctors (5 Verified Physicians across diverse specializations)
      {
        name: 'Dr. Sarah Jenkins',
        email: 'doctor.sarah@gmail.com',
        password: hashedPassword,
        role: 'DOCTOR',
        phone: '+1-555-0101',
        gender: 'FEMALE',
        bloodGroup: 'O+',
        department: deptMap['Cardiology'],
        specialization: 'Cardiology',
        qualification: 'MD, FACC - Harvard Medical School',
        experience: 12,
        consultationFee: 120,
        address: 'Cardiology Wing, Suite 401',
        availability: [
          { day: 'Monday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
          { day: 'Tuesday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
          { day: 'Wednesday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
          { day: 'Thursday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
          { day: 'Friday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
        ],
        status: 'ACTIVE',
      },
      {
        name: 'Dr. Robert Chen',
        email: 'doctor.robert@gmail.com',
        password: hashedPassword,
        role: 'DOCTOR',
        phone: '+1-555-0102',
        gender: 'MALE',
        bloodGroup: 'A+',
        department: deptMap['General Medicine'],
        specialization: 'General Medicine',
        qualification: 'MBBS, MD (Medicine) - Johns Hopkins',
        experience: 9,
        consultationFee: 80,
        address: 'Outpatient Clinic 102',
        availability: [
          { day: 'Monday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
          { day: 'Tuesday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
          { day: 'Wednesday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
          { day: 'Thursday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
          { day: 'Friday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
        ],
        status: 'ACTIVE',
      },
      {
        name: 'Dr. Emily Watson',
        email: 'doctor.emily@gmail.com',
        password: hashedPassword,
        role: 'DOCTOR',
        phone: '+1-555-0103',
        gender: 'FEMALE',
        bloodGroup: 'B+',
        department: deptMap['Neurology'],
        specialization: 'Neurology',
        qualification: 'MD, FAAN - Stanford University',
        experience: 15,
        consultationFee: 150,
        address: 'Neurology Block 303',
        availability: [
          { day: 'Monday', slots: ['10:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'] },
          { day: 'Tuesday', slots: ['10:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'] },
          { day: 'Wednesday', slots: ['10:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'] },
          { day: 'Thursday', slots: ['10:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'] },
          { day: 'Friday', slots: ['10:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'] },
        ],
        status: 'ACTIVE',
      },
      {
        name: 'Dr. Rajesh Sharma',
        email: 'doctor.rajesh@gmail.com',
        password: hashedPassword,
        role: 'DOCTOR',
        phone: '+1-555-0105',
        gender: 'MALE',
        bloodGroup: 'AB+',
        department: deptMap['Orthopedics'],
        specialization: 'Orthopedics',
        qualification: 'MS (Ortho), M.Ch - Oxford Orthopaedic Centre',
        experience: 14,
        consultationFee: 130,
        address: 'Orthopedics & Joint Clinic 204',
        availability: [
          { day: 'Monday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
          { day: 'Tuesday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
          { day: 'Wednesday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
          { day: 'Thursday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
          { day: 'Friday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
        ],
        status: 'ACTIVE',
      },
      {
        name: 'Dr. Priya Nair',
        email: 'doctor.priya@gmail.com',
        password: hashedPassword,
        role: 'DOCTOR',
        phone: '+1-555-0106',
        gender: 'FEMALE',
        bloodGroup: 'O+',
        department: deptMap['Pediatrics'],
        specialization: 'Pediatrics',
        qualification: 'MD (Pediatrics), FAAP - Columbia University',
        experience: 11,
        consultationFee: 100,
        address: 'Pediatric Care Pavilion 105',
        availability: [
          { day: 'Monday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
          { day: 'Tuesday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
          { day: 'Wednesday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
          { day: 'Thursday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
          { day: 'Friday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
        ],
        status: 'ACTIVE',
      },
      // Lab Technician
      {
        name: 'David Miller',
        email: 'lab.elitecare@gmail.com',
        password: hashedPassword,
        role: 'LAB',
        phone: '+1-555-0104',
        gender: 'MALE',
        qualification: 'B.Sc Medical Laboratory Technology',
        address: 'Diagnostic Laboratory, Floor B1',
        status: 'ACTIVE',
      },
      // Pharmacist
      {
        name: 'Lisa Ray',
        email: 'pharmacy.elitecare@gmail.com',
        password: hashedPassword,
        role: 'PHARMACY',
        phone: '+1-555-0105',
        gender: 'FEMALE',
        qualification: 'Pharm.D - Registered Pharmacist',
        address: 'Central Pharmacy, Ground Floor',
        status: 'ACTIVE',
      },
      // Patients
      {
        name: 'John Doe',
        email: 'patient.john@gmail.com',
        password: hashedPassword,
        role: 'PATIENT',
        phone: '+1-555-0201',
        gender: 'MALE',
        bloodGroup: 'O+',
        dateOfBirth: new Date('1988-05-14'),
        address: '742 Evergreen Terrace, Springfield',
        status: 'ACTIVE',
      },
      {
        name: 'Mary Jane Watson',
        email: 'patient.mary@gmail.com',
        password: hashedPassword,
        role: 'PATIENT',
        phone: '+1-555-0202',
        gender: 'FEMALE',
        bloodGroup: 'A-',
        dateOfBirth: new Date('1994-09-22'),
        address: '20 Ingram Street, Forest Hills',
        status: 'ACTIVE',
      },
      {
        name: 'Michael Brown',
        email: 'patient.michael@gmail.com',
        password: hashedPassword,
        role: 'PATIENT',
        phone: '+1-555-0203',
        gender: 'MALE',
        bloodGroup: 'B+',
        dateOfBirth: new Date('1976-11-03'),
        address: '456 Elm St, Metro City',
        status: 'ACTIVE',
      },
      {
        name: 'Emma Wilson',
        email: 'patient.emma@gmail.com',
        password: hashedPassword,
        role: 'PATIENT',
        phone: '+1-555-0204',
        gender: 'FEMALE',
        bloodGroup: 'AB+',
        dateOfBirth: new Date('2001-03-15'),
        address: '89 Oak Avenue, Riverdale',
        status: 'ACTIVE',
      },
      {
        name: 'James Rodriguez',
        email: 'patient.james@gmail.com',
        password: hashedPassword,
        role: 'PATIENT',
        phone: '+1-555-0205',
        gender: 'MALE',
        bloodGroup: 'O-',
        dateOfBirth: new Date('1982-08-30'),
        address: '321 Pine Lane, Lakeview',
        status: 'ACTIVE',
      },
    ];

    const users = await User.insertMany(usersData);

    // Also populate dedicated Doctor collection
    const doctorsToInsert = users
      .filter((u) => u.role === 'DOCTOR')
      .map((d) => ({
        _id: d._id,
        name: d.name,
        email: d.email,
        password: hashedPassword,
        role: 'DOCTOR',
        phone: d.phone,
        department: d.department,
        specialization: d.specialization,
        qualification: d.qualification,
        experience: d.experience,
        consultationFee: d.consultationFee,
        availability: d.availability,
        address: d.address,
        status: 'ACTIVE',
      }));
    await Doctor.insertMany(doctorsToInsert);
    console.log(`Seeded ${doctorsToInsert.length} physicians into Doctor model collection.`);

    const userMap = {};
    users.forEach((u) => {
      userMap[u.email] = u;
    });

    const docSarah = userMap['doctor.sarah@gmail.com'];
    const docRobert = userMap['doctor.robert@gmail.com'];
    const docEmily = userMap['doctor.emily@gmail.com'];
    const docRajesh = userMap['doctor.rajesh@gmail.com'];
    const docPriya = userMap['doctor.priya@gmail.com'];
    const patientJohn = userMap['patient.john@gmail.com'];
    const patientMary = userMap['patient.mary@gmail.com'];
    const patientMichael = userMap['patient.michael@gmail.com'];
    const patientEmma = userMap['patient.emma@gmail.com'];
    const patientJames = userMap['patient.james@gmail.com'];

    // 4. Seed Medicines
    console.log('Seeding Medicines (normal stock, low stock, expiring)...');
    const now = new Date();
    const oneMonthFromNow = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000); // 20 days -> expiring soon
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const expiredDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000); // 15 days ago -> expired

    const medicinesData = [
      {
        name: 'Paracetamol 500mg',
        category: 'Analgesic',
        manufacturer: 'GSK Pharmaceuticals',
        batchNumber: 'PCM-2026-001',
        price: 5.5,
        stock: 120,
        minimumStock: 25,
        expiryDate: nextYear,
        description: 'Pain reliever and fever reducer.',
      },
      {
        name: 'Amoxicillin 500mg',
        category: 'Antibiotic',
        manufacturer: 'Pfizer Labs',
        batchNumber: 'AMX-2026-004',
        price: 14.0,
        stock: 8, // LOW STOCK ALERT
        minimumStock: 20,
        expiryDate: nextYear,
        description: 'Broad spectrum penicillin antibiotic.',
      },
      {
        name: 'Atorvastatin 20mg',
        category: 'Cardiovascular',
        manufacturer: 'Novartis',
        batchNumber: 'ATV-2025-099',
        price: 22.5,
        stock: 65,
        minimumStock: 15,
        expiryDate: oneMonthFromNow, // EXPIRY ALERT
        description: 'Lowers blood cholesterol and prevents cardiac incidents.',
      },
      {
        name: 'Metformin 850mg',
        category: 'Antidiabetic',
        manufacturer: 'Merck Healthcare',
        batchNumber: 'MET-2026-012',
        price: 9.0,
        stock: 5, // LOW STOCK
        minimumStock: 15,
        expiryDate: nextYear,
        description: 'First line medication for treatment of type 2 diabetes.',
      },
      {
        name: 'Cetirizine 10mg',
        category: 'Antihistamine',
        manufacturer: 'Bayer Pharmaceuticals',
        batchNumber: 'CTZ-2026-088',
        price: 6.0,
        stock: 90,
        minimumStock: 20,
        expiryDate: nextYear,
        description: 'Relief of allergy symptoms including watery eyes and sneezing.',
      },
      {
        name: 'Ibuprofen 400mg',
        category: 'NSAID',
        manufacturer: 'Abbott Laboratories',
        batchNumber: 'IBU-2024-001',
        price: 8.5,
        stock: 12,
        minimumStock: 10,
        expiryDate: expiredDate, // EXPIRED ALERT
        description: 'Anti-inflammatory drug for pain relief.',
      },
      {
        name: 'Azithromycin 250mg',
        category: 'Antibiotic',
        manufacturer: 'Cipla Ltd',
        batchNumber: 'AZT-2026-033',
        price: 18.0,
        stock: 45,
        minimumStock: 15,
        expiryDate: nextYear,
        description: 'Macrolide antibiotic for respiratory tract infections.',
      },
      {
        name: 'Omeprazole 20mg',
        category: 'Gastrointestinal',
        manufacturer: 'AstraZeneca',
        batchNumber: 'OMP-2026-055',
        price: 11.2,
        stock: 70,
        minimumStock: 20,
        expiryDate: nextYear,
        description: 'Proton pump inhibitor for acid reflux and GERD.',
      },
    ];
    const medicines = await Medicine.insertMany(medicinesData);

    // 5. Seed Beds
    console.log('Seeding Beds...');
    const bedsData = [
      { bedNumber: 'GW-101', ward: 'General Ward A', bedType: 'GENERAL', status: 'AVAILABLE' },
      { bedNumber: 'GW-102', ward: 'General Ward A', bedType: 'GENERAL', status: 'OCCUPIED' },
      { bedNumber: 'GW-103', ward: 'General Ward A', bedType: 'GENERAL', status: 'AVAILABLE' },
      { bedNumber: 'GW-104', ward: 'General Ward B', bedType: 'GENERAL', status: 'MAINTENANCE' },
      { bedNumber: 'ICU-201', ward: 'Intensive Care Unit', bedType: 'ICU', status: 'OCCUPIED' },
      { bedNumber: 'ICU-202', ward: 'Intensive Care Unit', bedType: 'ICU', status: 'AVAILABLE' },
      { bedNumber: 'ER-01', ward: 'Emergency Department', bedType: 'EMERGENCY', status: 'AVAILABLE' },
      { bedNumber: 'ER-02', ward: 'Emergency Department', bedType: 'EMERGENCY', status: 'OCCUPIED' },
      { bedNumber: 'PV-301', ward: 'Private Deluxe Suite', bedType: 'PRIVATE', status: 'AVAILABLE' },
      { bedNumber: 'PV-302', ward: 'Private Deluxe Suite', bedType: 'PRIVATE', status: 'OCCUPIED' },
    ];
    const beds = await Bed.insertMany(bedsData);
    const bedMap = {};
    beds.forEach((b) => {
      bedMap[b.bedNumber] = b;
    });

    // 6. Seed Appointments
    console.log('Seeding Appointments...');
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const appointmentsData = [
      {
        patient: patientJohn._id,
        doctor: docSarah._id,
        department: deptMap['Cardiology'],
        date: todayStr,
        time: '09:00 AM',
        reason: 'Follow-up for mild chest discomfort and hypertension review',
        status: 'CONFIRMED',
        notes: 'Patient requested morning slot.',
      },
      {
        patient: patientMary._id,
        doctor: docRobert._id,
        department: deptMap['General Medicine'],
        date: todayStr,
        time: '10:00 AM',
        reason: 'Persistent fever and dry cough for 3 days',
        status: 'CONFIRMED',
      },
      {
        patient: patientMichael._id,
        doctor: docEmily._id,
        department: deptMap['Neurology'],
        date: tomorrowStr,
        time: '11:00 AM',
        reason: 'Recurrent migraine attacks and dizziness',
        status: 'PENDING',
      },
      {
        patient: patientEmma._id,
        doctor: docSarah._id,
        department: deptMap['Cardiology'],
        date: yesterdayStr,
        time: '02:00 PM',
        reason: 'Routine cardiovascular checkup',
        status: 'COMPLETED',
      },
      {
        patient: patientJames._id,
        doctor: docRobert._id,
        department: deptMap['General Medicine'],
        date: tomorrowStr,
        time: '03:00 PM',
        reason: 'Seasonal allergy assessment',
        status: 'CONFIRMED',
      },
    ];
    const appointments = await Appointment.insertMany(appointmentsData);

    // 7. Seed Medical Records
    console.log('Seeding Medical Records...');
    const medicalRecordsData = [
      {
        patient: patientEmma._id,
        doctor: docSarah._id,
        appointment: appointments[3]._id,
        symptoms: 'Mild palpitations during aerobic exercise, occasional shortness of breath.',
        diagnosis: 'Benign Sinus Tachycardia with early stage Grade 1 Hypertension.',
        notes: 'Advised lifestyle modification, low-sodium dietary regimen, and moderate cardio training.',
        treatment: 'Prescribed Atorvastatin and lifestyle adjustments.',
        followUpDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        patient: patientJohn._id,
        doctor: docRobert._id,
        symptoms: 'Acute pharyngitis, mild fever 100.4 F, sore throat.',
        diagnosis: 'Upper Respiratory Tract Infection (viral).',
        notes: 'Rest, adequate hydration, saline gargling.',
        treatment: 'Prescribed Paracetamol and Cetirizine.',
        followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    ];
    const medicalRecords = await MedicalRecord.insertMany(medicalRecordsData);

    // 8. Seed Prescriptions
    console.log('Seeding Prescriptions...');
    const prescriptionsData = [
      {
        patient: patientEmma._id,
        doctor: docSarah._id,
        medicalRecord: medicalRecords[0]._id,
        medicines: [
          {
            medicine: medicines[2]._id, // Atorvastatin
            name: 'Atorvastatin 20mg',
            dosage: '20mg',
            frequency: 'Once daily at bedtime',
            duration: '30 days',
            instructions: 'Take after dinner with water',
          },
        ],
        instructions: 'Avoid grapefruit juice while taking this medication. Check lipid profile in 1 month.',
        status: 'ACTIVE',
      },
      {
        patient: patientJohn._id,
        doctor: docRobert._id,
        medicalRecord: medicalRecords[1]._id,
        medicines: [
          {
            medicine: medicines[0]._id, // Paracetamol
            name: 'Paracetamol 500mg',
            dosage: '500mg',
            frequency: 'Three times a day (1-1-1)',
            duration: '5 days',
            instructions: 'Take after meals as needed for fever',
          },
          {
            medicine: medicines[4]._id, // Cetirizine
            name: 'Cetirizine 10mg',
            dosage: '10mg',
            frequency: 'Once at night (0-0-1)',
            duration: '5 days',
            instructions: 'May cause drowsiness',
          },
        ],
        instructions: 'Drink warm fluids and gargle twice daily.',
        status: 'COMPLETED',
      },
    ];
    await Prescription.insertMany(prescriptionsData);

    // 9. Seed Lab Reports
    console.log('Seeding Lab Reports (with real-time parameters, statuses, and reference ranges)...');
    const labReportsData = [
      {
        reportId: 'ELC-LAB-2026-1042',
        patient: patientJohn._id,
        doctor: docSarah._id,
        appointment: appointments[0]._id,
        testName: 'Complete Blood Count (CBC) with Differential',
        testCategory: 'Hematology & Clinical Microscopy',
        testDescription: 'Comprehensive cellular evaluation of red cells, leukocytes, and thrombocytes.',
        price: 35.0,
        requestStatus: 'VERIFIED',
        sampleType: 'Whole Blood (K2-EDTA)',
        sampleCollectedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        sampleCollectedBy: 'Phlebotomist Marcus Bell',
        laboratory: {
          name: 'EliteCare Central Diagnostic & Pathology Laboratory',
          accreditation: 'NABL & CAP Accredited Clinical Reference Laboratory',
          phone: '+1 (800) 555-0199 / Ext. 402',
          email: 'pathology@elitecarehospital.com',
          address: 'EliteCare Medical Center, Diagnostic Tower Level 2, Suite 210',
        },
        parameters: [
          { name: 'Hemoglobin (Hb)', value: '14.8', unit: 'g/dL', referenceRange: '13.5 - 17.5', status: 'NORMAL', interpretation: 'Adequate oxygen-carrying capacity.' },
          { name: 'Total Leukocyte Count (WBC)', value: '7,400', unit: 'cells/mcL', referenceRange: '4,500 - 11,000', status: 'NORMAL', interpretation: 'Within normal immune baseline.' },
          { name: 'Red Blood Cell Count (RBC)', value: '5.12', unit: 'M/mcL', referenceRange: '4.30 - 5.90', status: 'NORMAL', interpretation: 'Normal erythrocyte density.' },
          { name: 'Platelet Count', value: '245,000', unit: 'cells/mcL', referenceRange: '150,000 - 450,000', status: 'NORMAL', interpretation: 'Normal hemostatic potential.' },
          { name: 'Hematocrit (HCT / PCV)', value: '44.2', unit: '%', referenceRange: '41.0 - 50.0', status: 'NORMAL', interpretation: 'Normal red cell mass proportion.' },
          { name: 'Mean Corpuscular Volume (MCV)', value: '86.3', unit: 'fL', referenceRange: '80.0 - 96.0', status: 'NORMAL', interpretation: 'Normocytic red cells.' },
          { name: 'Neutrophils', value: '62.0', unit: '%', referenceRange: '40.0 - 70.0', status: 'NORMAL', interpretation: 'No left shift observed.' },
          { name: 'Lymphocytes', value: '28.5', unit: '%', referenceRange: '20.0 - 40.0', status: 'NORMAL', interpretation: 'Normal lymphocytic ratio.' },
        ],
        result: 'All cellular hematological parameters within normal adult biological reference intervals.',
        remarks: 'Normal peripheral blood picture. No immature blast cells, anisocytosis, or platelet clumping detected.',
        verifiedBy: {
          name: 'Dr. Arthur Conan, MD, FACP',
          designation: 'Chief Consultant Pathologist',
          licenseNumber: 'MED-PATH-88492',
        },
        technician: {
          name: 'Sarah Jenkins, MLT',
          role: 'Senior Hematology Technologist',
        },
        requestedAt: new Date(Date.now() - 50 * 60 * 60 * 1000),
        processingStartedAt: new Date(Date.now() - 47 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 46 * 60 * 60 * 1000),
        verifiedAt: new Date(Date.now() - 45 * 60 * 60 * 1000),
        statusHistory: [
          { status: 'REQUESTED', timestamp: new Date(Date.now() - 50 * 60 * 60 * 1000), updatedBy: 'Dr. Sarah Jenkins', note: 'Routine preoperative & clinical review investigation.' },
          { status: 'SAMPLE_COLLECTED', timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), updatedBy: 'Marcus Bell (Phlebotomist)', note: 'Venipuncture performed without complication. Specimen barcoded.' },
          { status: 'PROCESSING', timestamp: new Date(Date.now() - 47 * 60 * 60 * 1000), updatedBy: 'Sarah Jenkins, MLT', note: 'Run completed on Sysmex XN-1000 Automated Hematology Analyzer.' },
          { status: 'COMPLETED', timestamp: new Date(Date.now() - 46 * 60 * 60 * 1000), updatedBy: 'Sarah Jenkins, MLT', note: 'Internal QC passed. Numerical results entered.' },
          { status: 'VERIFIED', timestamp: new Date(Date.now() - 45 * 60 * 60 * 1000), updatedBy: 'Dr. Arthur Conan, MD', note: 'Pathologist review completed. Digital signature authenticated.' },
        ],
        reportFile: '/uploads/sample-lab-report.pdf',
      },
      {
        reportId: 'ELC-LAB-2026-1043',
        patient: patientJohn._id,
        doctor: docSarah._id,
        appointment: appointments[0]._id,
        testName: 'Comprehensive Lipid & Cardiovascular Panel',
        testCategory: 'Clinical Biochemistry',
        testDescription: 'Quantitative measurement of lipid fractions to evaluate cardiovascular and atherogenic risk.',
        price: 45.0,
        requestStatus: 'COMPLETED',
        sampleType: 'Serum (Fasting 12 Hours)',
        sampleCollectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        sampleCollectedBy: 'Phlebotomist Marcus Bell',
        laboratory: {
          name: 'EliteCare Central Diagnostic & Pathology Laboratory',
          accreditation: 'NABL & CAP Accredited Clinical Reference Laboratory',
          phone: '+1 (800) 555-0199 / Ext. 402',
          email: 'pathology@elitecarehospital.com',
          address: 'EliteCare Medical Center, Diagnostic Tower Level 2, Suite 210',
        },
        parameters: [
          { name: 'Total Cholesterol', value: '218', unit: 'mg/dL', referenceRange: '< 200', status: 'HIGH', interpretation: 'Borderline elevated total circulating cholesterol.' },
          { name: 'Triglycerides', value: '165', unit: 'mg/dL', referenceRange: '< 150', status: 'HIGH', interpretation: 'Mild hypertriglyceridemia.' },
          { name: 'HDL Cholesterol (Direct)', value: '46', unit: 'mg/dL', referenceRange: '> 40', status: 'NORMAL', interpretation: 'Protective HDL within acceptable range.' },
          { name: 'LDL Cholesterol (Calculated)', value: '139', unit: 'mg/dL', referenceRange: '< 100', status: 'HIGH', interpretation: 'Elevated atherogenic lipoprotein fraction.' },
          { name: 'VLDL Cholesterol', value: '33', unit: 'mg/dL', referenceRange: '5 - 30', status: 'HIGH', interpretation: 'Slightly above desirable baseline.' },
          { name: 'Total Chol / HDL Ratio', value: '4.7', unit: 'ratio', referenceRange: '< 4.5', status: 'HIGH', interpretation: 'Moderate cardiovascular risk marker.' },
        ],
        result: 'Mild to moderate dyslipidemia characterized by elevated Total Cholesterol and LDL fraction.',
        remarks: 'Recommend clinical correlation with dietary history, exercise program, and follow-up lipid screening in 12 weeks.',
        verifiedBy: {
          name: 'Dr. Arthur Conan, MD, FACP',
          designation: 'Chief Consultant Pathologist',
          licenseNumber: 'MED-PATH-88492',
        },
        technician: {
          name: 'David Kim, MLT',
          role: 'Biochemistry Specialist',
        },
        requestedAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
        processingStartedAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
        statusHistory: [
          { status: 'REQUESTED', timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000), updatedBy: 'Dr. Sarah Jenkins', note: 'Cardiovascular screening post outpatient consultation.' },
          { status: 'SAMPLE_COLLECTED', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), updatedBy: 'Marcus Bell (Phlebotomist)', note: 'Fasting status confirmed (12 hours).' },
          { status: 'PROCESSING', timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000), updatedBy: 'David Kim, MLT', note: 'Processed on Beckman Coulter DxC 700 AU Chemistry Analyzer.' },
          { status: 'COMPLETED', timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000), updatedBy: 'David Kim, MLT', note: 'Results recorded and transmitted to reporting desk.' },
        ],
      },
      {
        reportId: 'ELC-LAB-2026-1044',
        patient: patientJohn._id,
        doctor: docSarah._id,
        appointment: appointments[0]._id,
        testName: 'Comprehensive Metabolic Panel (CMP-14)',
        testCategory: 'Clinical Biochemistry',
        testDescription: 'Evaluation of renal function, hepatic enzymes, electrolytes, and glycemic status.',
        price: 50.0,
        requestStatus: 'PROCESSING',
        sampleType: 'Serum (Lithium Heparin)',
        sampleCollectedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        sampleCollectedBy: 'Phlebotomist Marcus Bell',
        laboratory: {
          name: 'EliteCare Central Diagnostic & Pathology Laboratory',
          accreditation: 'NABL & CAP Accredited Clinical Reference Laboratory',
          phone: '+1 (800) 555-0199 / Ext. 402',
          email: 'pathology@elitecarehospital.com',
          address: 'EliteCare Medical Center, Diagnostic Tower Level 2, Suite 210',
        },
        parameters: [],
        result: 'Specimen in automated biochemical analyzer rack. Photometric assay in progress.',
        remarks: 'Calibration verified against NIST reference controls. Estimated completion in 35 minutes.',
        technician: {
          name: 'David Kim, MLT',
          role: 'Biochemistry Specialist',
        },
        requestedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        processingStartedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        statusHistory: [
          { status: 'REQUESTED', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), updatedBy: 'Dr. Sarah Jenkins', note: 'Electrolyte & renal function baseline monitoring.' },
          { status: 'SAMPLE_COLLECTED', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), updatedBy: 'Marcus Bell (Phlebotomist)', note: 'Specimen centrifuged and serum separated.' },
          { status: 'PROCESSING', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), updatedBy: 'David Kim, MLT', note: 'Assay queued on chemistry analyzer track.' },
        ],
      },
      {
        reportId: 'ELC-LAB-2026-1045',
        patient: patientJohn._id,
        doctor: docSarah._id,
        appointment: appointments[0]._id,
        testName: 'Urinalysis Routine & Microscopic Examination',
        testCategory: 'Clinical Pathology & Urinalysis',
        testDescription: 'Physical, chemical, and sediment analysis of urine specimen.',
        price: 25.0,
        requestStatus: 'SAMPLE_COLLECTED',
        sampleType: 'Midstream Clean-Catch Urine',
        sampleCollectedAt: new Date(Date.now() - 45 * 60 * 1000),
        sampleCollectedBy: 'Nurse Clara Oswald',
        laboratory: {
          name: 'EliteCare Central Diagnostic & Pathology Laboratory',
          accreditation: 'NABL & CAP Accredited Clinical Reference Laboratory',
          phone: '+1 (800) 555-0199 / Ext. 402',
          email: 'pathology@elitecarehospital.com',
          address: 'EliteCare Medical Center, Diagnostic Tower Level 2, Suite 210',
        },
        parameters: [],
        result: 'Specimen received at laboratory accession desk. Preserved in sterile preservative tube.',
        remarks: 'Specimen integrity verified. Scheduled for reflectance photometry and automated sediment microscopy.',
        requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        statusHistory: [
          { status: 'REQUESTED', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), updatedBy: 'Dr. Sarah Jenkins', note: 'Routine diagnostic screening.' },
          { status: 'SAMPLE_COLLECTED', timestamp: new Date(Date.now() - 45 * 60 * 1000), updatedBy: 'Clara Oswald, RN', note: 'Clean-catch collection protocol observed.' },
        ],
      },
      {
        reportId: 'ELC-LAB-2026-1046',
        patient: patientJohn._id,
        doctor: docSarah._id,
        appointment: appointments[0]._id,
        testName: 'Cardiac Biomarkers (High-Sensitivity Troponin-I & CK-MB)',
        testCategory: 'Emergency Biochemistry',
        testDescription: 'Quantitative myocardial enzyme evaluation for acute myocardial injury.',
        price: 55.0,
        requestStatus: 'REQUESTED',
        sampleType: 'Venous Blood (Lithium Heparin)',
        laboratory: {
          name: 'EliteCare Central Diagnostic & Pathology Laboratory',
          accreditation: 'NABL & CAP Accredited Clinical Reference Laboratory',
          phone: '+1 (800) 555-0199 / Ext. 402',
          email: 'pathology@elitecarehospital.com',
          address: 'EliteCare Medical Center, Diagnostic Tower Level 2, Suite 210',
        },
        parameters: [],
        result: 'Order logged in laboratory information system. Awaiting patient specimen collection.',
        remarks: 'Stat order generated during outpatient cardiology review.',
        requestedAt: new Date(Date.now() - 20 * 60 * 1000),
        statusHistory: [
          { status: 'REQUESTED', timestamp: new Date(Date.now() - 20 * 60 * 1000), updatedBy: 'Dr. Sarah Jenkins', note: 'Baseline troponin ordered for clinical triage.' },
        ],
      },
      {
        reportId: 'ELC-LAB-2026-1047',
        patient: patientMary._id,
        doctor: docRobert._id,
        appointment: appointments[1]._id,
        testName: 'Rapid Respiratory Multiplex PCR Panel',
        testCategory: 'Molecular Diagnostics & Virology',
        testDescription: 'Multiplex nucleic acid amplification for Influenza A, Influenza B, and SARS-CoV-2.',
        price: 65.0,
        requestStatus: 'VERIFIED',
        sampleType: 'Nasopharyngeal Swab (VTM)',
        sampleCollectedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        sampleCollectedBy: 'Nurse Clara Oswald',
        laboratory: {
          name: 'EliteCare Central Diagnostic & Pathology Laboratory',
          accreditation: 'NABL & CAP Accredited Clinical Reference Laboratory',
          phone: '+1 (800) 555-0199 / Ext. 402',
          email: 'pathology@elitecarehospital.com',
          address: 'EliteCare Medical Center, Diagnostic Tower Level 2, Suite 210',
        },
        parameters: [
          { name: 'SARS-CoV-2 (COVID-19) RNA', value: 'NOT DETECTED (Negative)', unit: 'Qualitative', referenceRange: 'Negative', status: 'NORMAL', interpretation: 'Target genes ORF1ab and N not amplified.' },
          { name: 'Influenza A RNA', value: 'NOT DETECTED (Negative)', unit: 'Qualitative', referenceRange: 'Negative', status: 'NORMAL', interpretation: 'No seasonal flu A viral sequence detected.' },
          { name: 'Influenza B RNA', value: 'NOT DETECTED (Negative)', unit: 'Qualitative', referenceRange: 'Negative', status: 'NORMAL', interpretation: 'No seasonal flu B viral sequence detected.' },
          { name: 'Respiratory Syncytial Virus (RSV)', value: 'NOT DETECTED (Negative)', unit: 'Qualitative', referenceRange: 'Negative', status: 'NORMAL', interpretation: 'Negative for RSV strains A and B.' },
        ],
        result: 'Negative for all tested respiratory pathogens. No viral RNA detected.',
        remarks: 'Sample quality adequate. Internal extraction control (RNase P) yielded valid amplification.',
        verifiedBy: {
          name: 'Dr. Arthur Conan, MD, FACP',
          designation: 'Chief Consultant Pathologist',
          licenseNumber: 'MED-PATH-88492',
        },
        technician: {
          name: 'Elena Rostova, MLT',
          role: 'Molecular Diagnostics Specialist',
        },
        requestedAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
        processingStartedAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 21 * 60 * 60 * 1000),
        verifiedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
        statusHistory: [
          { status: 'REQUESTED', timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000), updatedBy: 'Dr. Robert Chen', note: 'Upper respiratory symptom evaluation.' },
          { status: 'SAMPLE_COLLECTED', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), updatedBy: 'Clara Oswald, RN', note: 'Nasopharyngeal swab placed in viral transport media.' },
          { status: 'PROCESSING', timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000), updatedBy: 'Elena Rostova, MLT', note: 'RNA extraction and BioFire FilmArray PCR run.' },
          { status: 'COMPLETED', timestamp: new Date(Date.now() - 21 * 60 * 60 * 1000), updatedBy: 'Elena Rostova, MLT', note: 'PCR melting curves confirmed negative.' },
          { status: 'VERIFIED', timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000), updatedBy: 'Dr. Arthur Conan, MD', note: 'Molecular report released.' },
        ],
      },
    ];
    await LabReport.insertMany(labReportsData);

    // 10. Seed Admissions
    console.log('Seeding Admissions...');
    const admissionsData = [
      {
        patient: patientMichael._id,
        doctor: docSarah._id,
        bed: bedMap['GW-102']._id,
        admissionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        expectedDischargeDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        reason: 'Acute cardiovascular observation post arrhythmia episode',
        status: 'ADMITTED',
      },
      {
        patient: patientJames._id,
        doctor: docSarah._id,
        bed: bedMap['ICU-201']._id,
        admissionDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        expectedDischargeDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        reason: 'Post-operative monitoring after coronary stenting',
        status: 'ADMITTED',
      },
      {
        patient: patientEmma._id,
        doctor: docRobert._id,
        bed: bedMap['PV-301']._id,
        admissionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        dischargeDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        reason: 'Severe gastroenteritis rehydration and electrolyte recovery',
        status: 'DISCHARGED',
      },
    ];
    await Admission.insertMany(admissionsData);

    // 11. Seed Bills
    console.log('Seeding Bills...');
    const billsData = [
      {
        patient: patientJohn._id,
        appointment: appointments[0]._id,
        items: [
          { description: 'Cardiology Specialist Consultation', category: 'CONSULTATION', quantity: 1, price: 120, amount: 120 },
          { description: 'Complete Blood Count & Lipid Profile', category: 'LAB', quantity: 1, price: 45, amount: 45 },
        ],
        subtotal: 165,
        tax: 8.25,
        discount: 10.0,
        total: 163.25,
        paymentStatus: 'PAID',
        paymentMethod: 'CARD',
        paidAt: new Date(),
      },
      {
        patient: patientMichael._id,
        appointment: appointments[2]._id,
        items: [
          { description: 'Neurology Consultation', category: 'CONSULTATION', quantity: 1, price: 150, amount: 150 },
          { description: 'Serum Electrolytes & TSH Panel', category: 'LAB', quantity: 1, price: 35, amount: 35 },
          { description: 'Inpatient General Ward Bed (3 days)', category: 'ADMISSION', quantity: 3, price: 50, amount: 150 },
        ],
        subtotal: 335,
        tax: 16.75,
        discount: 0,
        total: 351.75,
        paymentStatus: 'PENDING',
        paymentMethod: 'CASH',
      },
      {
        patient: patientMary._id,
        appointment: appointments[1]._id,
        items: [
          { description: 'General Physician Consultation', category: 'CONSULTATION', quantity: 1, price: 80, amount: 80 },
          { description: 'Viral Respiratory PCR Panel', category: 'LAB', quantity: 1, price: 60, amount: 60 },
          { description: 'Paracetamol & Antihistamine Pack', category: 'MEDICINE', quantity: 2, price: 10, amount: 20 },
        ],
        subtotal: 160,
        tax: 8.0,
        discount: 5.0,
        total: 163.0,
        paymentStatus: 'PAID',
        paymentMethod: 'ONLINE',
        paidAt: new Date(),
      },
    ];
    await Bill.insertMany(billsData);

    // 12. Seed Notifications
    console.log('Seeding In-App Notifications...');
    const notificationsData = [
      {
        user: patientJohn._id,
        title: 'Appointment Confirmed',
        message: 'Your appointment with Dr. Sarah Jenkins is confirmed for today at 09:00 AM.',
        type: 'APPOINTMENT',
        isRead: false,
        link: '/patient/appointments',
      },
      {
        user: patientJohn._id,
        title: 'Lab Report Ready',
        message: 'Your laboratory report for "Complete Blood Count (CBC) & Lipid Profile" is available.',
        type: 'LAB',
        isRead: true,
        link: '/patient/lab-reports',
      },
      {
        user: docSarah._id,
        title: 'New Appointment Booked',
        message: 'Patient John Doe booked an appointment for Cardiology today.',
        type: 'APPOINTMENT',
        isRead: false,
        link: '/doctor/appointments',
      },
      {
        user: userMap['admin.elitecare@gmail.com']._id,
        title: 'Low Stock Alert',
        message: 'Medicine "Amoxicillin 500mg" has fallen below minimum threshold (8 left).',
        type: 'PHARMACY',
        isRead: false,
      },
      {
        user: userMap['pharmacy.elitecare@gmail.com']._id,
        title: 'Medicine Expiry Alert',
        message: 'Atorvastatin 20mg batch ATV-2025-099 is expiring within 30 days.',
        type: 'PHARMACY',
        isRead: false,
      },
    ];
    await Notification.insertMany(notificationsData);

    // 14. Seed Conversations and Chat Messages
    console.log('Seeding Real-Time Conversations & Chat Messages...');
    const convSarahJohn = await Conversation.create({
      participants: [patientJohn._id, docSarah._id],
      patient: patientJohn._id,
      doctor: docSarah._id,
      status: 'ACTIVE',
      lastMessageText: 'Thank you doctor! Will monitor my blood pressure daily.',
      lastMessageAt: new Date(),
      patientUnread: 0,
      doctorUnread: 1,
    });

    const messagesSarahJohn = [
      {
        conversation: convSarahJohn._id,
        sender: patientJohn._id,
        recipient: docSarah._id,
        content: 'Hello Dr. Sarah, I wanted to follow up on my recent Cardiology test results.',
        status: 'READ',
        readAt: new Date(Date.now() - 3600000 * 2),
        createdAt: new Date(Date.now() - 3600000 * 2),
      },
      {
        conversation: convSarahJohn._id,
        sender: docSarah._id,
        recipient: patientJohn._id,
        content: 'Hello John, your ECG is normal. Continue your current prescribed medication and stay well hydrated.',
        status: 'READ',
        readAt: new Date(Date.now() - 3600000 * 1),
        createdAt: new Date(Date.now() - 3600000 * 1),
      },
      {
        conversation: convSarahJohn._id,
        sender: patientJohn._id,
        recipient: docSarah._id,
        content: 'Thank you doctor! Will monitor my blood pressure daily.',
        status: 'DELIVERED',
        createdAt: new Date(),
      },
    ];
    const insertedMessages = await ChatMessage.insertMany(messagesSarahJohn);
    await Conversation.findByIdAndUpdate(convSarahJohn._id, {
      lastMessage: insertedMessages[2]._id,
    });

    // Conversation between Mary and Dr. Robert
    const convRobertMary = await Conversation.create({
      participants: [patientMary._id, docRobert._id],
      patient: patientMary._id,
      doctor: docRobert._id,
      status: 'ACTIVE',
      lastMessageText: 'Please keep me updated if your cough persists.',
      lastMessageAt: new Date(Date.now() - 1800000),
      patientUnread: 1,
      doctorUnread: 0,
    });

    const msgRobert = await ChatMessage.create({
      conversation: convRobertMary._id,
      sender: docRobert._id,
      recipient: patientMary._id,
      content: 'Please keep me updated if your cough persists.',
      status: 'SENT',
      createdAt: new Date(Date.now() - 1800000),
    });
    await Conversation.findByIdAndUpdate(convRobertMary._id, {
      lastMessage: msgRobert._id,
    });

    // 15. Seed Emergency Alerts
    console.log('Seeding Emergency Alerts...');
    const emergencyAlertsData = [
      {
        patient: patientMichael._id,
        doctor: docSarah._id,
        conversation: convSarahJohn._id,
        description: 'Severe acute chest pressure radiating to left arm accompanied by heavy sweating.',
        symptoms: 'Chest pain, dyspnea, diaphoresis',
        priority: 'CRITICAL',
        status: 'PENDING',
        auditTrail: [
          {
            status: 'PENDING',
            changedBy: patientMichael._id,
            changedAt: new Date(Date.now() - 1200000),
            note: 'Emergency alert initiated by patient',
          },
        ],
        createdAt: new Date(Date.now() - 1200000),
      },
      {
        patient: patientMary._id,
        doctor: docRobert._id,
        conversation: convRobertMary._id,
        description: 'Sudden onset acute abdominal pain with high fever 102.8°F.',
        symptoms: 'Abdominal spasm, hyperthermia, vomiting',
        priority: 'HIGH',
        status: 'ACKNOWLEDGED',
        acknowledgedBy: docRobert._id,
        acknowledgedAt: new Date(Date.now() - 600000),
        acknowledgementNote: 'Dr. Robert Chen acknowledged. Triage nurse dispatched to ER bay 3.',
        auditTrail: [
          {
            status: 'PENDING',
            changedBy: patientMary._id,
            changedAt: new Date(Date.now() - 900000),
            note: 'Emergency alert triggered by patient',
          },
          {
            status: 'ACKNOWLEDGED',
            changedBy: docRobert._id,
            changedAt: new Date(Date.now() - 600000),
            note: 'Triage coordinated',
          },
        ],
        createdAt: new Date(Date.now() - 900000),
      },
    ];
    await EmergencyAlert.insertMany(emergencyAlertsData);

    console.log('==================================================');
    console.log(' DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log(' Demo Accounts Created (Password: Password123!):');
    console.log('   - Admin:    admin.elitecare@gmail.com');
    console.log('   - Doctor:   doctor.sarah@gmail.com (Cardiology)');
    console.log('   - Doctor:   doctor.robert@gmail.com (General Medicine)');
    console.log('   - Doctor:   doctor.emily@gmail.com (Neurology)');
    console.log('   - Lab:      lab.elitecare@gmail.com');
    console.log('   - Pharmacy: pharmacy.elitecare@gmail.com');
    console.log('   - Patient:  patient.john@gmail.com');
    console.log('   - Patient:  patient.mary@gmail.com');
    console.log('==================================================');

    if (shouldClose) {
      await closeDB();
      process.exit(0);
    }
  } catch (error) {
    console.error('Database seeding error:', error);
    if (shouldClose) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedData(true);
}

module.exports = seedData;
