import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { logout } from "../api/auth";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="d-flex min-vh-100 bg-light">
      {sidebarOpen && <Sidebar onToggle={() => setSidebarOpen(!sidebarOpen)} />}

      <div className="flex-grow-1">
        <nav className="navbar navbar-light bg-white shadow-sm px-3 d-flex justify-content-between">
          <div>
            <button
              className="btn btn-outline-primary"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <i className="fas fa-bars"></i>
            </button>
            <span className="navbar-brand mb-0 h1 ms-3">Bảng điều khiển</span>
          </div>
          <button className="btn btn-outline-danger" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt me-1"></i> Đăng xuất
          </button>
        </nav>

        <main className="p-4">
          <Outlet /> {/* Hiển thị nội dung trang con (Dashboard, Category, Supplier, v.v.) */}
        </main>
      </div>
    </div>
  );
}
