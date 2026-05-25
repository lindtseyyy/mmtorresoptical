// src/index.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./index.css";

// --- Auth ---
import Login from "@/features/auth/components/Login";
import EnforcePasswordChange from "@/features/auth/components/EnforcePasswordChange";
import ForgotPassword from "@/features/auth/components/ForgotPassword";

// --- Inventory ---
import ManageInventory from "@/features/inventory/components/ManageInventory";
import AddProduct from "@/features/inventory/components/AddProduct";
import EditProduct from "@/features/inventory/components/EditProduct";
import ViewProduct from "@/features/inventory/components/ViewProduct";

// --- Users ---
import ManageUsers from "@/features/users/components/ManageUsers";
import AddUser from "@/features/users/components/AddUser";
import EditUser from "@/features/users/components/EditUser";
import ViewUser from "@/features/users/components/ViewUser";

// --- Patients ---
import ManagePatients from "@/features/patients/components/ManagePatients";
import AddPatient from "@/features/patients/components/AddPatient";
import EditPatient from "@/features/patients/components/EditPatient";
import AddPrescription from "@/features/patients/components/AddPrescription";
import EditPrescription from "@/features/patients/components/EditPrescription";
import AddEyeExam from "@/features/patients/components/AddEyeExam";
import ViewPatient from "@/features/patients/components/ViewPatient";

// --- Sales ---
import ManageSales from "@/features/sales/components/ManageSales";
import ManageTransactions from "@/features/sales/components/ManageTransactions";
import ViewTransaction from "@/features/sales/components/ViewTransaction";

// --- Admin ---
import BackupRestore from "@/features/admin/components/BackupRestore";
import AuditLogs from "@/features/admin/components/AuditLogs";
import UserMaintenance from "@/features/admin/components/UserMaintenance";
import PatientMaintenance from "@/features/admin/components/PatientMaintenance";
import InventoryMaintenance from "@/features/admin/components/InventoryMaintenance";

// --- Reports ---
import Reports from "@/features/reports/components/Reports";

// --- Help ---
import HelpPage from "@/features/help/components/HelpPage";

// --- Dashboard ---
import Dashboard from "@/features/dashboard/components/Dashboard";

// --- About ---
import AboutPage from "@/features/about/components/AboutPage";

// --- Profile ---
import EditProfile from "@/features/profile/components/EditProfile";

// --- Shared ---
import MainLayout from "@/shared/components/layout/MainLayout";
import AuthGuard from "@/shared/components/layout/AuthGuard";
import AdminGuard from "@/shared/components/layout/AdminGuard";
import NotFound from "@/shared/components/layout/NotFound";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/enforce-password-change",
    element: <EnforcePasswordChange />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    // This is your protected route group
    path: "/",
    element: <AuthGuard><MainLayout /></AuthGuard>,
    children: [
      { index: true, element: <Navigate to="/inventory" replace /> },
      { path: "dashboard", element: <AdminGuard><Dashboard /></AdminGuard> },
      { path: "profile", element: <EditProfile /> },
      { path: "help", element: <HelpPage /> },
      { path: "about", element: <AboutPage /> },
      { path: "sales", element: <ManageSales /> },
      { path: "transactions", element: <ManageTransactions /> },
      { path: "transactions/:id", element: <ViewTransaction /> },
      { path: "reports", element: <AdminGuard><Reports /></AdminGuard> },
      { path: "inventory", element: <ManageInventory /> },
      { path: "inventory/add", element: <AddProduct /> },
      { path: "inventory/edit/:id", element: <EditProduct /> },
      { path: "inventory/view/:id", element: <ViewProduct /> },
      {
        path: "patients",
        element: <AdminGuard><Outlet /></AdminGuard>,
        children: [
          { index: true, element: <ManagePatients /> },
          { path: "add", element: <AddPatient /> },
          { path: "add/prescription", element: <AddPrescription /> },
          { path: "edit/prescription", element: <EditPrescription /> },
          { path: "add/eye-exam", element: <AddEyeExam /> },
          { path: "view/:id", element: <ViewPatient /> },
          { path: "edit/:id", element: <EditPatient /> },
        ],
      },
      {
        path: "admin",
        element: <AdminGuard><Outlet /></AdminGuard>,
        children: [
          { path: "backup-restore", element: <BackupRestore /> },
          { path: "audit-logs", element: <AuditLogs /> },
          { path: "user-maintenance", element: <UserMaintenance /> },
          { path: "patient-maintenance", element: <PatientMaintenance /> },
          { path: "inventory-maintenance", element: <InventoryMaintenance /> },
        ],
      },
      {
        path: "users",
        element: <AdminGuard><Outlet /></AdminGuard>,
        children: [
          { index: true, element: <ManageUsers /> },
          { path: "add", element: <AddUser /> },
          { path: "view/:id", element: <ViewUser /> },
          { path: "edit/:id", element: <EditUser /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
