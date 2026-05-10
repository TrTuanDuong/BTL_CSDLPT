import React, { useEffect, useState } from 'react';
import { paymentsAPI } from '../../services/api';
import '../../styles/AdminPages.css';

const AdminReports = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await paymentsAPI.systemStatistics();
        setStats(res.data || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="admin-page">Đang tải báo cáo...</div>;

  if (!stats) return <div className="admin-page">Không có dữ liệu báo cáo.</div>;

  return (
    <div className="admin-page">
      <h2>Báo cáo hệ thống</h2>

      <div className="reports-grid">
        <div className="report-card">
          <h4>Tổng doanh thu</h4>
          <p>{stats.total_revenue ?? '0'}</p>
        </div>

        <div className="report-card">
          <h4>Tổng giao dịch</h4>
          <p>{stats.total_transactions ?? '0'}</p>
        </div>

        <div className="report-card">
          <h4>Hoàn tiền</h4>
          <p>{stats.total_refunds ?? '0'}</p>
        </div>

      </div>

      <div style={{marginTop:20}}>
        <h3>Top phim theo doanh thu</h3>
        <ol>
          {(stats.top_movies || []).map(m => (
            <li key={m.movie_id}>{m.title} — {m.revenue}</li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default AdminReports;
