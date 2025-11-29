import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import SeatBooking from "./pages/SeatBooking";
import ReservationConfirmation from "./pages/ReservationConfirmation";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import MovieManagement from "./pages/MovieManagement";
import HallManagement from "./pages/HallManagement";
import ReservationManagement from "./pages/ReservationManagement";
import UserLogin from "./pages/UserLogin";
import UserRegister from "./pages/UserRegister";
import UserDashboard from "./pages/UserDashboard";
import { UserAuthProvider } from "./contexts/UserAuthContext";
import "./App.css";

// Protected Route Component for Admin Routes
const ProtectedRoute = ({ children }) => {
  const isAdminLoggedIn = localStorage.getItem("adminLoggedIn") === "true";
  return isAdminLoggedIn ? children : <Navigate to="/admin/login" />;
};

// Protected Route Component for User Routes
const UserProtectedRoute = ({ children }) => {
  const userToken = localStorage.getItem("userToken");
  return userToken ? children : <Navigate to="/user/login" />;
};

function App() {
  return (
    <Router>
      <UserAuthProvider>
        <div className="App">
          <Routes>
            {/* Customer Routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/booking" element={<SeatBooking />} />
            <Route path="/confirmation" element={<ReservationConfirmation />} />

            {/* User Authentication Routes */}
            <Route path="/user/login" element={<UserLogin />} />
            <Route path="/user/register" element={<UserRegister />} />
            <Route
              path="/user/dashboard"
              element={
                <UserProtectedRoute>
                  <UserDashboard />
                </UserProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/movies"
              element={
                <ProtectedRoute>
                  <MovieManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/halls"
              element={
                <ProtectedRoute>
                  <HallManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/showtimes"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reservations"
              element={
                <ProtectedRoute>
                  <ReservationManagement />
                </ProtectedRoute>
              }
            />

            {/* Redirect /admin to /admin/dashboard */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
          </Routes>
        </div>
      </UserAuthProvider>
    </Router>
  );
}

export default App;
