import React, { useState, useEffect } from 'react';
import { auditoriumsAPI } from '../../services/api';
import '../../styles/AdminPages.css';

const AdminAuditoriums = () => {
  const [auditoriums, setAuditoriums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAuditorium, setEditingAuditorium] = useState(null);
  const [viewSeats, setViewSeats] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    standard_row_count: 5,
    vip_row_count: 2,
    couple_row_count: 1,
    seats_per_row: 10,
  });

  useEffect(() => {
    fetchAuditoriums();
  }, []);

  const fetchAuditoriums = async () => {
    try {
      setLoading(true);
      const response = await auditoriumsAPI.getAll();
      // Handle both paginated and non-paginated responses
      const data = response.data.results || response.data;
      setAuditoriums(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching auditoriums:', err);
      setAuditoriums([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingAuditorium) {
        await auditoriumsAPI.update(editingAuditorium.id, formData);
        alert('Cập nhật phòng chiếu thành công');
      } else {
        await auditoriumsAPI.create(formData);
        alert('Thêm phòng chiếu thành công');
      }

      resetForm();
      fetchAuditoriums();
    } catch (err) {
      alert('Có lỗi xảy ra: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleEdit = (auditorium) => {
    setEditingAuditorium(auditorium);
    setFormData({
      name: auditorium.name,
      standard_row_count: auditorium.standard_row_count,
      vip_row_count: auditorium.vip_row_count,
      couple_row_count: auditorium.couple_row_count,
      seats_per_row: auditorium.seats_per_row,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa phòng chiếu này?')) return;

    try {
      await auditoriumsAPI.delete(id);
      alert('Xóa phòng chiếu thành công');
      fetchAuditoriums();
    } catch (err) {
      alert('Không thể xóa: ' + (err.response?.data?.detail || err.message));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      standard_row_count: 5,
      vip_row_count: 2,
      couple_row_count: 1,
      seats_per_row: 10,
    });
    setEditingAuditorium(null);
    setShowForm(false);
  };

  const handleViewSeats = async (auditorium) => {
    try {
      const response = await auditoriumsAPI.getSeats(auditorium.id);
      setViewSeats(response.data);
    } catch (err) {
      alert('Không thể tải sơ đồ ghế: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2>Quản lý Phòng chiếu</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          ➕ Thêm phòng chiếu
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingAuditorium ? 'Chỉnh sửa phòng chiếu' : 'Thêm phòng chiếu'}</h3>
              <button className="btn-close" onClick={resetForm}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label>Tên phòng chiếu *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ví dụ: Phòng 1, Hall A"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Số hàng ghế Thường *</label>
                  <input
                    type="number"
                    name="standard_row_count"
                    value={formData.standard_row_count}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="5"
                  />
                </div>

                <div className="form-group">
                  <label>Số hàng ghế VIP *</label>
                  <input
                    type="number"
                    name="vip_row_count"
                    value={formData.vip_row_count}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="2"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Số hàng ghế Đôi *</label>
                  <input
                    type="number"
                    name="couple_row_count"
                    value={formData.couple_row_count}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="1"
                  />
                </div>

                <div className="form-group">
                  <label>Số ghế mỗi hàng *</label>
                  <input
                    type="number"
                    name="seats_per_row"
                    value={formData.seats_per_row}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="form-note">
                <p>📝 <strong>Tổng số ghế:</strong> {
                  (parseInt(formData.standard_row_count) + 
                   parseInt(formData.vip_row_count) + 
                   parseInt(formData.couple_row_count)) * 
                  parseInt(formData.seats_per_row) || 0
                } ghế</p>
                <p>🎫 Ghế sẽ được tự động tạo theo cấu hình: Thường (1x giá), VIP (1.5x giá), Đôi (2x giá)</p>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  {editingAuditorium ? 'Cập nhật' : 'Thêm mới'}
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
              <th>Tên phòng</th>
              <th>Hàng Thường</th>
              <th>Hàng VIP</th>
              <th>Hàng Đôi</th>
              <th>Ghế/Hàng</th>
              <th>Tổng ghế</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {auditoriums.map((auditorium) => (
              <tr key={auditorium.id}>
                <td><strong>{auditorium.name}</strong></td>
                <td>{auditorium.standard_row_count} hàng</td>
                <td>{auditorium.vip_row_count} hàng</td>
                <td>{auditorium.couple_row_count} hàng</td>
                <td>{auditorium.seats_per_row} ghế</td>
                <td><strong>{auditorium.total_seats}</strong> ghế</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn-view" 
                      onClick={() => handleViewSeats(auditorium)}
                      title="Xem sơ đồ ghế"
                    >
                      👁️
                    </button>
                    <button 
                      className="btn-edit" 
                      onClick={() => handleEdit(auditorium)}
                      title="Chỉnh sửa"
                    >
                      ✏️
                    </button>
                    <button 
                      className="btn-delete" 
                      onClick={() => handleDelete(auditorium.id)}
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {auditoriums.length === 0 && (
          <div className="no-data">Chưa có phòng chiếu nào</div>
        )}
      </div>

      {/* Modal xem sơ đồ ghế */}
      {viewSeats && (
        <div className="modal-overlay" onClick={() => setViewSeats(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Sơ đồ ghế - {viewSeats.auditorium.name}</h3>
              <button className="btn-close" onClick={() => setViewSeats(null)}>✕</button>
            </div>

            <div className="seat-map-container">
              <div className="screen">MÀN HÌNH</div>
              
              <div className="seat-legend">
                <span className="legend-item">
                  <span className="seat-icon standard">■</span> Thường (x1.0)
                </span>
                <span className="legend-item">
                  <span className="seat-icon vip">■</span> VIP (x1.5)
                </span>
                <span className="legend-item">
                  <span className="seat-icon couple">■</span> Đôi (x2.0)
                </span>
              </div>

              <div className="seats-grid">
                {Object.entries(viewSeats.seats_by_row).map(([row, seats]) => (
                  <div key={row} className="seat-row">
                    <span className="row-label">{row}</span>
                    <div className="row-seats">
                      {seats.map((seat) => (
                        <div 
                          key={seat.id} 
                          className={`seat ${seat.seat_type.toLowerCase()}`}
                          title={`${row}${seat.seat_number} - ${seat.seat_type}`}
                        >
                          {seat.seat_number}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="seat-summary">
                <p>📊 Tổng số ghế: <strong>{viewSeats.total_seats}</strong></p>
                <p>
                  Thường: {viewSeats.auditorium.seat_summary?.standard || 0} | 
                  VIP: {viewSeats.auditorium.seat_summary?.vip || 0} | 
                  Đôi: {viewSeats.auditorium.seat_summary?.couple || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditoriums;
