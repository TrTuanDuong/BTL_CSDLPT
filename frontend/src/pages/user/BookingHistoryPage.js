import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingsAPI } from '../../services/api';
import '../../styles/BookingHistory.css';

const BookingHistoryPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [filter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await bookingsAPI.getHistory(params);
      setBookings(response.data);
    } catch (err) {
      setError('Không thể tải lịch sử đặt vé');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Chờ thanh toán', className: 'status-pending' },
      paid: { label: 'Đã thanh toán', className: 'status-paid' },
      canceled: { label: 'Đã hủy', className: 'status-canceled' },
    };

    const config = statusConfig[status] || { label: status, className: '' };
    return <span className={`status-badge ${config.className}`}>{config.label}</span>;
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Bạn có chắc muốn hủy booking này?')) {
      return;
    }

    try {
      await bookingsAPI.cancel(bookingId);
      alert('Đã hủy booking');
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Không thể hủy booking');
    }
  };

  const handlePayNow = (bookingId) => {
    // Chuyển đến trang thanh toán
    navigate(`/payment/${bookingId}`);
  };

  const isBookingExpired = (booking) => {
    // Kiểm tra booking đã hết hạn chưa
    if (booking.status !== 'pending') return false;
    if (!booking.expires_at) return false;
    
    const now = new Date();
    const expiresAt = new Date(booking.expires_at);
    return now > expiresAt;
  };

  const getTimeRemaining = (booking) => {
    if (booking.status !== 'pending' || !booking.expires_at) return null;
    
    const now = new Date();
    const expiresAt = new Date(booking.expires_at);
    const diffMs = expiresAt - now;
    
    if (diffMs <= 0) return 'Đã hết hạn';
    
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="booking-history-page">
      <div className="container">
        <div className="page-header">
          <h1>Lịch sử đặt vé</h1>
        </div>

        <div className="filter-section">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả
          </button>
          <button
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Chờ thanh toán
          </button>
          <button
            className={`filter-btn ${filter === 'paid' ? 'active' : ''}`}
            onClick={() => setFilter('paid')}
          >
            Đã thanh toán
          </button>
          <button
            className={`filter-btn ${filter === 'canceled' ? 'active' : ''}`}
            onClick={() => setFilter('canceled')}
          >
            Đã hủy
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {bookings.length === 0 ? (
          <div className="no-bookings">
            <p>Chưa có lịch sử đặt vé</p>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <div key={booking.id} className="booking-card">
                <div className="booking-header">
                  <div className="booking-title">
                    <h3>{booking.showtime_info?.movie_title}</h3>
                    {getStatusBadge(booking.status)}
                  </div>
                  <div className="booking-id">#{booking.id.substring(0, 8)}</div>
                </div>

                <div className="booking-details">
                  <div className="detail-item">
                    <span className="detail-label">Phòng chiếu:</span>
                    <span>{booking.showtime_info?.auditorium_name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Thời gian chiếu:</span>
                    <span>
                      {new Date(booking.showtime_info?.start_time).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ngày đặt:</span>
                    <span>
                      {new Date(booking.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  {booking.status === 'pending' && booking.expires_at && (
                    <div className="detail-item">
                      <span className="detail-label">Hết hạn thanh toán:</span>
                      <span className={isBookingExpired(booking) ? 'text-expired' : 'text-warning'}>
                        {new Date(booking.expires_at).toLocaleString('vi-VN')}
                        {!isBookingExpired(booking) && (
                          <span className="time-remaining"> (còn {getTimeRemaining(booking)})</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <div className="booking-tickets">
                  <h4>Ghế đã đặt:</h4>
                  <div className="tickets-grid">
                    {booking.tickets?.map((ticket) => (
                      <span key={ticket.id} className="ticket-badge">
                        {ticket.seat_info?.seat_label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="booking-footer">
                  <div className="booking-total">
                    <span>Tổng tiền:</span>
                    <span className="total-amount">
                      {parseInt(booking.total_amount).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  
                  {booking.status === 'pending' && (
                    <div className="booking-actions">
                      {!isBookingExpired(booking) ? (
                        <>
                          <button
                            className="btn-pay-now"
                            onClick={() => handlePayNow(booking.id)}
                          >
                            Thanh toán ngay
                          </button>
                          <button
                            className="btn-cancel-booking"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Hủy booking
                          </button>
                        </>
                      ) : (
                        <span className="expired-notice">Đã hết hạn thanh toán</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingHistoryPage;
