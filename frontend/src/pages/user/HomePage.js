import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { moviesAPI, showtimesAPI } from '../../services/api';
import { useBranch } from '../../contexts/BranchContext';
import '../../styles/HomePage.css';

const HomePage = () => {
  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [error, setError] = useState('');
  const { selectedBranch } = useBranch();

  useEffect(() => {
    fetchMovies();
    fetchShowtimes();
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

  const fetchShowtimes = async () => {
    try {
      setScheduleLoading(true);
      const response = await showtimesAPI.getUpcoming();
      setShowtimes(Array.isArray(response.data) ? response.data : response.data.results || []);
    } catch (err) {
      console.error(err);
      setShowtimes([]);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMovies();
  };

  const genres = useMemo(() => {
    const collected = movies
      .map((movie) => movie.genre || movie.genres?.[0]?.name || movie.genre_name)
      .filter(Boolean);
    return ['all', ...new Set(collected)];
  }, [movies]);

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const movieGenre = movie.genre || movie.genres?.[0]?.name || movie.genre_name || '';
      return genreFilter === 'all' || movieGenre === genreFilter;
    });
  }, [movies, genreFilter]);

  const featuredShowtimes = useMemo(() => showtimes.slice(0, 6), [showtimes]);

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

          <div className="hero-branch-card">
            <div>
              <span className="eyebrow">Đang xem chi nhánh</span>
              <h3>{selectedBranch.name}</h3>
              <p>{selectedBranch.address}</p>
            </div>
            <div className="branch-badge">{selectedBranch.shortName}</div>
          </div>
          
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

        <div className="filter-bar">
          {genres.map((genre) => (
            <button
              key={genre}
              className={`filter-chip ${genreFilter === genre ? 'active' : ''}`}
              onClick={() => setGenreFilter(genre)}
              type="button"
            >
              {genre === 'all' ? 'Tất cả thể loại' : genre}
            </button>
          ))}
        </div>

        {error && <div className="error-message">{error}</div>}

        {filteredMovies.length === 0 ? (
          <div className="no-movies">
            <p>Không tìm thấy phim nào</p>
          </div>
        ) : (
          <div className="movies-grid">
            {filteredMovies.map((movie) => (
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

        <div className="schedule-section">
          <div className="section-header">
            <h2>Lịch chiếu tại {selectedBranch.name}</h2>
          </div>
          {scheduleLoading ? (
            <div className="loading">Đang tải lịch chiếu...</div>
          ) : featuredShowtimes.length === 0 ? (
            <div className="no-movies">
              <p>Chưa có suất chiếu được đồng bộ cho chi nhánh này</p>
            </div>
          ) : (
            <div className="showtime-strip">
              {featuredShowtimes.map((showtime) => (
                <Link key={showtime.id} to={`/movies/${showtime.movie?.id || showtime.movie || ''}`} className="showtime-card-mini">
                  <span className="showtime-label">{showtime.movie_title || 'Phim'}</span>
                  <strong>{new Date(showtime.start_time).toLocaleDateString('vi-VN')}</strong>
                  <span>{new Date(showtime.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  <small>{showtime.auditorium_name || 'Phòng chiếu'}</small>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
