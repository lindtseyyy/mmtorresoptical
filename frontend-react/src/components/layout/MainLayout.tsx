import { Outlet } from "react-router-dom";
import Sidenav from "./Sidenav";
import { Toaster } from "@/components/ui/sonner"; // 👈 1. Import Toaster

const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-brand-gray-lightest">
      {/* The Sidebar, which is fixed */}
      <Sidenav />

      {/* The Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {/* This is the critical part from react-router.
          It renders the active child route (e.g., <ManageInventory /> 
          or <ManageUsers />) defined in your createBrowserRouter.
        */}
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
};

export default MainLayout;
