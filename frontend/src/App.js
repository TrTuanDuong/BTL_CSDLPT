import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HomePage from './pages/user/HomePage';
import MovieDetailPage from './pages/user/MovieDetailPage';
import BookingPage from './pages/user/BookingPage';
import PaymentPage from './pages/user/PaymentPage';
import UserProfilePage from './pages/user/UserProfilePage';
import BookingHistoryPage from './pages/user/BookingHistoryPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMovies from './pages/admin/AdminMovies';
import AdminGenres from './pages/admin/AdminGenres';
import AdminAuditoriums from './pages/admin/AdminAuditoriums';
import AdminShowtimes from './pages/admin/AdminShowtimes';
import AdminBranches from './pages/admin/AdminBranches';
import AdminBranchReports from './pages/admin/AdminBranchReports';
import AdminStaffAssignments from './pages/admin/AdminStaffAssignments';
import AdminUsers from './pages/admin/AdminUsers';
import AdminReports from './pages/admin/AdminReports';

// Layouts
import UserLayout from './components/layout/UserLayout';
import AdminLayout from './components/layout/AdminLayout';
import StaffLayout from './components/layout/StaffLayout';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffShowtimes from './pages/staff/StaffShowtimes';
import StaffBookings from './pages/staff/StaffBookings';
import StaffPayments from './pages/staff/StaffPayments';

import './styles/App.css';

// Protected Route cho User
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Đang tải...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Protected Route cho Admin
const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Đang tải...</div>;
  }
  
  return user && isAdmin ? children : <Navigate to="/" />;
};

// Protected Route cho Staff (hoặc Admin)
const StaffRoute = ({ children }) => {
  const { user, isStaff, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Đang tải...</div>;
  }

  return user && (isStaff || isAdmin) ? children : <Navigate to="/" />;
};

function App() {
  const { loading } = useAuth();

  // Hiển thị loading khi đang kiểm tra auth
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">🎬 Đang tải...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* User Routes */}
        <Route path="/" element={<UserLayout />}>
          <Route index element={<HomePage />} />
          <Route path="movies/:id" element={<MovieDetailPage />} />
          <Route path="booking/:showtimeId" element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          } />
          <Route path="payment/:bookingId" element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute>
              <UserProfilePage />
            </ProtectedRoute>
          } />
          <Route path="bookings" element={
            <ProtectedRoute>
              <BookingHistoryPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* Staff Routes */}
        <Route path="/staff" element={
          <StaffRoute>
            <StaffLayout />
          </StaffRoute>
        }>
          <Route index element={<StaffDashboard />} />
          <Route path="showtimes" element={<StaffShowtimes />} />
          <Route path="bookings" element={<StaffBookings />} />
          <Route path="payments" element={<StaffPayments />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="movies" element={<AdminMovies />} />
          <Route path="genres" element={<AdminGenres />} />
          <Route path="auditoriums" element={<AdminAuditoriums />} />
          <Route path="showtimes" element={<AdminShowtimes />} />
          <Route path="branches" element={<AdminBranches />} />
          <Route path="branch-reports" element={<AdminBranchReports />} />
          <Route path="staff" element={<AdminStaffAssignments />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
