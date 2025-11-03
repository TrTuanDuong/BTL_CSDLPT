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

// Layouts
import UserLayout from './components/layout/UserLayout';
import AdminLayout from './components/layout/AdminLayout';

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
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
