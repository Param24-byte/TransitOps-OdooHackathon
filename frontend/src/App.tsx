import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { Toaster } from "./components/ui/toaster";

import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import Trips from "./pages/Trips";
import Maintenance from "./pages/Maintenance";
import Expenses from "./pages/Expenses";
import Settings from "./pages/Settings";
import { ThemeProvider } from "next-themes";

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const RoleRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { user } = useAuth();
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="transitops-theme" attribute="class">
      <AuthProvider>
        <Router>
          <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="vehicles" element={<RoleRoute allowedRoles={["FLEET_MANAGER", "DISPATCHER", "MAINTENANCE_TECH"]}><Vehicles /></RoleRoute>} />
            <Route path="drivers" element={<RoleRoute allowedRoles={["FLEET_MANAGER", "DISPATCHER", "SAFETY_OFFICER"]}><Drivers /></RoleRoute>} />
            <Route path="trips" element={<RoleRoute allowedRoles={["FLEET_MANAGER", "DISPATCHER", "DRIVER"]}><Trips /></RoleRoute>} />
            <Route path="maintenance" element={<RoleRoute allowedRoles={["FLEET_MANAGER", "MAINTENANCE_TECH"]}><Maintenance /></RoleRoute>} />
            <Route path="expenses" element={<RoleRoute allowedRoles={["FLEET_MANAGER", "FINANCIAL_ANALYST"]}><Expenses /></RoleRoute>} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
