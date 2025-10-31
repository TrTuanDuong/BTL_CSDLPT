import React, { useState, useEffect } from 'react';
import { showtimesAPI, moviesAPI, auditoriumsAPI } from '../../services/api';
import '../../styles/AdminPages.css';

const AdminShowtimes = () => {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [auditoriums, setAuditoriums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState(null);
  const [formData, setFormData] = useState({
    movie: '',
    auditorium: '',
    start_time: '',
    end_time: '',
    base_price: '',
    status: 'scheduled',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [showtimesRes, moviesRes, auditoriumsRes] = await Promise.all([
        showtimesAPI.getAll(),
        moviesAPI.getAll(),
        auditoriumsAPI.getAll(),
      ]);

      // Đảm bảo tất cả đều là array
      setShowtimes(Array.isArray(showtimesRes.data) ? showtimesRes.data : showtimesRes.data.results || []);
      setMovies(Array.isArray(moviesRes.data) ? moviesRes.data : moviesRes.data.results || []);
      setAuditoriums(Array.isArray(auditoriumsRes.data) ? auditoriumsRes.data : auditoriumsRes.data.results || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      alert('Có lỗi khi tải dữ liệu: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Auto calculate end_time when start_time or movie changes
    if (name === 'start_time' || name === 'movie') {
      calculateEndTime(name === 'movie' ? value : formData.movie, 
                       name === 'start_time' ? value : formData.start_time);
    }
  };

  const calculateEndTime = (movieId, startTime) => {
    if (!movieId || !startTime) return;

    const movie = movies.find(m => m.id === movieId);
    if (!movie) return;

    const start = new Date(startTime);
    const end = new Date(start.getTime() + movie.duration_min * 60000);
    
    // Format to datetime-local
    const endTimeStr = end.toISOString().slice(0, 16);
    setFormData(prev => ({ ...prev, end_time: endTimeStr }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Chỉ gửi các trường mà backend yêu cầu
      const dataToSend = {
        movie: formData.movie,
        auditorium: formData.auditorium,
        start_time: formData.start_time,
        base_price: formData.base_price,
      };

      if (editingShowtime) {
        await showtimesAPI.update(editingShowtime.id, dataToSend);
        alert('Cập nhật suất chiếu thành công');
      } else {
        await showtimesAPI.create(dataToSend);
        alert('Thêm suất chiếu thành công');
      }

      resetForm();
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 
                       err.response?.data?.non_field_errors?.[0] ||
                       JSON.stringify(err.response?.data) || 
                       err.message;
      alert('Có lỗi xảy ra: ' + errorMsg);
    }
  };

  const handleEdit = (showtime) => {
    setEditingShowtime(showtime);
    setFormData({
      movie: showtime.movie,
      auditorium: showtime.auditorium,
      start_time: new Date(showtime.start_time).toISOString().slice(0, 16),
      end_time: new Date(showtime.end_time).toISOString().slice(0, 16),
      base_price: showtime.base_price,
      status: showtime.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa suất chiếu này?')) return;

    try {
      await showtimesAPI.delete(id);
      alert('Xóa suất chiếu thành công');
      fetchData();
    } catch (err) {
      alert('Không thể xóa: ' + (err.response?.data?.detail || err.message));
    }
  };

  const resetForm = () => {
    setFormData({
      movie: '',
      auditorium: '',
      start_time: '',
      end_time: '',
      base_price: '',
      status: 'scheduled',
    });
    setEditingShowtime(null);
    setShowForm(false);
  };

  const getMovieName = (movieId) => {
    const movie = movies.find(m => m.id === movieId);
    return movie?.title || 'Unknown';
  };

  const getAuditoriumName = (auditoriumId) => {
    if (!Array.isArray(auditoriums)) return 'Unknown';
    const auditorium = auditoriums.find(a => a.id === auditoriumId);
    return auditorium?.name || 'Unknown';
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2>Quản lý Suất chiếu</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          ➕ Thêm suất chiếu
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingShowtime ? 'Chỉnh sửa suất chiếu' : 'Thêm suất chiếu'}</h3>
              <button className="btn-close" onClick={resetForm}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label>Phim *</label>
                <select
                  name="movie"
                  value={formData.movie}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Chọn phim --</option>
                  {movies.map(movie => (
                    <option key={movie.id} value={movie.id}>
                      {movie.title} ({movie.duration_min} phút)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Phòng chiếu *</label>
                <select
                  name="auditorium"
                  value={formData.auditorium}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Chọn phòng --</option>
                  {!Array.isArray(auditoriums) || auditoriums.length === 0 ? (
                    <option disabled>Chưa có phòng chiếu nào</option>
                  ) : (
                    auditoriums.map(aud => (
                      <option key={aud.id} value={aud.id}>
                        {aud.name}
                      </option>
                    ))
                  )}
                </select>
                {(!Array.isArray(auditoriums) || auditoriums.length === 0) && (
                  <small style={{color: 'orange'}}>
                    ⚠️ Vui lòng liên hệ quản trị viên để tạo phòng chiếu
                  </small>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Thời gian bắt đầu *</label>
                  <input
                    type="datetime-local"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Thời gian kết thúc (tự động)</label>
                  <input
                    type="datetime-local"
                    name="end_time"
                    value={formData.end_time}
                    readOnly
                    disabled
                    style={{backgroundColor: '#f0f0f0', cursor: 'not-allowed'}}
                  />
                  <small style={{color: '#666'}}>
                    ℹ️ Được tính tự động: Thời gian phim + 30 phút dọn dẹp
                  </small>
                </div>
              </div>

              <div className="form-group">
                <label>Giá cơ bản (VNĐ) *</label>
                <input
                  type="number"
                  name="base_price"
                  value={formData.base_price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="1000"
                  placeholder="Ví dụ: 80000"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  {editingShowtime ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Phim</th>
              <th>Phòng chiếu</th>
              <th>Thời gian</th>
              <th>Giá cơ bản</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {showtimes.map((showtime) => (
              <tr key={showtime.id}>
                <td>{getMovieName(showtime.movie)}</td>
                <td>{getAuditoriumName(showtime.auditorium)}</td>
                <td>
                  {new Date(showtime.start_time).toLocaleString('vi-VN')}
                </td>
                <td>{parseInt(showtime.base_price).toLocaleString('vi-VN')}đ</td>
                <td>
                  <span className={`status-badge status-${showtime.status}`}>
                    {showtime.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-edit" onClick={() => handleEdit(showtime)}>
                      ✏️
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(showtime.id)}>
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {showtimes.length === 0 && (
          <div className="no-data">Chưa có suất chiếu nào</div>
        )}
      </div>
    </div>
  );
};

export default AdminShowtimes;
