// src/index.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom"; // Make sure to import Navigate
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./index.css";

// --- Import all your pages and layouts ---
import Login from "./pages/Login.tsx";
import MainLayout from "./components/layout/MainLayout.tsx";
import ManageInventory from "./pages/ManageInventory.tsx";
import ManageUsers from "./pages/ManageUsers.tsx";
import AddProduct from "./pages/AddProduct.tsx"; // 👈 ADD THIS
import EditProduct from "./pages/EditProduct.tsx"; // 👈 ADD THIS
import AddUser from "./pages/AddUser.tsx"; // 👈 ADD THI
import EditUser from "./pages/EditUser.tsx";
// We don't need App.tsx for routing anymore
const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    // This is your protected route group
    path: "/",
    element: <MainLayout />, // MainLayout renders the Sidenav and an <Outlet>
    children: [
      { index: true, element: <Navigate to="/inventory" replace /> },
      { path: "inventory", element: <ManageInventory /> },
      { path: "inventory/add", element: <AddProduct /> }, // 👈 ADD THIS
      { path: "inventory/edit/:id", element: <EditProduct /> }, // 👈 ADD THIS
      { path: "users", element: <ManageUsers /> },
      // User routes
      { path: "users", element: <ManageUsers /> },
      { path: "users/add", element: <AddUser /> }, // 👈 ADD THIS
      { path: "users/edit/:id", element: <EditUser /> }, // 👈 ADD THIS
    ],
  },
  // You could also add a 404 route
  // {
  //   path: "*",
  //   element: <NotFoundPage />
  // }
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
);
