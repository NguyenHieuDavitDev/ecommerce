import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMemo, useState, useEffect, useRef } from "react";
import { getToken, logout } from "../../api/auth";
import { listCategories } from "../../api/categories";
import { listProducts, searchProducts } from "../../api/products";

export default function StoreHeader({ cartCount, onToggleCart }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [cats, setCats] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const debounceRef = useRef(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const suggestRef = useRef(null);
  const userMenuRef = useRef(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const currentQuery = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search);
      return params.get("q") || "";
    } catch {
      return "";
    }
  }, [location.search]);

  useEffect(() => {
    setSearch(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    (async () => {
      try {
        const [c, p] = await Promise.all([listCategories(), listProducts()]);
        setCats(Array.isArray(c) ? c : []);
        setAllProducts(Array.isArray(p) ? p : []);
        setSuggestions(Array.isArray(p) ? p.slice(0, 8) : []);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (suggestRef.current && !suggestRef.current.contains(e.target)) setShowSuggest(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const onSubmitSearch = (e) => {
    e.preventDefault();
    const term = (search || "").trim();
    const params = new URLSearchParams(location.search);
    if (term) params.set("q", term); else params.delete("q");
    navigate({ pathname: "/", search: params.toString() });
  };

  return (
    <>
      {/* Topbar */}
      <div className="bg-dark text-white small">
        <div className="container d-flex justify-content-between align-items-center py-1">
          <div className="d-flex gap-3">
            <span><i className="fas fa-phone-alt me-1"></i> Hotline: 1900 1234</span>
            <span><i className="fas fa-shipping-fast me-1"></i> Freeship đơn từ 500k</span>
            <span><i className="fas fa-bullhorn me-1"></i> Giảm đến 50% tuần này</span>
          </div>
          <div className="d-flex gap-3">
            <a href="#" className="text-white text-decoration-none"><i className="fas fa-heart me-1"></i> Yêu thích</a>
            <a href="#order-tracking" className="text-white text-decoration-none"><i className="fas fa-receipt me-1"></i> Theo dõi đơn</a>
          </div>
        </div>
      </div>

      {/* Main navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom">
        <div className="container py-2">
          <Link to="/" className="navbar-brand fw-bold text-primary">MyShop</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarsStore">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarsStore">
            {/* Category menu - dynamic */}
            <ul className="navbar-nav me-3 mb-2 mb-lg-0">
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#categories" id="dropdown01" data-bs-toggle="dropdown" aria-expanded="false">Danh mục</a>
                <ul className="dropdown-menu" aria-labelledby="dropdown01">
                  {cats.length === 0 && <li className="px-3 py-1 text-muted small">Đang tải...</li>}
                  {cats.map((c) => (
                    <li key={c.id}>
                      <button className="dropdown-item" onClick={() => navigate({ pathname: "/", search: new URLSearchParams({ q: c.name }).toString() })}>{c.name}</button>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>

            {/* Search bar */}
            <form className="d-flex flex-grow-1 me-3 position-relative" onSubmit={onSubmitSearch} role="search" ref={suggestRef}>
              <input
                className="form-control"
                type="search"
                placeholder="Tìm kiếm sản phẩm..."
                value={search}
                onChange={(e) => {
                  const term = e.target.value;
                  setSearch(term);
                  setShowSuggest(true);
                  if (debounceRef.current) clearTimeout(debounceRef.current);
                  debounceRef.current = setTimeout(async () => {
                    if (!term.trim()) { setSuggestions([]); return; }
                    try {
                      const res = await searchProducts(term.trim());
                      setSuggestions(Array.isArray(res) ? res.slice(0, 8) : []);
                    } catch {
                      setSuggestions([]);
                    }
                  }, 250);
                }}
                onFocus={() => setShowSuggest(true)}
              />
              <button className="btn btn-primary ms-2" type="submit"><i className="fas fa-search"></i></button>
              {showSuggest && (search || "").trim() && (
                <div className="position-absolute bg-white border rounded shadow-sm mt-5 w-100" style={{ zIndex: 1000 }}>
                  {suggestions.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className="dropdown-item text-start"
                        onClick={() => { setShowSuggest(false); navigate(`/product/${p.id}`); }}
                      >
                        <i className="fas fa-search me-2 text-muted"></i>{p.name}
                      </button>
                    ))}
                  {suggestions.length === 0 && (
                    <div className="px-3 py-2 text-muted small">Không tìm thấy sản phẩm</div>
                  )}
                </div>
              )}
            </form>

            {/* Right side */}
            <div className="d-flex align-items-center gap-2">
              {getToken() ? (
                <div
                  className="dropdown"
                  ref={userMenuRef}
                  onMouseEnter={() => setShowUserMenu(true)}
                  onMouseLeave={() => setShowUserMenu(false)}
                >
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm dropdown-toggle"
                    aria-expanded={showUserMenu ? "true" : "false"}
                    onClick={() => setShowUserMenu((v) => !v)}
                  >
                    <i className="fas fa-user me-1"></i> {JSON.parse(localStorage.getItem("profile") || "{}").username || "Tài khoản"}
                  </button>
                  <ul className={`dropdown-menu dropdown-menu-end ${showUserMenu ? "show" : ""}`}>
                    <li>
                      <button className="dropdown-item" onClick={() => { setShowUserMenu(false); navigate("/account"); }}>Hồ sơ của tôi</button>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item" onClick={() => { setShowUserMenu(false); logout(); navigate("/login"); }}>Đăng xuất</button>
                    </li>
                  </ul>
                </div>
              ) : (
                <>
                  <Link to="/login" className="btn btn-outline-secondary btn-sm" title="Tài khoản">
                    <i className="fas fa-user me-1"></i> Đăng nhập
                  </Link>
                  <Link to="/register" className="btn btn-outline-primary btn-sm" title="Đăng ký">
                    <i className="fas fa-user-plus me-1"></i> Đăng ký
                  </Link>
                </>
              )}
              <button className="btn btn-link text-decoration-none position-relative" onClick={onToggleCart} title="Giỏ hàng">
                <i className="fas fa-shopping-cart fs-5"></i>
                {cartCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {cartCount}
                  </span>
                )}
              </button>
              <a href="/admin" className="btn btn-primary btn-sm" title="Quản trị">
                <i className="fas fa-tools"></i>
              </a>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}


