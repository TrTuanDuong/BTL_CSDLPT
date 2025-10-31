import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/AdminLayout.css';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/movies', label: 'Quản lý Phim', icon: '🎬' },
    { path: '/admin/genres', label: 'Quản lý Thể loại', icon: '🏷️' },
    { path: '/admin/auditoriums', label: 'Quản lý Phòng chiếu', icon: '🎭' },
    { path: '/admin/showtimes', label: 'Quản lý Suất chiếu', icon: '⏰' },
  ];

  return (
    <div className="admin-layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>🎬 Admin Panel</h2>
          <button 
            className="toggle-sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${
                location.pathname === item.path ? 'active' : ''
              }`}
            >
              <span className="icon">{item.icon}</span>
              {sidebarOpen && <span className="label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="sidebar-link">
            <span className="icon">🏠</span>
            {sidebarOpen && <span className="label">Về trang chủ</span>}
          </Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-content">
            <h1>Quản trị hệ thống</h1>
            <div className="admin-user-menu">
              <span className="admin-user-name">👤 {user?.username}</span>
              <button onClick={handleLogout} className="btn-logout">
                Đăng xuất
              </button>
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
