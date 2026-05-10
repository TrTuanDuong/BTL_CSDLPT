import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBranch } from '../../contexts/BranchContext';
import '../../styles/Layout.css';

const UserLayout = () => {
  const { user, isAdmin, logout } = useAuth();
  const { branches, selectedBranch, setBranchId } = useBranch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <Link to="/" className="logo">
              🎬 Cinema Booking
            </Link>
            
            <nav className="nav">
              <Link to="/" className="nav-link">Phim</Link>
              {user && (
                <>
                  <Link to="/bookings" className="nav-link">Vé </Link>
                  <Link to="/profile" className="nav-link">Tài khoản</Link>
                </>
              )}
              {isAdmin && (
                <Link to="/admin" className="nav-link admin-link">
                  Quản lý
                </Link>
              )}
            </nav>

            <div className="branch-switcher">
              <label htmlFor="branch-selector">Chi nhánh</label>
              <select
                id="branch-selector"
                value={selectedBranch?.id || ''}
                onChange={(e) => setBranchId(e.target.value)}
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="auth-section">
              {user ? (
                <div className="user-menu">
                  <span className="user-name">👋 {user.username}</span>
                  <button onClick={handleLogout} className="btn-logout">
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="auth-buttons">
                  <Link to="/login" className="btn-login">Đăng nhập</Link>
                  <Link to="/register" className="btn-register">Đăng ký</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 Cinema Booking System - BTL Cơ sở dữ liệu PTIT</p>
        </div>
      </footer>
    </div>
  );
};

export default UserLayout;
