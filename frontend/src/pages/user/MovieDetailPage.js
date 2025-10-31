import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { moviesAPI, showtimesAPI } from '../../services/api';
import '../../styles/MovieDetail.css';

const MovieDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    fetchMovieDetails();
  }, [id]);

  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      const movieResponse = await moviesAPI.getById(id);
      setMovie(movieResponse.data);

      const showtimesResponse = await showtimesAPI.getByMovie(id);
      setShowtimes(showtimesResponse.data.showtimes_by_date || {});

      // Set ngày đầu tiên làm mặc định
      const dates = Object.keys(showtimesResponse.data.showtimes_by_date || {});
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
      }
    } catch (err) {
      setError('Không thể tải thông tin phim');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formatTime = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBooking = (showtimeId) => {
    navigate(`/booking/${showtimeId}`);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="container">
        <div className="error-message">{error || 'Không tìm thấy phim'}</div>
      </div>
    );
  }

  const availableDates = Object.keys(showtimes);

  return (
    <div className="movie-detail-page">
      <div className="movie-hero">
        <div className="container">
          <div className="movie-hero-content">
            <div className="movie-poster-large">
              {movie.poster_url ? (
                <img src={movie.poster_url} alt={movie.title} />
              ) : (
                <div className="poster-placeholder-large">
                  <span>🎬</span>
                </div>
              )}
            </div>

            <div className="movie-details">
              <h1 className="movie-title">{movie.title}</h1>
              
              <div className="movie-meta-detail">
                {movie.rating && (
                  <div className="meta-item">
                    <span className="meta-label">Phân loại:</span>
                    <span className="meta-value rating-badge">{movie.rating}</span>
                  </div>
                )}
                <div className="meta-item">
                  <span className="meta-label">Thời lượng:</span>
                  <span className="meta-value">{movie.duration_min} phút</span>
                </div>
                {movie.release_date && (
                  <div className="meta-item">
                    <span className="meta-label">Khởi chiếu:</span>
                    <span className="meta-value">
                      {new Date(movie.release_date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                )}
              </div>

              {movie.description && (
                <div className="movie-description-detail">
                  <h3>Nội dung phim</h3>
                  <p>{movie.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="showtimes-section">
          <h2 className="section-title">Lịch chiếu</h2>

          {availableDates.length === 0 ? (
            <div className="no-showtimes">
              <p>Hiện chưa có lịch chiếu cho phim này</p>
            </div>
          ) : (
            <>
              <div className="date-selector">
                {availableDates.map((date) => (
                  <button
                    key={date}
                    className={`date-button ${
                      selectedDate === date ? 'active' : ''
                    }`}
                    onClick={() => setSelectedDate(date)}
                  >
                    {formatDate(date)}
                  </button>
                ))}
              </div>

              {selectedDate && showtimes[selectedDate] && (
                <div className="showtimes-list">
                  {showtimes[selectedDate].map((showtime) => (
                    <div key={showtime.id} className="showtime-card">
                      <div className="showtime-info">
                        <span className="showtime-time">
                          {formatTime(showtime.start_time)}
                        </span>
                        <span className="showtime-auditorium">
                          {showtime.auditorium_name}
                        </span>
                        <span className="showtime-price">
                          {parseInt(showtime.base_price).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                      <button
                        className="btn-select-showtime"
                        onClick={() => handleBooking(showtime.id)}
                      >
                        Chọn suất
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;
