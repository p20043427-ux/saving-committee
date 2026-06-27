import React from "react";
import { HospitalLogo } from "./components/ui/HospitalLogo";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { Monitoring } from "./pages/Monitoring";
import { Management } from "./pages/Management";
import { Admin } from "./pages/Admin";
import { YearlyReport } from "./pages/YearlyReport";
import { DataManagement } from "./pages/DataManagement";
import { Committee } from "./pages/Committee";
import { Schedule } from "./pages/Schedule";
import { Events } from "./pages/Events";
import { Login } from "./pages/Login";
import { SignUp } from "./pages/SignUp";
import { AuthProvider, useAuth } from "./components/auth/AuthProvider";
import { OrganizationProvider } from "./components/layout/OrganizationProvider";
import { InstallPrompt, IOSInstallGuide } from "./components/ui/InstallPrompt";

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-900">
        <div className="text-center flex flex-col items-center gap-3">
          <HospitalLogo size={64} showText={false} variant="symbol" />
          <p className="text-primary-300 text-sm">시스템 초기화 중...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <OrganizationProvider>
      <AppLayout />
    </OrganizationProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/" element={<ProtectedRoutes />}>
            <Route index element={<Dashboard />} />
            <Route path="monitoring" element={<Monitoring />} />
            <Route path="data-management" element={<DataManagement />} />
            <Route path="committee" element={<Committee />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="events" element={<Events />} />
            <Route path="management" element={<Management />} />
            <Route path="yearly-report" element={<YearlyReport />} />
            <Route path="admin" element={<Admin />} />
          </Route>
        </Routes>
        <InstallPrompt />
        <IOSInstallGuide />
      </AuthProvider>
    </BrowserRouter>
  );
}
