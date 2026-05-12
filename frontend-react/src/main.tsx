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

// --- Users ---
import ManageUsers from "@/features/users/components/ManageUsers";
import AddUser from "@/features/users/components/AddUser";
import EditUser from "@/features/users/components/EditUser";

// --- Patients ---
import ManagePatients from "@/features/patients/components/ManagePatients";
import AddPatient from "@/features/patients/components/AddPatient";
import EditPatient from "@/features/patients/components/EditPatient";
import AddPrescription from "@/features/patients/components/AddPrescription";
import AddHealthHistory from "@/features/patients/components/AddHealthHistory";
import ViewPatient from "@/features/patients/components/ViewPatient";

// --- Shared ---
import MainLayout from "@/shared/components/layout/MainLayout";
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
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/inventory" replace /> },
      { path: "inventory", element: <ManageInventory /> },
      { path: "inventory/add", element: <AddProduct /> },
      { path: "inventory/edit/:id", element: <EditProduct /> },
      {
        path: "patients",
        element: <AdminGuard><Outlet /></AdminGuard>,
        children: [
          { index: true, element: <ManagePatients /> },
          { path: "add", element: <AddPatient /> },
          { path: "add/prescription", element: <AddPrescription /> },
          { path: "add/health-history", element: <AddHealthHistory /> },
          { path: "view/:id", element: <ViewPatient /> },
          { path: "edit/:id", element: <EditPatient /> },
        ],
      },
      {
        path: "users",
        element: <AdminGuard><Outlet /></AdminGuard>,
        children: [
          { index: true, element: <ManageUsers /> },
          { path: "add", element: <AddUser /> },
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
