import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { showtimesAPI, bookingsAPI } from '../../services/api';
import '../../styles/Booking.css';

const BookingPage = () => {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  
  const [showtime, setShowtime] = useState(null);
  const [seatsByRow, setSeatsByRow] = useState({});
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSeats();
  }, [showtimeId]);

  const fetchSeats = async () => {
    try {
      setLoading(true);
      const response = await showtimesAPI.getSeats(showtimeId);
      setShowtime(response.data.showtime);
      setSeatsByRow(response.data.seats_by_row);
    } catch (err) {
      setError('Không thể tải thông tin ghế');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat) => {
    if (!seat.is_available) return;

    const seatIndex = selectedSeats.findIndex((s) => s.id === seat.id);
    
    if (seatIndex > -1) {
      // Bỏ chọn ghế
      setSelectedSeats(selectedSeats.filter((s) => s.id !== seat.id));
    } else {
      // Chọn ghế (tối đa 10 ghế)
      if (selectedSeats.length < 10) {
        setSelectedSeats([...selectedSeats, seat]);
      } else {
        alert('Bạn chỉ có thể chọn tối đa 10 ghế');
      }
    }
  };

  const calculateTotal = () => {
    return selectedSeats.reduce((total, seat) => total + seat.ticket_price, 0);
  };

  const getSeatClassName = (seat) => {
    const classes = ['seat', `seat-${seat.seat_type}`];
    
    if (!seat.is_available) {
      classes.push('seat-booked');
    } else if (selectedSeats.find((s) => s.id === seat.id)) {
      classes.push('seat-selected');
    }
    
    return classes.join(' ');
  };

const handleBooking = async () => {
  if (selectedSeats.length === 0) {
    alert('Vui lòng chọn ít nhất một ghế');
    return;
  }

  try {
    setSubmitting(true);
    const bookingData = {
      showtime: showtimeId,
      seat_ids: selectedSeats.map((seat) => String(seat.id)),
    };
    
    console.log('Sending booking data:', bookingData);
    
    const response = await bookingsAPI.create(bookingData);
    console.log('Booking response:', response.data);
    
    // ⭐ SỬA: Thử nhiều cách lấy booking ID
    const bookingId = response?.data?.id || 
                      response?.data?.booking_id || 
                      response?.data?.pk ||
                      response?.data?.uuid;
    
    if (!bookingId) {
      // Nếu không có ID, lấy từ headers hoặc fetch lại
      console.log('Response headers:', response.headers);
      
      // Thử lấy từ Location header
      const locationHeader = response.headers?.location;
      if (locationHeader) {
        const idMatch = locationHeader.match(/\/booking\/([^/]+)\/?$/);
        if (idMatch) {
          const extractedId = idMatch[1];
          navigate(`/payment/${extractedId}`);
          return;
        }
      }
      
      // Nếu vẫn không có, fetch booking history để lấy booking mới nhất
      try {
        const historyResponse = await bookingsAPI.getHistory();
        const latestBooking = historyResponse.data[0]; // Booking mới nhất
        if (latestBooking?.id) {
          navigate(`/payment/${latestBooking.id}`);
          return;
        }
      } catch (historyErr) {
        console.error('Failed to fetch history:', historyErr);
      }
      
      setError('Đặt vé thành công nhưng không lấy được mã booking. Vui lòng kiểm tra lịch sử đặt vé.');
      // Redirect về trang history
      setTimeout(() => navigate('/bookings'), 2000);
      return;
    }
    
    navigate(`/payment/${bookingId}`);
    
  } catch (err) {
    console.error('Full error:', err);
    console.error('Error response:', err.response?.data);
    
    const errorMsg = err.response?.data?.seat_ids?.[0] || 
                     err.response?.data?.showtime?.[0] ||
                     err.response?.data?.non_field_errors?.[0] ||
                     err.response?.data?.detail ||
                     'Đặt vé thất bại';
    setError(errorMsg);
    fetchSeats();
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Đang tải sơ đồ ghế...</div>
      </div>
    );
  }

  if (error && !showtime) {
    return (
      <div className="container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const rows = Object.keys(seatsByRow).sort();

  return (
    <div className="booking-page">
      <div className="container">
        <div className="booking-header">
          <h1>Chọn ghế</h1>
          <div className="showtime-info-booking">
            <h2>{showtime?.movie_title}</h2>
            <p>
              {showtime?.auditorium_name} •{' '}
              {new Date(showtime?.start_time).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="booking-content">
          <div className="seats-section">
            <div className="price-guide">
              <h4>💰 Bảng giá theo loại ghế</h4>
              <div className="price-items">
                <div className="price-item">
                  <div className="price-seat seat-standard"></div>
                  <span>Ghế Thường: <strong>{showtime?.base_price?.toLocaleString('vi-VN')}đ</strong></span>
                </div>
                <div className="price-item">
                  <div className="price-seat seat-vip"></div>
                  <span>Ghế VIP: <strong>{(showtime?.base_price * 1.0)?.toLocaleString('vi-VN')}đ</strong></span>
                </div>
                <div className="price-item">
                  <div className="price-seat seat-couple"></div>
                  <span>Ghế Đôi: <strong>{(showtime?.base_price * 1.2)?.toLocaleString('vi-VN')}đ</strong></span>
                </div>
              </div>
            </div>

            <div className="screen">
              <div className="screen-label">Màn hình</div>
            </div>

            <div className="seats-container">
              {rows.map((row) => (
                <div key={row} className="seat-row">
                  <div className="row-label">{row}</div>
                  <div className="row-seats">
                    {seatsByRow[row].map((seat) => (
                      <button
                        key={seat.id}
                        className={getSeatClassName(seat)}
                        onClick={() => handleSeatClick(seat)}
                        disabled={!seat.is_available}
                        title={`${seat.row_label}${seat.seat_number} - ${
                          seat.ticket_price.toLocaleString('vi-VN')
                        }đ`}
                      >
                        {seat.seat_number}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="seat-legend">
              <div className="legend-item">
                <div className="seat seat-standard"></div>
                <span>Thường</span>
              </div>
              <div className="legend-item">
                <div className="seat seat-vip"></div>
                <span>VIP</span>
              </div>
              <div className="legend-item">
                <div className="seat seat-couple"></div>
                <span>Đôi</span>
              </div>
              <div className="legend-item">
                <div className="seat seat-selected"></div>
                <span>Đang chọn</span>
              </div>
              <div className="legend-item">
                <div className="seat seat-booked"></div>
                <span>Đã đặt</span>
              </div>
            </div>
          </div>

          <div className="booking-summary">
            <h3>Thông tin đặt vé</h3>
            
            <div className="selected-seats-list">
              <h4>Ghế đã chọn ({selectedSeats.length})</h4>
              {selectedSeats.length === 0 ? (
                <p className="no-selection">Chưa chọn ghế</p>
              ) : (
                <div className="seats-list">
                  {selectedSeats.map((seat) => (
                    <div key={seat.id} className="selected-seat-item">
                      <span className="seat-label">
                        {seat.row_label}{seat.seat_number}
                      </span>
                      <span className="seat-type-label">
                        ({seat.seat_type})
                      </span>
                      <span className="seat-price">
                        {seat.ticket_price.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="price-summary">
              <div className="price-row">
                <span>Tổng cộng:</span>
                <span className="total-price">
                  {calculateTotal().toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            <button
              className="btn-continue"
              onClick={handleBooking}
              disabled={selectedSeats.length === 0 || submitting}
            >
              {submitting ? 'Đang xử lý...' : 'Tiếp tục'}
            </button>

            <div className="booking-note">
              <p>⏰ Vé sẽ được giữ trong 10 phút</p>
              <p>💳 Vui lòng thanh toán trong thời gian quy định</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
