import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingsAPI, paymentsAPI } from '../../services/api';
import '../../styles/Payment.css';

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 phút
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  useEffect(() => {
    // Countdown timer
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Hết thời gian - booking bị hủy
      alert('Hết thời gian thanh toán. Booking đã bị hủy.');
      navigate('/bookings');
    }
  }, [timeRemaining]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await bookingsAPI.getById(bookingId);
      setBooking(response.data);
      
      // Kiểm tra trạng thái booking - backend dùng 'canceled' không có 'l'
      if (response.data.status === 'canceled') {
        alert('Booking đã bị hủy');
        navigate('/bookings');
      } else if (response.data.status === 'paid') {
        alert('Booking đã được thanh toán');
        navigate('/bookings');
      }
    } catch (err) {
      setError('Không thể tải thông tin booking');
      // Nếu lỗi, thử lại tối đa 3 lần
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(retryCount + 1);
          fetchBookingDetails();
        }, 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePayment = async () => {
    try {
      setProcessing(true);
      setError('');

      // Tạo payment và tự động xác nhận luôn
      const paymentData = {
        booking: bookingId,
        provider: 'credit_card',  // Mặc định là thẻ tín dụng
      };

      await paymentsAPI.create(paymentData);

      // Thành công
      alert('Thanh toán thành công! Vé của bạn đã được đặt.');
      navigate('/bookings');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 
                       err.response?.data?.error ||
                       err.response?.data?.booking?.[0] ||
                       'Thanh toán thất bại';
      setError(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc muốn hủy booking này?')) {
      return;
    }

    try {
      await bookingsAPI.cancel(bookingId);
      alert('Đã hủy booking');
      navigate('/bookings');
    } catch (err) {
      alert('Không thể hủy booking');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="container">
        <div className="payment-container">
          <div className="payment-header">
            <h1>Thanh toán</h1>
            <div className="countdown">
              <span>⏰ Thời gian còn lại: </span>
              <span className={`time ${timeRemaining < 60 ? 'urgent' : ''}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="payment-content">
            <div className="booking-details">
              <h2>Thông tin đặt vé</h2>
              
              <div className="detail-section">
                <h3>Phim & Suất chiếu</h3>
                <p className="movie-title">{booking?.showtime_info?.movie_title}</p>
                <div className="detail-row">
                  <span>Phòng chiếu:</span>
                  <span>{booking?.showtime_info?.auditorium_name}</span>
                </div>
                <div className="detail-row">
                  <span>Thời gian:</span>
                  <span>
                    {new Date(booking?.showtime_info?.start_time).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Ghế đã chọn</h3>
                <div className="tickets-list">
                  {booking?.tickets?.map((ticket) => (
                    <div key={ticket.id} className="ticket-item">
                      <span className="ticket-seat">
                        {ticket.seat_info?.seat_label}
                      </span>
                      <span className="ticket-type">
                        ({ticket.seat_info?.seat_type})
                      </span>
                      <span className="ticket-price">
                        {parseInt(ticket.price).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section total-section">
                <div className="total-row">
                  <span>Tổng tiền:</span>
                  <span className="total-amount">
                    {parseInt(booking?.total_amount).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>
            </div>

            <div className="payment-actions">
              <button
                className="btn-pay"
                onClick={handlePayment}
                disabled={processing}
                style={{width: '100%', fontSize: '1.2em'}}
              >
                {processing ? 'Đang xử lý...' : 'Thanh toán'}
              </button>
              <button
                className="btn-cancel"
                onClick={handleCancel}
                disabled={processing}
                style={{width: '100%', marginTop: 12}}
              >
                Hủy đặt vé
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
