import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register as apiRegister } from "../api/auth";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const [roleId, setRoleId] = useState(1); // user mặc định = 1
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSuccess("");

    try {
      const payload = {
        username,
        password,
        email,
        roleId: Number(roleId),
        customerName,
        customerPhone,
        customerAddress,
      };

      await apiRegister(payload);

      setSuccess("Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.");
      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            prefillUsername: username,
            info: "Vui lòng đăng nhập và nhập mã xác nhận đã được gửi qua email.",
          },
        });
      }, 1500);

    } catch (err) {
      setError(err?.response?.data?.message || "Đăng ký thất bại");
    }

    setLoading(false);
  }

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div className="card p-4 shadow-sm" style={{ width: 420 }}>
        <h4 className="mb-3 text-center text-primary fw-bold">Tạo tài khoản</h4>

        {error && <div className="alert alert-danger py-1">{error}</div>}
        {success && <div className="alert alert-success py-1">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="row g-3">

            <div className="col-12">
              <label className="form-label">Tên đăng nhập</label>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label">Mật khẩu</label>
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label">Họ và tên</label>
              <input
                className="form-control"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div className="col-6">
              <label className="form-label">Số điện thoại</label>
              <input
                className="form-control"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
            </div>

            <div className="col-6">
              <label className="form-label">Địa chỉ</label>
              <input
                className="form-control"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                required
              />
            </div>

            {/* SELECT ROLE ID */}
            <div className="col-12">
              <label className="form-label">Vai trò</label>
              <select
                className="form-select"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
              >
                <option value={1}>User</option>
                <option value={2}>Admin</option>
              </select>
            </div>

          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 mt-3"
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Đăng ký"}
          </button>

        </form>

        <div className="mt-3 text-center">
          <a href="/login" className="text-decoration-none">
            Đã có tài khoản?
          </a>
        </div>
      </div>
    </div>
  );
}
