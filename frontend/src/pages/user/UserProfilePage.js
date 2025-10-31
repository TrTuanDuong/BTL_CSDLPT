import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import '../../styles/Profile.css';

const UserProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
  });
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        date_of_birth: user.date_of_birth || '',
      });
    }
  }, [user]);

  const handleInfoChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await authAPI.updateProfile(formData);
      updateUser(response.data.user);
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Cập nhật thất bại',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validation
    if (!passwordData.old_password) {
      setMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu hiện tại' });
      setLoading(false);
      return;
    }

    if (!passwordData.new_password) {
      setMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu mới' });
      setLoading(false);
      return;
    }

    if (passwordData.new_password.length < 8) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 8 ký tự' });
      setLoading(false);
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      setLoading(false);
      return;
    }

    if (passwordData.old_password === passwordData.new_password) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải khác mật khẩu cũ' });
      setLoading(false);
      return;
    }

    try {
      // Backend yêu cầu new_password_confirm
      await authAPI.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
        new_password_confirm: passwordData.confirm_password,
      });
      setMessage({ type: 'success', text: 'Đổi mật khẩu thành công' });
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err) {
      console.error('Change password error:', err);
      const errorMsg = err.response?.data?.error || 
                       err.response?.data?.detail ||
                       err.response?.data?.message ||
                       'Đổi mật khẩu thất bại. Vui lòng thử lại';
      setMessage({
        type: 'error',
        text: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-container">
          <div className="profile-header">
            <h1>Thông tin tài khoản</h1>
            <div className="user-badge">
              <span className="user-icon">👤</span>
              <div>
                <div className="user-name">{user?.username}</div>
                <div className="user-role">
                  {user?.role === 'admin' ? '👑 Admin' : '🎬 User'}
                </div>
              </div>
            </div>
          </div>

          <div className="profile-tabs">
            <button
              className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              Thông tin cá nhân
            </button>
            <button
              className={`tab-button ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              Đổi mật khẩu
            </button>
          </div>

          {message.text && (
            <div className={`message message-${message.type}`}>
              {message.text}
            </div>
          )}

          {activeTab === 'info' && (
            <form onSubmit={handleUpdateInfo} className="profile-form">
              <div className="form-group">
                <label htmlFor="full_name">Họ và tên</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInfoChange}
                  placeholder="Nhập họ tên"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInfoChange}
                  placeholder="your@email.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Số điện thoại</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInfoChange}
                  placeholder="0123456789"
                />
              </div>

              <div className="form-group">
                <label htmlFor="date_of_birth">Ngày sinh</label>
                <input
                  type="date"
                  id="date_of_birth"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInfoChange}
                />
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Đang cập nhật...' : 'Cập nhật thông tin'}
              </button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword} className="profile-form">
              <div className="password-requirements">
                <p className="requirements-title">📋 Yêu cầu mật khẩu:</p>
                <ul className="requirements-list">
                  <li className={passwordData.new_password.length >= 6 ? 'valid' : ''}>
                    ✓ Ít nhất 6 ký tự
                  </li>
                  <li className={passwordData.new_password && passwordData.old_password !== passwordData.new_password ? 'valid' : ''}>
                    ✓ Khác mật khẩu cũ
                  </li>
                  <li className={passwordData.new_password && passwordData.new_password === passwordData.confirm_password ? 'valid' : ''}>
                    ✓ Mật khẩu xác nhận khớp
                  </li>
                </ul>
              </div>

              <div className="form-group">
                <label htmlFor="old_password">Mật khẩu hiện tại *</label>
                <input
                  type="password"
                  id="old_password"
                  name="old_password"
                  value={passwordData.old_password}
                  onChange={handlePasswordChange}
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="new_password">Mật khẩu mới *</label>
                <input
                  type="password"
                  id="new_password"
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm_password">Xác nhận mật khẩu mới *</label>
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  minLength={6}
                />
              </div>

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? '🔄 Đang đổi mật khẩu...' : '🔒 Đổi mật khẩu'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
