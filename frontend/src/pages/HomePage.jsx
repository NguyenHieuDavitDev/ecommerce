import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaStar } from "react-icons/fa";
import { listProducts } from "../api/products";
import StoreHeader from "../components/store/Header";
import ProductGrid from "../components/store/ProductGrid";
import CartDropdown from "../components/store/CartDropdown";
import Carousel from "../components/store/Carousel";
import FlashSaleSection from "../components/store/FlashSaleSection";
import BlogSection from "../components/store/BlogSection";
import StoreFooter from "../components/store/StoreFooter";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const COMMENTS_API = "http://localhost:3001/comments";
  const MEDIA_BASE_URL = "http://localhost:3001";

  // Lấy bình luận
  const fetchComments = async () => {
    try {
      const res = await axios.get(COMMENTS_API);
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Lỗi khi tải bình luận:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const renderStars = (rating) => (
    <div className="text-warning">
      {[1, 2, 3, 4, 5].map((i) => (
        <FaStar key={i} color={i <= rating ? "#ffc107" : "#e4e5e9"} />
      ))}
    </div>
  );

  const query = useMemo(() => {
    try {
      const params = new URLSearchParams(location.search);
      return (params.get("q") || "").toLowerCase();
    } catch {
      return "";
    }
  }, [location.search]);

  // Lấy danh sách sản phẩm
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await listProducts();
        setProducts(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Không thể tải sản phẩm", err);
      }
      loadCart();
    };
    fetchData();
  }, []);

  // Quản lý giỏ hàng
  const loadCart = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setCartItems([]);
    }
  };

  const getCartCount = () => cartItems.reduce((s, i) => s + (i.quantity || 0), 0);
  const getCartTotal = () => cartItems.reduce((s, i) => s + Number(i.price || 0) * Number(i.quantity || 0), 0);

  const getImageUrl = (product) => {
    const url = product?.images?.[0]?.url;
    if (!url) return "https://via.placeholder.com/400x300?text=No+Image";
    return `${MEDIA_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
  };

  const filteredProducts = useMemo(() => {
    if (!query) return products;
    return products.filter(
      (p) =>
        (p.name || "").toLowerCase().includes(query) ||
        String(p.id || "").includes(query) ||
        (p.category?.name || "").toLowerCase().includes(query)
    );
  }, [products, query]);

  const categories = useMemo(() => {
    const set = new Map();
    for (const p of products) {
      if (p?.category?.id) set.set(p.category.id, p.category.name);
    }
    return Array.from(set, ([id, name]) => ({ id, name }));
  }, [products]);

  const featured = useMemo(() => filteredProducts.slice(0, 8), [filteredProducts]);
  const recommended = useMemo(() => filteredProducts.slice(8, 12), [filteredProducts]);

  const addToCart = (product, quantity = 1) => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const idx = cart.findIndex((i) => i.id === product.id);
    if (idx >= 0) cart[idx].quantity += quantity;
    else
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product?.images?.[0]?.url || "",
        quantity,
      });
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
    alert("Đã thêm vào giỏ hàng");
  };

  const buyNow = (product) => {
    addToCart(product, 1);
    navigate(`/product/${product.id}`);
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) return alert("Giỏ hàng trống");
    navigate("/checkout/summary");
  };

  const updateCartQuantity = (id, nextQty) => {
    const next = cartItems.map((i) => (i.id === id ? { ...i, quantity: nextQty } : i));
    localStorage.setItem("cart", JSON.stringify(next));
    setCartItems(next);
  };

  const removeFromCart = (id) => {
    const next = cartItems.filter((i) => i.id !== id);
    localStorage.setItem("cart", JSON.stringify(next));
    setCartItems(next);
  };

  return (
    <div>
      <StoreHeader cartCount={getCartCount()} onToggleCart={() => setCartOpen((o) => !o)} />

      <CartDropdown
        open={cartOpen}
        items={cartItems}
        onClose={() => setCartOpen(false)}
        onIncrease={(i) => updateCartQuantity(i.id, i.quantity + 1)}
        onDecrease={(i) => updateCartQuantity(i.id, Math.max(1, i.quantity - 1))}
        onRemove={(i) => removeFromCart(i.id)}
        total={getCartTotal()}
        onCheckout={proceedToCheckout}
      />

      <div className="container py-5">
        <Carousel />
        <FlashSaleSection />

        {/* Categories */}
        <div id="categories" className="mb-4">
          <h2>Danh mục</h2>
          <div className="d-flex flex-wrap gap-2">
            {categories.map((c) => (
              <button key={c.id} className="btn btn-outline-secondary btn-sm">
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Products */}
        <ProductGrid products={featured} onBuyNow={buyNow} onAddToCart={addToCart} getImageUrl={getImageUrl} />

        {/* Recommended Products */}
        <div className="mt-5">
          <div className="d-flex align-items-baseline justify-content-between mb-2">
            <h2 className="fw-bold m-0">Gợi ý cho bạn</h2>
          </div>
          <ProductGrid products={recommended} onBuyNow={buyNow} onAddToCart={addToCart} getImageUrl={getImageUrl} />
        </div>

        {/* Brands */}
        <div id="brands" className="mt-5">
          <div className="d-flex align-items-baseline justify-content-between mb-3">
            <h2 className="fw-bold m-0">Thương hiệu nổi bật</h2>
          </div>
          <div className="d-flex flex-wrap gap-4 align-items-center justify-content-between border rounded p-3">
            {["Apple", "Samsung", "Sony", "Xiaomi", "Oppo", "Vivo"].map((b) => (
              <div key={b} className="text-muted">
                <i className="fas fa-award me-2 text-warning"></i>
                {b}
              </div>
            ))}
          </div>
        </div>

        {/* Blog / News */}
        <BlogSection />

        {/* Customer Reviews */}
        <div className="mt-5">
          <div className="d-flex align-items-baseline justify-content-between mb-3">
            <h2 className="fw-bold m-0">Khách hàng nói gì?</h2>
          </div>

          {loadingComments ? (
            <p>Đang tải bình luận...</p>
          ) : comments.length === 0 ? (
            <p className="text-muted">Chưa có bình luận nào.</p>
          ) : (
            <div className="row g-4">
              {comments.map((c) => (
                <div className="col-12 col-md-4" key={c.id}>
                  <div className="border rounded p-3 h-100">
                    <div className="d-flex align-items-center mb-2">
                      <img
                        src={
                          c.user?.avatar
                            ? `${MEDIA_BASE_URL}${c.user.avatar}`
                            : `https://api.dicebear.com/7.x/personas/svg?seed=${c.userId}`
                        }
                        alt="avatar"
                        width="45"
                        height="45"
                        className="rounded-circle me-2 border"
                        style={{ objectFit: "cover" }}
                      />
                      <div>
                        <div className="fw-semibold">{c.user?.name || `Người dùng #${c.userId}`}</div>
                        {renderStars(c.rating)}
                      </div>
                    </div>

                    <div className="text-muted mb-2">{c.content}</div>

                    {c.files?.length > 0 && (
                      <div className="d-flex flex-wrap gap-2">
                        {c.files.map((f, i) => {
                          const url = `${MEDIA_BASE_URL}${f.url}`;
                          const isVideo = /\.(mp4|webm|ogg)$/i.test(f.url);
                          return isVideo ? (
                            <video
                              key={i}
                              src={url}
                              width="160"
                              height="120"
                              controls
                              className="rounded border"
                              style={{ objectFit: "cover" }}
                            />
                          ) : (
                            <img
                              key={i}
                              src={url}
                              alt="media"
                              width="120"
                              height="120"
                              className="rounded border"
                              style={{ objectFit: "cover" }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* App Download */}
        <div className="mt-5 bg-light rounded p-4 d-flex flex-column flex-md-row align-items-center justify-content-between">
          <div className="mb-3 mb-md-0">
            <h3 className="fw-bold">Tải ứng dụng MyShop</h3>
            <div className="text-muted">Mua sắm nhanh hơn, nhận ưu đãi độc quyền.</div>
          </div>
          <div className="d-flex gap-2">
            <a className="btn btn-dark">
              <i className="fab fa-apple me-2"></i>App Store
            </a>
            <a className="btn btn-success">
              <i className="fab fa-google-play me-2"></i>Google Play
            </a>
          </div>
        </div>
      </div>

      <StoreFooter />
    </div>
  );
}
