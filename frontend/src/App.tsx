import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { EmergencyRequest } from './pages/EmergencyRequest';
import { AIChat } from './pages/AIChat';
import { EligibilityChecker } from './pages/EligibilityChecker';
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboard } from './pages/AdminDashboard';
import { DonorVerification } from './pages/DonorVerification';
import { UserManagement } from './pages/UserManagement';
import { RequestManagement } from './pages/RequestManagement';
import { InventoryManagement } from './pages/InventoryManagement';
import { Reports } from './pages/Reports';
import { AuditLogs } from './pages/AuditLogs';

// Route Guard for Protected Routes
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100">
        <div className="w-10 h-10 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/request/new"
            element={
              <PrivateRoute>
                <EmergencyRequest />
              </PrivateRoute>
            }
          />
          <Route
            path="/eligibility"
            element={
              <PrivateRoute>
                <EligibilityChecker />
              </PrivateRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <PrivateRoute>
                <AIChat />
              </PrivateRoute>
            }
          />

          {/* Secure Admin Namespace routes */}
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="verify" element={<DonorVerification />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="requests" element={<RequestManagement />} />
            <Route path="inventory" element={<InventoryManagement />} />
            <Route path="reports" element={<Reports />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>

          {/* Default Catch-all redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
