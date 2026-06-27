import React, { lazy, Suspense } from "react";
import { HospitalLogo } from "./components/ui/HospitalLogo";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import { SkeletonCard } from "./components/ui/Skeleton";

const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const Monitoring = lazy(() => import("./pages/Monitoring").then(m => ({ default: m.Monitoring })));
const Management = lazy(() => import("./pages/Management").then(m => ({ default: m.Management })));
const Admin = lazy(() => import("./pages/Admin").then(m => ({ default: m.Admin })));
const YearlyReport = lazy(() => import("./pages/YearlyReport").then(m => ({ default: m.YearlyReport })));
const DataManagement = lazy(() => import("./pages/DataManagement").then(m => ({ default: m.DataManagement })));
const Committee = lazy(() => import("./pages/Committee").then(m => ({ default: m.Committee })));
const Schedule = lazy(() => import("./pages/Schedule").then(m => ({ default: m.Schedule })));
const Events = lazy(() => import("./pages/Events").then(m => ({ default: m.Events })));
const Login = lazy(() => import("./pages/Login").then(m => ({ default: m.Login })));
const SignUp = lazy(() => import("./pages/SignUp").then(m => ({ default: m.SignUp })));

function PageFallback() {
  return (
    <div className="space-y-4 p-4">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}
import { AuthProvider, useAuth } from "./components/auth/AuthProvider";
import { OrganizationProvider } from "./components/layout/OrganizationProvider";
import { InstallPrompt, IOSInstallGuide } from "./components/ui/InstallPrompt";
import { AppToaster } from "./components/ui/Toast";
import { ErrorBoundary } from "./components/ErrorBoundary";

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
    <ErrorBoundary>
      <OrganizationProvider>
        <Suspense fallback={<PageFallback />}>
          <AppLayout />
        </Suspense>
      </OrganizationProvider>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Suspense fallback={null}><Login /></Suspense>} />
          <Route path="/signup" element={<Suspense fallback={null}><SignUp /></Suspense>} />
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
        <AppToaster />
        <InstallPrompt />
        <IOSInstallGuide />
      </AuthProvider>
    </BrowserRouter>
  );
}
