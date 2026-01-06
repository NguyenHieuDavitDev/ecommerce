import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { finalizeOrder } from "../api/orders";

export default function CheckoutFinalize() {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const momoResult = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const result = {
        resultCode: params.get("resultCode"),
        orderId: params.get("orderId"), // MoMo orderId
        requestId: params.get("requestId"),
        amount: params.get("amount"),
        transId: params.get("transId"),
      };
      // Lấy orderId từ extraData nếu có
      const extraData = params.get("extraData");
      if (extraData) {
        try {
          const decoded = JSON.parse(atob(extraData));
          result.orderRefId = decoded.orderId; // Order ID trong hệ thống
        } catch (e) {
          console.warn("Failed to parse extraData:", e);
        }
      }
      return result;
    } catch {
      return {};
    }
  }, []);

  const [cartItems, setCartItems] = useState([]);
  const totalAmount = useMemo(() => {
    return cartItems.reduce((s, i) => s + Number(i.price || 0) * Number(i.quantity || 0), 0);
  }, [cartItems]);

  useEffect(() => {
    const raw = localStorage.getItem("cart") || "[]";
    try {
      const parsed = JSON.parse(raw);
      setCartItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCartItems([]);
    }
    // preload profile if exists
    try {
      const prof = JSON.parse(localStorage.getItem("profile") || "{}");
      if (prof) {
        if (prof.customerName) setCustomerName(prof.customerName);
        if (prof.customerPhone) setCustomerPhone(prof.customerPhone);
        if (prof.customerAddress) setCustomerAddress(prof.customerAddress);
      }
    } catch {}
  }, []);

  const showAlert = (message, type = "info") => setAlert({ message, type });
  const closeAlert = () => setAlert(null);

  const canSubmit = useMemo(() => {
    // Nếu thanh toán thành công, chỉ cần thông tin khách hàng
    if (momoResult?.resultCode === "0") {
      return customerName && customerPhone && customerAddress;
    }
    return false;
  }, [momoResult, customerName, customerPhone, customerAddress]);

  const handleFinalize = async (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);
    try {
      const payload = {
        customerName,
        customerPhone,
        customerAddress,
        customerEmail: localStorage.getItem("profile") ? JSON.parse(localStorage.getItem("profile")).customerEmail : undefined,
        items: cartItems.map((i) => ({ productId: i.id, quantity: i.quantity })),
        totalAmount,
        // Gửi orderId nếu có từ MoMo callback
        orderId: momoResult?.orderRefId || undefined,
        momoOrderId: momoResult?.orderId || undefined,
      };
      await finalizeOrder(payload);
      localStorage.removeItem("cart");
      showAlert("Đã xác nhận đơn hàng sau khi thanh toán thành công!", "success");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      showAlert(err?.response?.data?.message || err.message || "Không thể xác nhận đơn hàng", "danger");
    }
    setLoading(false);
  };

  return (
    <div className="container py-4">
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          {alert.message}
          <button type="button" className="btn-close" onClick={closeAlert}></button>
        </div>
      )}

      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Trang chủ</Link></li>
          <li className="breadcrumb-item active" aria-current="page">Nhập thông tin sau thanh toán</li>
        </ol>
      </nav>

      {momoResult?.resultCode !== "0" && (
        <div className="alert alert-warning">
          {momoResult?.resultCode 
            ? `Thanh toán không thành công. Mã lỗi: ${momoResult.resultCode}` 
            : "Chưa xác nhận thanh toán thành công từ MoMo."}
        </div>
      )}
      
      {momoResult?.resultCode === "0" && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle me-2"></i>
          Thanh toán MoMo thành công! Vui lòng điền thông tin để hoàn tất đơn hàng.
        </div>
      )}

      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <strong>Thông tin khách hàng</strong>
            </div>
            <div className="card-body">
              <form onSubmit={handleFinalize}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Họ tên</label>
                    <input className="form-control" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Số điện thoại</label>
                    <input className="form-control" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Địa chỉ</label>
                    <input className="form-control" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} required />
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2 mt-3">
                  <Link className="btn btn-outline-secondary" to="/">Trang chủ</Link>
                  <button type="submit" className="btn btn-success" disabled={!canSubmit || loading}>
                    {loading ? "Đang lưu..." : "Lưu đơn hàng"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-header bg-light">
              <strong>Đơn hàng của bạn</strong>
            </div>
            <div className="card-body p-0" style={{ maxHeight: 420, overflowY: "auto" }}>
              {cartItems.length === 0 ? (
                <div className="p-3 text-center text-muted">Giỏ hàng trống.</div>
              ) : (
                cartItems.map((i) => (
                  <div key={i.id} className="d-flex justify-content-between align-items-center p-3 border-bottom">
                    <div>
                      <div className="fw-semibold">{i.name}</div>
                      <div className="text-muted small">SL: {i.quantity}</div>
                    </div>
                    <div className="fw-bold text-primary">{Number(i.price).toLocaleString()} đ</div>
                  </div>
                ))
              )}
            </div>
            <div className="card-footer d-flex justify-content-between align-items-center">
              <div><span className="text-muted me-1">Tổng:</span><strong className="text-primary">{Number(totalAmount || 0).toLocaleString()} đ</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


