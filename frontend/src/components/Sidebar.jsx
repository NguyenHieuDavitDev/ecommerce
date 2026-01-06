import { Link, useLocation } from "react-router-dom";

export default function Sidebar({ onToggle }) {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div
      className="d-flex flex-column bg-dark text-white p-3 shadow"
      style={{ width: "250px" }}
    >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">Admin</h4>
        <button className="btn btn-sm btn-outline-light" onClick={onToggle}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      <ul className="nav nav-pills flex-column">
        <li className="nav-item mb-2">
          <Link
            to="/admin"
            className={`nav-link ${isActive("/admin") ? "active bg-primary" : "text-white"
              }`}
          >
            <i className="fas fa-home me-2"></i> Trang chủ
          </Link>
        </li>
        <li className="nav-item mt-2">
          <Link
            to="/admin/roles"
            className={`nav-link ${isActive("/admin/roles") ? "active bg-primary" : "text-white"}`}
          >
            <i className="fas fa-user-shield me-2"></i> Quyền
          </Link>
        </li>

        <li className="nav-item mb-2">
          <Link
            to="/admin/categories"
            className={`nav-link ${isActive("/admin/categories") ? "active bg-primary" : "text-white"
              }`}
          >
            <i className="fas fa-layer-group me-2"></i> Danh mục
          </Link>
        </li>

        <li className="nav-item mb-2">
          <Link
            to="/admin/products"
            className={`nav-link ${isActive("/admin/products") ? "active bg-primary" : "text-white"
              }`}
          >
            <i className="fas fa-box me-2"></i> Sản phẩm
          </Link>
        </li>

        <li className="nav-item">
          <Link
            to="/admin/suppliers"
            className={`nav-link ${isActive("/admin/suppliers") ? "active bg-primary" : "text-white"
              }`}
          >
            <i className="fas fa-truck me-2"></i> Nhà cung cấp
          </Link>
        </li>

        <li className="nav-item mt-2">
          <Link
            to="/admin/orders"
            className={`nav-link ${isActive("/admin/orders") ? "active bg-primary" : "text-white"
              }`}
          >
            <i className="fas fa-receipt me-2"></i> Đơn hàng
          </Link>
        </li>
        <li className="nav-item mt-2">
          <Link
            to="/admin/users"
            className={`nav-link ${isActive("/admin/users") ? "active bg-primary" : "text-white"
              }`}
          >
            <i className="fas fa-users me-2"></i> Người dùng
          </Link>
        </li>
        <li className="nav-item mt-2">
          <Link
            to="/admin/flashsales"
            className={`nav-link ${isActive("/admin/flashsales") ? "active bg-primary" : "text-white"
              }`}
          >
            <i className="fas fa-bolt me-2"></i> Flash Sale
          </Link>
        </li>
        <li className="nav-item mb-2">
          <Link to="/admin/blogs" className={`nav-link ${isActive("/admin/blogs") ? "active bg-primary" : "text-white"}`}>
            <i className="fas fa-newspaper me-2"></i> Blogs
          </Link>
        </li>
        <li className="nav-item mb-2">
          <Link
            to="/admin/comments"
            className={`nav-link ${isActive("/admin/comments") ? "active bg-primary" : "text-white"}`}
          >
            <i className="fas fa-comments me-2"></i> Bình luận
          </Link>
        </li>
        
      </ul>
    </div>
  );
}
