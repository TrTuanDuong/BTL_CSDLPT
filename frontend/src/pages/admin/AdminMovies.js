import React, { useState, useEffect } from 'react';
import { moviesAPI, genresAPI } from '../../services/api';
import '../../styles/AdminPages.css';

const AdminMovies = () => {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    duration_min: '',
    rating: '',
    release_date: '',
    description: '',
    poster_url: '',
    genre_ids: [], // Thêm field cho thể loại
  });

  useEffect(() => {
    fetchMovies();
    fetchGenres();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await moviesAPI.getAll();
      // Backend không có pagination, trả về array trực tiếp
      setMovies(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (err) {
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGenres = async () => {
    try {
      const response = await genresAPI.getAll();
      // Đảm bảo genres luôn là array
      setGenres(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (err) {
      console.error('Error fetching genres:', err);
      setGenres([]); // Set empty array on error
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGenreToggle = (genreId) => {
    setFormData(prev => {
      const currentGenres = prev.genre_ids || [];
      if (currentGenres.includes(genreId)) {
        // Bỏ chọn
        return {
          ...prev,
          genre_ids: currentGenres.filter(id => id !== genreId)
        };
      } else {
        // Chọn
        return {
          ...prev,
          genre_ids: [...currentGenres, genreId]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingMovie) {
        await moviesAPI.update(editingMovie.id, formData);
        alert('Cập nhật phim thành công');
      } else {
        await moviesAPI.create(formData);
        alert('Thêm phim thành công');
      }

      resetForm();
      fetchMovies();
    } catch (err) {
      alert('Có lỗi xảy ra: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    
    // Lấy genre IDs từ movie (nếu có)
    const genreIds = movie.genre_ids || [];
    
    setFormData({
      title: movie.title,
      duration_min: movie.duration_min,
      rating: movie.rating || '',
      release_date: movie.release_date || '',
      description: movie.description || '',
      poster_url: movie.poster_url || '',
      genre_ids: genreIds,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa phim này?')) return;

    try {
      await moviesAPI.delete(id);
      alert('Xóa phim thành công');
      fetchMovies();
    } catch (err) {
      alert('Không thể xóa phim: ' + (err.response?.data?.detail || err.message));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      duration_min: '',
      rating: '',
      release_date: '',
      description: '',
      poster_url: '',
      genre_ids: [],
    });
    setEditingMovie(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2>Quản lý Phim</h2>
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          ➕ Thêm phim mới
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingMovie ? 'Chỉnh sửa phim' : 'Thêm phim mới'}</h3>
              <button className="btn-close" onClick={resetForm}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label>Tên phim *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Thời lượng (phút) *</label>
                  <input
                    type="number"
                    name="duration_min"
                    value={formData.duration_min}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phân loại</label>
                  <input
                    type="text"
                    name="rating"
                    value={formData.rating}
                    onChange={handleChange}
                    placeholder="P, T13, T16, T18"
                  />
                </div>

                <div className="form-group">
                  <label>Ngày khởi chiếu</label>
                  <input
                    type="date"
                    name="release_date"
                    value={formData.release_date}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>URL Poster</label>
                <input
                  type="url"
                  name="poster_url"
                  value={formData.poster_url}
                  onChange={handleChange}
                  placeholder="https://example.com/poster.jpg"
                />
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                ></textarea>
              </div>

              <div className="form-group">
                <label>Thể loại phim</label>
                <div className="genre-selector">
                  {genres.length === 0 ? (
                    <p className="no-genres">
                      Chưa có thể loại nào. 
                      <a href="/admin/genres" target="_blank" rel="noopener noreferrer">
                        Thêm thể loại
                      </a>
                    </p>
                  ) : (
                    <div className="genre-checkboxes">
                      {genres.map((genre) => (
                        <label key={genre.id} className="genre-checkbox-item">
                          <input
                            type="checkbox"
                            checked={(formData.genre_ids || []).includes(genre.id)}
                            onChange={() => handleGenreToggle(genre.id)}
                          />
                          <span className="genre-label">{genre.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {formData.genre_ids && formData.genre_ids.length > 0 && (
                  <div className="selected-genres">
                    <small>
                      Đã chọn: {formData.genre_ids.length} thể loại
                    </small>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  {editingMovie ? 'Cập nhật' : 'Thêm mới'}
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
              <th>Tên phim</th>
              <th>Thể loại</th>
              <th>Thời lượng</th>
              <th>Phân loại</th>
              <th>Ngày chiếu</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie) => (
              <tr key={movie.id}>
                <td>
                  <div className="movie-cell">
                    {movie.poster_url && (
                      <img src={movie.poster_url} alt="" className="table-thumbnail" />
                    )}
                    <span>{movie.title}</span>
                  </div>
                </td>
                <td>
                  <div className="movie-genres">
                    {movie.genres && movie.genres.length > 0 ? (
                      movie.genres.map((genre, index) => (
                        <span key={index} className="genre-tag">{genre}</span>
                      ))
                    ) : (
                      <span className="no-genre">-</span>
                    )}
                  </div>
                </td>
                <td>{movie.duration_min} phút</td>
                <td>{movie.rating || '-'}</td>
                <td>
                  {movie.release_date
                    ? new Date(movie.release_date).toLocaleDateString('vi-VN')
                    : '-'}
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-edit" onClick={() => handleEdit(movie)}>
                      ✏️
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(movie.id)}>
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {movies.length === 0 && (
          <div className="no-data">Chưa có phim nào</div>
        )}
      </div>
    </div>
  );
};

export default AdminMovies;
