import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { moviesAPI } from '../../services/api';
import '../../styles/HomePage.css';

const HomePage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const response = await moviesAPI.getAll({ search: searchTerm });
      // Backend không có pagination, trả về array trực tiếp
      setMovies(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (err) {
      setError('Không thể tải danh sách phim');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMovies();
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Đang tải phim...</div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="container">
          <h1 className="hero-title">🎬 Đặt vé xem phim online</h1>
          <p className="hero-subtitle">Trải nghiệm điện ảnh tuyệt vời</p>
          
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Tìm kiếm phim..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              🔍 Tìm kiếm
            </button>
          </form>
        </div>
      </div>

      <div className="container">
        <div className="section-header">
          <h2>Phim đang chiếu</h2>
        </div>

        {error && <div className="error-message">{error}</div>}

        {movies.length === 0 ? (
          <div className="no-movies">
            <p>Không tìm thấy phim nào</p>
          </div>
        ) : (
          <div className="movies-grid">
            {movies.map((movie) => (
              <div key={movie.id} className="movie-card">
                <div className="movie-poster">
                  {movie.poster_url ? (
                    <img src={movie.poster_url} alt={movie.title} />
                  ) : (
                    <div className="poster-placeholder">
                      <span>🎬</span>
                    </div>
                  )}
                </div>
                
                <div className="movie-info">
                  <h3 className="movie-title">{movie.title}</h3>
                  
                  <div className="movie-meta">
                    {movie.rating && (
                      <span className="movie-rating">
                        ⭐ {movie.rating}
                      </span>
                    )}
                    <span className="movie-duration">
                      ⏱️ {movie.duration_min} phút
                    </span>
                  </div>

                  {movie.description && (
                    <p className="movie-description">
                      {movie.description.substring(0, 100)}
                      {movie.description.length > 100 && '...'}
                    </p>
                  )}

                  <Link
                    to={`/movies/${movie.id}`}
                    className="btn-book"
                  >
                    Đặt vé ngay
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
