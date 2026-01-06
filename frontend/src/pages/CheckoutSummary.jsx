

import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createOrder, createMomoPayment } from "../api/orders";
import { getMe, updateMe } from "../api/users";
import { getToken } from "../api/auth";

export default function CheckoutSummary() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD"); // COD mặc định
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [saveNewAddress, setSaveNewAddress] = useState(false);

  // Tổng tiền
  const totalAmount = useMemo(() => {
    return cartItems.reduce(
      (sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0),
      0
    );
  }, [cartItems]);

  // Load giỏ hàng và profile từ localStorage hoặc API
  useEffect(() => {
    // Load giỏ hàng
    try {
      const parsed = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCartItems([]);
    }

    // Load profile từ API nếu user đã đăng nhập
    const loadProfile = async () => {
      const token = getToken();
      if (!token) {
        // Nếu chưa đăng nhập, load từ localStorage
        try {
          const prof = JSON.parse(localStorage.getItem("profile") || "{}");
          if (prof) {
            if (prof.customerName) setCustomerName(prof.customerName);
            if (prof.customerPhone) setCustomerPhone(prof.customerPhone);
            if (prof.customerAddress) setCustomerAddress(prof.customerAddress);
            if (prof.customerEmail) setCustomerEmail(prof.customerEmail);
          }
        } catch {}
        return;
      }

      // Nếu đã đăng nhập, fetch từ API
      try {
        setIsLoggedIn(true);
        const me = await getMe();
        
        // Điền thông tin cơ bản
        if (me.customerName) setCustomerName(me.customerName);
        if (me.customerPhone) setCustomerPhone(me.customerPhone);
        if (me.customerEmail) setCustomerEmail(me.customerEmail || me.email || "");
        
        // Load danh sách địa chỉ
        if (Array.isArray(me.addresses) && me.addresses.length > 0) {
          setAddresses(me.addresses);
          // Chọn địa chỉ mặc định
          const defaultAddr = me.addresses.find((a) => a.isDefault) || me.addresses[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id);
            setCustomerAddress(defaultAddr.address);
            setCustomerName(defaultAddr.receiver || me.customerName || "");
            setCustomerPhone(defaultAddr.phone || me.customerPhone || "");
          }
        } else if (me.customerAddress) {
          // Nếu không có addresses array nhưng có customerAddress
          setCustomerAddress(me.customerAddress);
        }
        
        // Cập nhật localStorage
        localStorage.setItem("profile", JSON.stringify({
          username: me?.username,
          role: me?.role || me?.roleName,
          email: me?.email || "",
          customerName: me?.customerName || "",
          customerPhone: me?.customerPhone || "",
          customerAddress: me?.customerAddress || "",
        }));
      } catch (err) {
        // Nếu API fail, fallback về localStorage
        console.warn("Failed to load profile from API:", err);
        try {
          const prof = JSON.parse(localStorage.getItem("profile") || "{}");
          if (prof) {
            if (prof.customerName) setCustomerName(prof.customerName);
            if (prof.customerPhone) setCustomerPhone(prof.customerPhone);
            if (prof.customerAddress) setCustomerAddress(prof.customerAddress);
            if (prof.customerEmail) setCustomerEmail(prof.customerEmail);
          }
        } catch {}
      }
    };

    loadProfile();
  }, []);

  const showAlert = (message, type = "info") => setAlert({ message, type });
  const closeAlert = () => setAlert(null);

  const canSubmit =
    customerName && customerPhone && customerAddress && cartItems.length > 0;

  const handleAddressChange = (addressId) => {
    setSelectedAddressId(addressId);
    const selectedAddr = addresses.find((a) => a.id === addressId);
    if (selectedAddr) {
      setCustomerAddress(selectedAddr.address);
      // Chỉ cập nhật tên và SĐT nếu address có thông tin này
      if (selectedAddr.receiver) setCustomerName(selectedAddr.receiver);
      if (selectedAddr.phone) setCustomerPhone(selectedAddr.phone);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setLoading(true);

    const payload = {
      customerName,
      customerPhone,
      customerAddress,
      customerEmail,
      paymentMethod,
      items: cartItems.map((i) => ({
        productId: i.id,
        quantity: i.quantity,
      })),
      totalAmount,
    };

    try {
      // Lưu địa chỉ mới vào profile nếu user đã đăng nhập và chọn lưu
      if (isLoggedIn && saveNewAddress && customerAddress) {
        try {
          const me = await getMe();
          const newAddress = {
            id: String(Date.now()),
            receiver: customerName,
            phone: customerPhone,
            address: customerAddress,
            isDefault: addresses.length === 0,
          };
          const updatedAddresses = [...(me.addresses || []), newAddress];
          await updateMe({ addresses: updatedAddresses });
        } catch (err) {
          console.warn("Failed to save address:", err);
        }
      }

      if (paymentMethod === "COD") {
        // Thanh toán khi nhận hàng
        await createOrder(payload);
        localStorage.removeItem("cart");
        showAlert("Đơn hàng COD đã được ghi nhận!", "success");
        setTimeout(() => navigate("/"), 1500);
      } else if (paymentMethod === "MOMO" || paymentMethod === "MoMo") {
        // Tạo link thanh toán MoMo
        const result = await createMomoPayment(payload);
        const payUrl = result.payUrl || result.momoPaymentUrl;
        if (payUrl) {
          window.location.href = payUrl; // Redirect sang MoMo
        } else {
          showAlert("Không thể tạo link thanh toán MoMo", "danger");
        }
      }
    } catch (err) {
      showAlert(err?.response?.data?.message || err.message, "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`}>
          {alert.message}
          <button type="button" className="btn-close" onClick={closeAlert}></button>
        </div>
      )}

      <h4 className="mb-4 text-success text-center">
        Hoàn tất thanh toán / Xác nhận đơn hàng
      </h4>
      
      {!isLoggedIn && (
        <div className="alert alert-info d-flex align-items-center">
          <i className="fas fa-info-circle me-2"></i>
          <div>
            <strong>Mẹo:</strong> Đăng nhập để tự động điền thông tin và lưu địa chỉ giao hàng.{" "}
            <Link to="/login" state={{ from: { pathname: "/checkout" } }}>
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      )}

      <div className="row g-4">
        {/* Thông tin khách hàng & chọn phương thức thanh toán */}
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <strong>Thông tin khách hàng</strong>
              {isLoggedIn && (
                <small className="text-light">
                  <i className="fas fa-user-check me-1"></i>
                  Đã đăng nhập
                </small>
              )}
            </div>
            <div className="card-body">
              <form onSubmit={handleConfirm}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Họ tên</label>
                    <input
                      className="form-control"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Số điện thoại</label>
                    <input
                      className="form-control"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Địa chỉ</label>
                    {isLoggedIn && addresses.length > 0 ? (
                      <>
                        <select
                          className="form-select mb-2"
                          value={selectedAddressId || ""}
                          onChange={(e) => {
                            if (e.target.value === "new") {
                              setSelectedAddressId("new");
                              setCustomerAddress("");
                            } else if (e.target.value === "") {
                              setSelectedAddressId(null);
                            } else {
                              handleAddressChange(e.target.value);
                            }
                          }}
                        >
                          <option value="">-- Chọn địa chỉ đã lưu --</option>
                          {addresses.map((addr) => (
                            <option key={addr.id} value={addr.id}>
                              {addr.label || addr.address} {addr.isDefault ? "(Mặc định)" : ""}
                            </option>
                          ))}
                          <option value="new">+ Thêm địa chỉ mới</option>
                        </select>
                        {(selectedAddressId === "new" || !selectedAddressId) && (
                          <input
                            className="form-control"
                            placeholder="Nhập địa chỉ mới"
                            value={customerAddress}
                            onChange={(e) => setCustomerAddress(e.target.value)}
                            required
                          />
                        )}
                        {selectedAddressId && selectedAddressId !== "new" && (
                          <div className="alert alert-light mt-2 mb-0">
                            <small>
                              <i className="fas fa-map-marker-alt me-1"></i>
                              {addresses.find((a) => a.id === selectedAddressId)?.address}
                            </small>
                          </div>
                        )}
                        {isLoggedIn && (!selectedAddressId || selectedAddressId === "new") && customerAddress && (
                          <div className="form-check mt-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="saveAddress"
                              checked={saveNewAddress}
                              onChange={(e) => setSaveNewAddress(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="saveAddress">
                              Lưu địa chỉ này vào tài khoản
                            </label>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <input
                          className="form-control"
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          required
                        />
                        {isLoggedIn && customerAddress && (
                          <div className="form-check mt-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="saveAddress"
                              checked={saveNewAddress}
                              onChange={(e) => setSaveNewAddress(e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor="saveAddress">
                              Lưu địa chỉ này vào tài khoản
                            </label>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="col-12">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Phương thức thanh toán</label>
                    <select
                      className="form-select"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                      <option value="MOMO">Thanh toán MoMo</option>
                    </select>
                  </div>
                </div>

                <div className="d-flex justify-content-end mt-3">
                  <Link to="/" className="btn btn-outline-secondary me-2">
                    Quay lại
                  </Link>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={!canSubmit || loading}
                  >
                    {loading ? "Đang xử lý..." : "Xác nhận & Thanh toán"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Giỏ hàng */}
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
                  <div key={i.id} className="d-flex justify-content-between p-3 border-bottom">
                    <div>
                      <div className="fw-semibold">{i.name}</div>
                      <div className="text-muted small">SL: {i.quantity}</div>
                    </div>
                    <div className="fw-bold text-primary">
                      {(Number(i.price) * i.quantity).toLocaleString()} đ
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="card-footer d-flex justify-content-between">
              <span>Tổng:</span>
              <strong className="text-primary">
                {Number(totalAmount).toLocaleString()} đ
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
