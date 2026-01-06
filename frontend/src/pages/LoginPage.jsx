import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { requestLogin, verifyLogin } from "../api/auth";
import { getMe } from "../api/users";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [step, setStep] = useState(1);
  const [challengeId, setChallengeId] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.prefillUsername) {
      setUsername(location.state.prefillUsername);
    }
    if (location.state?.info) {
      setInfo(location.state.info);
    }
  }, [location.state]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      if (step === 1) {
        const res = await requestLogin(username, password);
        setChallengeId(res.challengeId);
        setStep(2);
        setInfo(res.message || "Đã gửi mã xác nhận đến email của bạn");
        if (res.emailHint) {
          setInfo((msg) => `${msg} (${res.emailHint})`);
        }
      } else {
        const res = await verifyLogin(challengeId, code);
        // Fetch full profile after obtaining token
        try {
          const me = await getMe();
          localStorage.setItem("profile", JSON.stringify({
            username: me?.username || res?.user?.username || username,
            role: me?.role || res?.user?.role || "user",
            email: me?.email || "",
            customerName: me?.customerName || "",
            customerPhone: me?.customerPhone || "",
            customerAddress: me?.customerAddress || ""
          }));
        } catch {}
        const storedProfile = JSON.parse(localStorage.getItem("profile") || "{}");
        const role = res?.user?.role || storedProfile?.role || "user";
        const redirectTo = location.state?.from?.pathname || (role === "admin" ? "/admin" : "/account");
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setError(err?.response?.data?.message || (step === 1 ? "Sai tên đăng nhập hoặc mật khẩu" : "Mã xác nhận không hợp lệ"));
    }
    setLoading(false);
  }

  function resetFlow() {
    setStep(1);
    setChallengeId("");
    setCode("");
    setInfo("");
  }

  async function resendCode() {
    if (!username || !password) return;
    setLoading(true);
    setError("");
    try {
      const res = await requestLogin(username, password);
      setChallengeId(res.challengeId);
      setInfo("Đã gửi lại mã xác nhận");
    } catch (err) {
      setError("Không thể gửi lại mã, vui lòng thử lại");
    }
    setLoading(false);
  }

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div className="card p-4 shadow-sm" style={{ width: 350 }}>
        <h4 className="mb-3 text-center text-primary fw-bold">Đăng nhập</h4>
        {info && <div className="alert alert-info py-1">{info}</div>}
        {error && <div className="alert alert-danger py-1">{error}</div>}
        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <>
              <div className="mb-3">
                <label className="form-label">Tên đăng nhập</label>
                <input
                  type="text"
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Mật khẩu</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <div className="mb-3">
                <label className="form-label">Nhập mã xác nhận</label>
                <input
                  type="text"
                  className="form-control text-center fw-bold"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  maxLength={6}
                />
              </div>
              <div className="d-flex justify-content-between mb-3">
                <button type="button" className="btn btn-link p-0" onClick={resendCode} disabled={loading}>
                  Gửi lại mã
                </button>
                <button type="button" className="btn btn-link p-0 text-danger" onClick={resetFlow}>
                  Nhập lại
                </button>
              </div>
            </>
          )}
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Đang xử lý..." : step === 1 ? "Tiếp tục" : "Xác nhận"}
          </button>
        </form>
        <div className="mt-3 text-center">
          <a href="/register" className="text-decoration-none">Chưa có tài khoản?</a>
        </div>
      </div>
    </div>
  );
}
