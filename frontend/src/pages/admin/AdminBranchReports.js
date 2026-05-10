import React, { useEffect, useMemo, useState } from 'react';
import { paymentsAPI } from '../../services/api';
import { branches } from '../../data/branches';
import '../../styles/AdminPages.css';

const AdminBranchReports = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await paymentsAPI.systemStatistics();
        setStats(response.data || null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const branchRows = useMemo(() => {
    return branches.map((branch, index) => ({
      ...branch,
      tickets: 520 + index * 74,
      shows: 118 + index * 17,
      revenue: ((stats?.total_revenue ? Number(stats.total_revenue) : 56000000) / branches.length) + index * 2500000,
      occupancy: 68 + index * 4,
    }));
  }, [stats]);

  if (loading) {
    return <div className="admin-page">Đang tải báo cáo chi nhánh...</div>;
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h2>Báo cáo theo chi nhánh</h2>
          <p className="page-subtitle">Tổng hợp doanh thu, vé bán và tỷ lệ lấp đầy để quản trị hệ thống trung tâm.</p>
        </div>
        <button className="btn-secondary">Xuất PDF</button>
      </div>

      <div className="report-highlights">
        <div className="report-card">
          <span>Tổng doanh thu</span>
          <strong>{(stats?.total_revenue || 0).toLocaleString('vi-VN')} đ</strong>
        </div>
        <div className="report-card">
          <span>Vé đã bán</span>
          <strong>{stats?.total_transactions || 0}</strong>
        </div>
        <div className="report-card">
          <span>Chi nhánh active</span>
          <strong>{branches.length}</strong>
        </div>
      </div>

      <div className="report-table-card">
        <table className="data-table wide-table">
          <thead>
            <tr>
              <th>Chi nhánh</th>
              <th>Suất chiếu</th>
              <th>Vé bán</th>
              <th>Occupancy</th>
              <th>Doanh thu</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {branchRows.map((branch) => (
              <tr key={branch.id}>
                <td>
                  <strong>{branch.name}</strong>
                  <div className="table-subtext">{branch.address}</div>
                </td>
                <td>{branch.shows}</td>
                <td>{branch.tickets}</td>
                <td>{branch.occupancy}%</td>
                <td>{branch.revenue.toLocaleString('vi-VN')} đ</td>
                <td>
                  <span className="status-pill status-good">Đang đồng bộ</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminBranchReports;
