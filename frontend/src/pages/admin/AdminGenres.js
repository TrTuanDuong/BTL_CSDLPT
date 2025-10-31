import React, { useState, useEffect } from 'react';
import { genresAPI } from '../../services/api';
import '../../styles/AdminPages.css';

const AdminGenres = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGenre, setEditingGenre] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
  });

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      setLoading(true);
      const response = await genresAPI.getAll();
      // Backend không có pagination, trả về array trực tiếp
      setGenres(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (err) {
      console.error('Error fetching genres:', err);
      alert('Có lỗi khi tải danh sách thể loại');
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

    // Validation
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên thể loại');
      return;
    }

    try {
      if (editingGenre) {
        await genresAPI.update(editingGenre.id, formData);
        alert('Cập nhật thể loại thành công');
      } else {
        await genresAPI.create(formData);
        alert('Thêm thể loại thành công');
      }

      resetForm();
      fetchGenres();
    } catch (err) {
      const errorMsg = err.response?.data?.name?.[0] || 
                       err.response?.data?.detail || 
                       err.message;
      alert('Có lỗi xảy ra: ' + errorMsg);
    }
  };

  const handleEdit = (genre) => {
    setEditingGenre(genre);
    setFormData({
      name: genre.name,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa thể loại này?')) return;

    try {
      await genresAPI.delete(id);
      alert('Xóa thể loại thành công');
      fetchGenres();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message;
      alert('Không thể xóa thể loại: ' + errorMsg);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
    });
    setEditingGenre(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2>Quản lý Thể loại</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          ➕ Thêm thể loại mới
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingGenre ? 'Chỉnh sửa thể loại' : 'Thêm thể loại mới'}</h3>
              <button className="btn-close" onClick={resetForm}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label>Tên thể loại *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ví dụ: Hành động, Kinh dị, Hài hước..."
                  autoFocus
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingGenre ? 'Cập nhật' : 'Thêm mới'}
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary">
                  Hủy
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
              <th>STT</th>
              <th>Tên thể loại</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {genres.length === 0 ? (
              <tr>
                <td colSpan="3" className="no-data">
                  Chưa có thể loại nào
                </td>
              </tr>
            ) : (
              genres.map((genre, index) => (
                <tr key={genre.id}>
                  <td>{index + 1}</td>
                  <td className="genre-name">
                    <span className="genre-badge">🏷️ {genre.name}</span>
                  </td>
                  <td className="actions">
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(genre)}
                      title="Chỉnh sửa"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(genre.id)}
                      title="Xóa"
                    >
                      🗑️ Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="stats-footer">
        <p>Tổng số thể loại: <strong>{genres.length}</strong></p>
      </div>
    </div>
  );
};

export default AdminGenres;
