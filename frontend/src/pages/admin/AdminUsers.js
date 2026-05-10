import React, { useEffect, useState } from 'react';
import { usersAPI } from '../../services/api';
import '../../styles/AdminPages.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await usersAPI.getAll();
      const data = res.data;
      const list = Array.isArray(data) ? data : data.results || [];
      setUsers(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const changeRole = (id, newRole) => {
    setUsers((prev) => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
  };

  const saveUser = async (user) => {
    try {
      setSavingId(user.id);
      await usersAPI.update(user.id, { role: user.role });
      await loadUsers();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingId(null);
    }
  };

  const deactivateUser = async (id) => {
    try {
      await usersAPI.update(id, { is_active: false });
      await loadUsers();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="admin-page">Đang tải danh sách người dùng...</div>;

  return (
    <div className="admin-page">
      <h2>Quản lý Người dùng</h2>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên</th>
            <th>Email</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.full_name || u.username || '-'}</td>
              <td>{u.email}</td>
              <td>
                <select value={u.role || 'Customer'} onChange={(e) => changeRole(u.id, e.target.value)}>
                  <option value="ADMIN">ADMIN</option>
                  <option value="STAFF">STAFF</option>
                  <option value="CUSTOMER">CUSTOMER</option>
                </select>
              </td>
              <td>{u.is_active ? 'Kích hoạt' : 'Đã vô hiệu'}</td>
              <td>
                <button disabled={savingId === u.id} onClick={() => saveUser(u)}>Lưu</button>
                <button onClick={() => deactivateUser(u.id)}>Vô hiệu</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsers;
