import React, { useEffect, useState } from 'react';
import { paymentsAPI } from '../../services/api';

const StaffPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await paymentsAPI.getAll();
        setPayments(res.data || []);
      } catch (e) {
        console.error(e);
      } finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return <div>Đang tải giao dịch...</div>;

  return (
    <div>
      <h2>Thanh toán tại quầy</h2>
      <table className="table">
        <thead>
          <tr><th>Mã</th><th>Số tiền</th><th>Trạng thái</th><th>Thời gian</th></tr>
        </thead>
        <tbody>
          {payments.map(p => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.amount}</td>
              <td>{p.status}</td>
              <td>{p.paid_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StaffPayments;
