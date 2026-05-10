import React, { useEffect, useState } from 'react';
import { showtimesAPI } from '../../services/api';

const StaffDashboard = () => {
  const [summary, setSummary] = useState({ total:0, showing:0, upcoming:0, finished:0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await showtimesAPI.adminAll();
        const data = res.data;
        setSummary(data.summary || { total:0, showing:0, upcoming:0, finished:0 });
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div>Đang tải dashboard...</div>;

  return (
    <div>
      <h2>Dashboard Chi nhánh</h2>
      <div style={{display:'flex',gap:20}}>
        <div className="card">Tổng suất: {summary.total}</div>
        <div className="card">Đang chiếu: {summary.showing}</div>
        <div className="card">Sắp chiếu: {summary.upcoming}</div>
        <div className="card">Đã kết thúc: {summary.finished}</div>
      </div>
    </div>
  );
};

export default StaffDashboard;
