import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ImportPage } from './components/ImportPage';
import { InventoryPage } from './components/InventoryPage';
import { ReconciliationPage } from './components/ReconciliationPage';
import { TrackingPage } from './components/TrackingPage';
import { VendorsPage } from './components/VendorsPage';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { PendingApprovalPage } from './components/PendingApprovalPage';
import { UnauthorizedPage } from './components/UnauthorizedPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminUsersPage } from './components/AdminUsersPage';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/pending" element={<PendingApprovalPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route element={<ProtectedRoute allowedRoles={['admin', 'user']} />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/tracking" element={<TrackingPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin']} />}> 
          <Route element={<Layout />}>
            <Route path="/import" element={<ImportPage />} />
            <Route path="/reconciliation" element={<ReconciliationPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin', 'user']} requireVendorAccess={true} />}> 
          <Route element={<Layout />}>
            <Route path="/vendors" element={<VendorsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
