import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, updateMe, changePassword } from "../api/users";
import { logout } from "../api/auth";

export default function AccountSettings() {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [profile, setProfile] = useState({
    email: "",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    dateOfBirth: "",
    gender: "",
    avatarUrl: "",
  });
  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMe = async () => {
      setLoading(true);
      try {
        const me = await getMe();
        setProfile({
          email: me?.email || "",
          customerName: me?.customerName || "",
          customerPhone: me?.customerPhone || "",
          customerAddress: me?.customerAddress || "",
          dateOfBirth: me?.dateOfBirth || "",
          gender: me?.gender || "",
          avatarUrl: me?.avatarUrl || "",
        });
        setAddresses(Array.isArray(me?.addresses) ? me.addresses : []);
        setPayments(Array.isArray(me?.paymentMethods) ? me.paymentMethods : []);
      } catch {
        setAlert({ type: "danger", message: "Vui lòng đăng nhập" });
        setTimeout(() => navigate("/login"), 1200);
      }
      setLoading(false);
    };
    fetchMe();
  }, [navigate]);

  const show = (message, type = "info") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updated = await updateMe({
        ...profile,
        addresses,
        paymentMethods: payments,
      });
      show("Đã cập nhật thông tin tài khoản", "success");
      localStorage.setItem(
        "profile",
        JSON.stringify({
          username: updated?.username,
          role: updated?.role,
          email: updated?.email,
          customerName: updated?.customerName,
          customerPhone: updated?.customerPhone,
          customerAddress: updated?.customerAddress,
        })
      );
    } catch {
      show("Cập nhật thất bại", "danger");
    }
    setLoading(false);
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      show("Đổi mật khẩu thành công", "success");
      setOldPassword("");
      setNewPassword("");
    } catch {
      show("Mật khẩu hiện tại không đúng", "danger");
    }
    setLoading(false);
  };

  const addAddress = () =>
    setAddresses((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        receiver: "",
        phone: "",
        address: "",
        isDefault: prev.length === 0,
      },
    ]);
  const removeAddress = (id) =>
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  const updateAddress = (id, field, value) =>
    setAddresses((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  const setDefaultAddress = (id) =>
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));

  const addPayment = () =>
    setPayments((p) => [
      ...p,
      { id: String(Date.now()), type: "momo", label: "MoMo", isDefault: p.length === 0 },
    ]);
  const removePayment = (id) =>
    setPayments((p) => p.filter((m) => m.id !== id));
  const setDefaultPayment = (id) =>
    setPayments((p) =>
      p.map((m) => ({ ...m, isDefault: m.id === id }))
    );

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate("/")}
        >
          <i className="fas fa-home me-1"></i> Quay lại trang chủ
        </button>

        <button
          className="btn btn-outline-danger"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <i className="fas fa-sign-out-alt me-1"></i> Đăng xuất
        </button>
      </div>

      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show shadow-sm`}
          role="alert"
        >
          {alert.message}
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert(null)}
          ></button>
        </div>
      )}

      <h2 className="fw-bold text-primary mb-4 border-bottom pb-2">
        Quản lý tài khoản
      </h2>

      {loading && (
        <div className="text-muted small mb-3">
          <i className="fas fa-spinner fa-spin me-1"></i> Đang tải dữ liệu...
        </div>
      )}

      <div className="row g-4">
        {/* Thông tin cá nhân */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-primary text-white rounded-top-4">
              <strong>Thông tin cá nhân</strong>
            </div>
            <div className="card-body">
              <form onSubmit={saveProfile}>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Họ tên</label>
                    <input
                      className="form-control"
                      value={profile.customerName}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          customerName: e.target.value,
                        })
                      }
                      placeholder="Nhập họ tên"
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          email: e.target.value,
                        })
                      }
                      placeholder="Email liên hệ"
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Số điện thoại</label>
                    <input
                      className="form-control"
                      value={profile.customerPhone}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          customerPhone: e.target.value,
                        })
                      }
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Ngày sinh</label>
                    <input
                      type="date"
                      className="form-control"
                      value={profile.dateOfBirth}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          dateOfBirth: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Giới tính</label>
                    <select
                      className="form-select"
                      value={profile.gender}
                      onChange={(e) =>
                        setProfile({ ...profile, gender: e.target.value })
                      }
                    >
                      <option value="">Chọn</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Địa chỉ mặc định
                    </label>
                    <input
                      className="form-control"
                      value={profile.customerAddress}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          customerAddress: e.target.value,
                        })
                      }
                      placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Ảnh đại diện (URL)
                    </label>
                    <input
                      className="form-control"
                      value={profile.avatarUrl}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          avatarUrl: e.target.value,
                        })
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="d-flex justify-content-end mt-3">
                  <button className="btn btn-success px-4 rounded-pill" disabled={loading}>
                    {loading ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Cột phải */}
        <div className="col-12 col-lg-5">
          {/* Địa chỉ */}
          <div className="card border-0 shadow-sm mb-4 rounded-4">
            <div className="card-header bg-light fw-semibold rounded-top-4">
              Địa chỉ giao hàng
            </div>
            <div className="card-body">
              <button
                className="btn btn-sm btn-outline-primary mb-3"
                onClick={addAddress}
              >
                + Thêm địa chỉ
              </button>
              {addresses.length === 0 && (
                <div className="text-muted small">Chưa có địa chỉ nào.</div>
              )}
              {addresses.map((a) => (
                <div
                  key={a.id}
                  className="border rounded p-2 mb-2 bg-light-subtle"
                >
                  <div className="row g-2">
                    <div className="col-6">
                      <input
                        className="form-control form-control-sm"
                        placeholder="Người nhận"
                        value={a.receiver}
                        onChange={(e) =>
                          updateAddress(a.id, "receiver", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-6">
                      <input
                        className="form-control form-control-sm"
                        placeholder="SĐT"
                        value={a.phone}
                        onChange={(e) =>
                          updateAddress(a.id, "phone", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-12">
                      <input
                        className="form-control form-control-sm"
                        placeholder="Địa chỉ"
                        value={a.address}
                        onChange={(e) =>
                          updateAddress(a.id, "address", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <div>
                      <input
                        type="radio"
                        name="defaultAddress"
                        className="form-check-input me-1"
                        checked={!!a.isDefault}
                        onChange={() => setDefaultAddress(a.id)}
                      />
                      <small>Mặc định</small>
                    </div>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeAddress(a.id)}
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Thanh toán */}
          <div className="card border-0 shadow-sm mb-4 rounded-4">
            <div className="card-header bg-light fw-semibold rounded-top-4">
              Phương thức thanh toán
            </div>
            <div className="card-body">
              <button
                className="btn btn-sm btn-outline-primary mb-3"
                onClick={addPayment}
              >
                + Thêm phương thức
              </button>
              {payments.length === 0 && (
                <div className="text-muted small">Chưa có phương thức nào.</div>
              )}
              {payments.map((m) => (
                <div
                  key={m.id}
                  className="d-flex justify-content-between align-items-center border rounded p-2 mb-2 bg-light-subtle"
                >
                  <div>
                    <div className="fw-semibold">{m.label || m.type}</div>
                    <div className="text-muted small">
                      {m.last4 ? `**** ${m.last4}` : ""}
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="radio"
                      name="defaultPayment"
                      className="form-check-input"
                      checked={!!m.isDefault}
                      onChange={() => setDefaultPayment(m.id)}
                    />
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removePayment(m.id)}
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Đổi mật khẩu */}
          <div className="card border-0 shadow-sm rounded-4">
            <div className="card-header bg-light fw-semibold rounded-top-4">
              Đổi mật khẩu
            </div>
            <div className="card-body">
              <form onSubmit={submitPassword}>
                <div className="mb-2">
                  <label className="form-label">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    className="form-control"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Mật khẩu mới</label>
                  <input
                    type="password"
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <button
                  className="btn btn-primary w-100 rounded-pill"
                  disabled={loading}
                >
                  {loading ? "Đang đổi..." : "Đổi mật khẩu"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
