import React, { useEffect, useState } from 'react';
import { showtimesAPI } from '../../services/api';

const StaffShowtimes = () => {
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await showtimesAPI.adminAll();
        const data = res.data;
        const all = [...(data.showing||[]), ...(data.upcoming||[]), ...(data.finished||[])];
        setShowtimes(all);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div>Đang tải suất chiếu...</div>;

  return (
    <div>
      <h2>Quản lý Suất chiếu</h2>
      <table className="table">
        <thead>
          <tr><th>Phim</th><th>Phòng</th><th>Thời gian</th><th>Trạng thái</th></tr>
        </thead>
        <tbody>
          {showtimes.map(s => (
            <tr key={s.id}>
              <td>{s.movie_title || s.movie?.title}</td>
              <td>{s.auditorium_name || s.auditorium?.name}</td>
              <td>{new Date(s.start_time).toLocaleString?.() || s.start_time}</td>
              <td>{s.realtime_status?.label || s.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StaffShowtimes;
