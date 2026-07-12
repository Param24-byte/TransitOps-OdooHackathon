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
import Reports from "./pages/Reports";
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
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="drivers" element={<Drivers />} />
            <Route path="trips" element={<Trips />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/reports" element={<Reports />} />
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
