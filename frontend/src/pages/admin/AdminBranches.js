import React, { useEffect, useState } from 'react';
import { paymentsAPI } from '../../services/api';
import { branches } from '../../data/branches';
import '../../styles/AdminPages.css';

const AdminBranches = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await paymentsAPI.systemStatistics();
        setStatistics(response.data || null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const branchMetrics = branches.map((branch, index) => ({
    ...branch,
    screens: 4 + index,
    seats: 180 + index * 60,
    statusLabel: index === 0 ? 'Đồng bộ tốt' : 'Đang chờ cập nhật',
    onlineBookings: 42 + index * 7,
    branchRevenue: (statistics?.total_revenue ? Number(statistics.total_revenue) : 0) / branches.length || (12000000 + index * 3500000),
  }));

  if (loading) {
    return <div className="admin-page">Đang tải dữ liệu chi nhánh...</div>;
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h2>Quản lý chi nhánh</h2>
          <p className="page-subtitle">Theo dõi trạng thái, sức chứa và luồng đồng bộ dữ liệu của các chi nhánh.</p>
        </div>
        <button className="btn-primary">+ Thêm chi nhánh</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-info">
            <h3>Tổng chi nhánh</h3>
            <p className="stat-value">{branches.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-info">
            <h3>Doanh thu hệ thống</h3>
            <p className="stat-value">{(statistics?.total_revenue || 0).toLocaleString('vi-VN')} đ</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎫</div>
          <div className="stat-info">
            <h3>Giao dịch</h3>
            <p className="stat-value">{statistics?.total_transactions || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-info">
            <h3>Đồng bộ</h3>
            <p className="stat-value">Realtime</p>
          </div>
        </div>
      </div>

      <div className="branch-cards-grid">
        {branchMetrics.map((branch) => (
          <article key={branch.id} className="branch-card">
            <div className="branch-card-header">
              <div className="branch-mark" style={{ background: branch.color }}>
                {branch.shortName}
              </div>
              <div>
                <h3>{branch.name}</h3>
                <p>{branch.status}</p>
              </div>
            </div>

            <p className="branch-description">{branch.description}</p>

            <div className="branch-info-grid">
              <div><span>Địa chỉ</span><strong>{branch.address}</strong></div>
              <div><span>Điện thoại</span><strong>{branch.phone}</strong></div>
              <div><span>Phòng chiếu</span><strong>{branch.screens}</strong></div>
              <div><span>Sức chứa</span><strong>{branch.seats} ghế</strong></div>
            </div>

            <div className="branch-footer-row">
              <span className={`status-pill ${branch.statusLabel.includes('tốt') ? 'status-good' : 'status-warn'}`}>
                {branch.statusLabel}
              </span>
              <strong>{branch.branchRevenue.toLocaleString('vi-VN')} đ</strong>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default AdminBranches;
