import React, { useEffect, useMemo, useState } from 'react';
import { usersAPI } from '../../services/api';
import { branches } from '../../data/branches';
import '../../styles/AdminPages.css';

const STORAGE_KEY = 'staffBranchAssignments';

const readAssignments = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const AdminStaffAssignments = () => {
  const [staff, setStaff] = useState([]);
  const [assignments, setAssignments] = useState(readAssignments);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await usersAPI.getAll();
        const data = Array.isArray(response.data) ? response.data : response.data.results || [];
        setStaff(data.filter((user) => String(user.role).toLowerCase() === 'staff'));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const assignedCount = useMemo(() => Object.keys(assignments).length, [assignments]);

  const saveAssignment = (userId, branchId) => {
    const next = { ...assignments, [userId]: branchId };
    setAssignments(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const handleSave = async (user) => {
    try {
      setSavingId(user.id);
      await usersAPI.update(user.id, { role: user.role });
    } catch (error) {
      console.error(error);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="admin-page">Đang tải phân công staff...</div>;
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h2>Phân công nhân viên</h2>
          <p className="page-subtitle">Gán staff cho chi nhánh để phục vụ quản lý quầy, suất chiếu và thanh toán tại chỗ.</p>
        </div>
        <div className="mini-kpi">
          <span>Staff có phân công</span>
          <strong>{assignedCount}/{staff.length}</strong>
        </div>
      </div>

      <table className="data-table wide-table">
        <thead>
          <tr>
            <th>Nhân viên</th>
            <th>Email</th>
            <th>Chi nhánh</th>
            <th>Ghi chú</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((user) => (
            <tr key={user.id}>
              <td>
                <strong>{user.full_name || user.username}</strong>
                <div className="table-subtext">{user.username}</div>
              </td>
              <td>{user.email}</td>
              <td>
                <select value={assignments[user.id] || branches[0].id} onChange={(e) => saveAssignment(user.id, e.target.value)}>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </td>
              <td>{assignments[user.id] ? 'Đã gán chi nhánh' : 'Chưa gán'}</td>
              <td>
                <button className="btn-primary compact" disabled={savingId === user.id} onClick={() => handleSave(user)}>
                  {savingId === user.id ? 'Đang lưu...' : 'Lưu'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminStaffAssignments;
