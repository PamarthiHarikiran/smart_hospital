import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';

// Route Guards
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Patient Pages
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientProfile from './pages/patient/PatientProfile';
import PatientDoctors from './pages/patient/PatientDoctors';
import PatientAppointments from './pages/patient/PatientAppointments';
import PatientMedicalRecords from './pages/patient/PatientMedicalRecords';
import PatientPrescriptions from './pages/patient/PatientPrescriptions';
import PatientLabReports from './pages/patient/PatientLabReports';
import PatientBills from './pages/patient/PatientBills';
import PatientNotifications from './pages/patient/PatientNotifications';
import PatientChat from './pages/patient/PatientChat';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorPatientDetail from './pages/doctor/DoctorPatientDetail';
import DoctorMedicalRecords from './pages/doctor/DoctorMedicalRecords';
import DoctorPrescriptions from './pages/doctor/DoctorPrescriptions';
import DoctorLabReports from './pages/doctor/DoctorLabReports';
import DoctorMessages from './pages/doctor/DoctorMessages';

// Laboratory Pages
import LabDashboard from './pages/laboratory/LabDashboard';
import LabRequests from './pages/laboratory/LabRequests';
import LabReports from './pages/laboratory/LabReports';
import LabReportDetail from './pages/laboratory/LabReportDetail';

// Pharmacy Pages
import PharmacyDashboard from './pages/pharmacy/PharmacyDashboard';
import PharmacyMedicines from './pages/pharmacy/PharmacyMedicines';
import PharmacyInventory from './pages/pharmacy/PharmacyInventory';
import PharmacyPrescriptions from './pages/pharmacy/PharmacyPrescriptions';
import PharmacyAlerts from './pages/pharmacy/PharmacyAlerts';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminBeds from './pages/admin/AdminBeds';
import AdminAdmissions from './pages/admin/AdminAdmissions';
import AdminBills from './pages/admin/AdminBills';
import AdminMedicines from './pages/admin/AdminMedicines';
import AdminEmergencyAlerts from './pages/admin/AdminEmergencyAlerts';

// Root Redirect component based on auth state and role
const RootRedirect = () => {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const dashboards = {
    PATIENT: '/patient/dashboard',
    DOCTOR: '/doctor/dashboard',
    LAB: '/lab/dashboard',
    PHARMACY: '/pharmacy/dashboard',
    ADMIN: '/admin/dashboard',
  };

  return <Navigate to={dashboards[role] || '/login'} replace />;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
          {/* Public Routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* PATIENT Routes */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['PATIENT']}>
                  <DashboardLayout />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<PatientDashboard />} />
            <Route path="profile" element={<PatientProfile />} />
            <Route path="doctors" element={<PatientDoctors />} />
            <Route path="appointments" element={<PatientAppointments />} />
            <Route path="medical-records" element={<PatientMedicalRecords />} />
            <Route path="prescriptions" element={<PatientPrescriptions />} />
            <Route path="lab-reports" element={<PatientLabReports />} />
            <Route path="bills" element={<PatientBills />} />
            <Route path="notifications" element={<PatientNotifications />} />
            <Route path="chat" element={<PatientChat />} />
          </Route>

          {/* DOCTOR Routes */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['DOCTOR']}>
                  <DashboardLayout />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<DoctorDashboard />} />
            <Route path="messages" element={<DoctorMessages />} />
            <Route path="appointments" element={<DoctorAppointments />} />
            <Route path="patients" element={<DoctorPatients />} />
            <Route path="patients/:id" element={<DoctorPatientDetail />} />
            <Route path="medical-records" element={<DoctorMedicalRecords />} />
            <Route path="prescriptions" element={<DoctorPrescriptions />} />
            <Route path="lab-reports" element={<DoctorLabReports />} />
          </Route>

          {/* LAB Routes */}
          <Route
            path="/lab"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['LAB', 'ADMIN']}>
                  <DashboardLayout />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<LabDashboard />} />
            <Route path="requests" element={<LabRequests />} />
            <Route path="reports" element={<LabReports />} />
            <Route path="reports/:id" element={<LabReportDetail />} />
          </Route>

          {/* PHARMACY Routes */}
          <Route
            path="/pharmacy"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['PHARMACY', 'ADMIN']}>
                  <DashboardLayout />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<PharmacyDashboard />} />
            <Route path="medicines" element={<PharmacyMedicines />} />
            <Route path="inventory" element={<PharmacyInventory />} />
            <Route path="prescriptions" element={<PharmacyPrescriptions />} />
            <Route path="alerts" element={<PharmacyAlerts />} />
          </Route>

          {/* ADMIN Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <RoleRoute allowedRoles={['ADMIN']}>
                  <DashboardLayout />
                </RoleRoute>
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="departments" element={<AdminDepartments />} />
            <Route path="appointments" element={<AdminAppointments />} />
            <Route path="beds" element={<AdminBeds />} />
            <Route path="admissions" element={<AdminAdmissions />} />
            <Route path="bills" element={<AdminBills />} />
            <Route path="medicines" element={<AdminMedicines />} />
            <Route path="emergency-alerts" element={<AdminEmergencyAlerts />} />
          </Route>

          {/* Fallback Catch-all */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
      </ThemeProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
