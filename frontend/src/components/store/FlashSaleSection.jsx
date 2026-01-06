

import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function FlashSaleSection() {
  const [flashSales, setFlashSales] = useState([]);
  const [timeLeft, setTimeLeft] = useState({});
  const API_URL = "http://localhost:3001/flashsales";

  // --- Lấy dữ liệu Flash Sale ---
  const fetchFlashSales = async () => {
    try {
      const res = await axios.get(`${API_URL}?page=1&limit=8`);
      setFlashSales(res.data.data || []);
    } catch (err) {
      console.error("Lỗi khi tải flash sale:", err);
    }
  };

  useEffect(() => {
    fetchFlashSales();
  }, []);

  // --- Countdown thời gian ---
  useEffect(() => {
    const interval = setInterval(() => {
      const updated = {};
      flashSales.forEach((sale) => {
        const end = new Date(sale.endTime).getTime();
        const now = Date.now();
        const diff = end - now;
        if (diff > 0) {
          updated[sale.id] = {
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / (1000 * 60)) % 60),
            seconds: Math.floor((diff / 1000) % 60),
          };
        } else updated[sale.id] = null;
      });
      setTimeLeft(updated);
    }, 1000);
    return () => clearInterval(interval);
  }, [flashSales]);

  return (
    <div className="container my-5">

      {/* --- HEADER --- */}
      <div
        className="d-flex justify-content-between align-items-center px-4 py-3 mb-4 rounded shadow-sm"
        style={{
          background: "linear-gradient(90deg, #ff4b2b, #ff9068)",
          color: "white",
        }}
      >
        <h3 className="fw-bold text-uppercase m-0">
          <i className="fas fa-bolt me-2"></i>Flash Sale Hôm Nay
        </h3>
        <Link
          to="/flashsale"
          className="btn btn-light btn-sm fw-semibold shadow-sm px-3"
        >
          Xem tất cả <i className="fas fa-arrow-right ms-1"></i>
        </Link>
      </div>

      {/* --- DANH SÁCH FLASH SALE --- */}
      <div className="row g-4">
        {flashSales.length === 0 ? (
          <div className="text-center text-muted py-5">
            <i className="fas fa-bolt fs-1 text-danger"></i>
            <p className="mt-2">Hiện chưa có chương trình Flash Sale nào.</p>
          </div>
        ) : (
          flashSales.map((sale) => {
            const product = sale.product;
            const original = Number(product.price);
            const discount = Number(sale.discountPrice);
            const discountPercent =
              original > 0
                ? Math.round(((original - discount) / original) * 100)
                : 0;

            return (
              <div className="col-6 col-sm-4 col-md-3 col-lg-2" key={sale.id}>
                <div className="card h-100 border-0 shadow-sm flash-card position-relative">
                  
                  {/* Badge giảm giá */}
                  {discountPercent > 0 && (
                    <span
                      className="badge bg-danger position-absolute top-0 start-0 rounded-end"
                      style={{
                        fontSize: "0.75rem",
                        padding: "6px 10px",
                        marginTop: "8px",
                      }}
                    >
                      -{discountPercent}%
                    </span>
                  )}

                  {/* Ảnh sản phẩm */}
                  <div
                    className="image-wrapper bg-light d-flex align-items-center justify-content-center"
                    style={{
                      height: "200px",
                      overflow: "hidden",
                      borderTopLeftRadius: "10px",
                      borderTopRightRadius: "10px",
                    }}
                  >
                    <Link to={`/product/${product.id}`} className="w-100 h-100">
                      <img
                        src={
                          product.images?.[0]?.url
                            ? `http://localhost:3001${product.images[0].url}`
                            : "/no-image.png"
                        }
                        alt={product.name}
                        className="w-100 h-100 object-fit-cover"
                      />
                    </Link>
                  </div>

                  {/* Thông tin sản phẩm */}
                  <div className="card-body d-flex flex-column text-center p-3">
                    {/* Tên sản phẩm */}
                    <h6
                      className="fw-semibold text-truncate mb-2"
                      title={product.name}
                      style={{ minHeight: "40px" }}
                    >
                      {product.name}
                    </h6>

                    {/* Giá */}
                    <div className="mb-2">
                      <span className="fw-bold text-danger me-2">
                        {discount.toLocaleString()} đ
                      </span>
                      <span className="text-muted text-decoration-line-through small">
                        {original.toLocaleString()} đ
                      </span>
                    </div>

                    {/* Countdown */}
                    <div
                      className="d-flex justify-content-center align-items-center gap-2 mb-2"
                      style={{ fontSize: "12px", minHeight: "20px" }}
                    >
                      {timeLeft[sale.id] ? (
                        <>
                          <i className="fas fa-clock text-danger"></i>
                          <span className="badge bg-light text-danger border">
                            {timeLeft[sale.id].hours}h
                          </span>
                          <span className="badge bg-light text-danger border">
                            {timeLeft[sale.id].minutes}m
                          </span>
                          <span className="badge bg-light text-danger border">
                            {timeLeft[sale.id].seconds}s
                          </span>
                        </>
                      ) : (
                        <span className="text-muted">Đã kết thúc</span>
                      )}
                    </div>

                    {/* Thanh tiến độ */}
                    <div className="progress mb-2" style={{ height: "8px" }}>
                      <div
                        className="progress-bar bg-danger"
                        role="progressbar"
                        style={{
                          width: `${Math.floor(Math.random() * 80 + 10)}%`,
                        }}
                      ></div>
                    </div>

                    <small className="text-muted mb-2">
                      <i className="fas fa-fire text-danger me-1"></i>
                      Đã bán {Math.floor(Math.random() * 100)} sản phẩm
                    </small>

                    {/* Spacer để nút mua luôn ở đáy */}
                    <div className="mt-auto">
                      <button
                        className="btn btn-danger btn-sm fw-semibold w-100"
                        style={{
                          borderRadius: "8px",
                          marginTop: "10px",
                        }}
                      >
                        <i className="fas fa-shopping-cart me-1"></i> Mua ngay
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Hover + layout fix */}
      <style>{`
        .flash-card {
          transition: all 0.3s ease;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
        }
        .flash-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }
        .image-wrapper img {
          transition: transform 0.4s ease, filter 0.3s ease;
        }
        .image-wrapper img:hover {
          transform: scale(1.05);
          filter: brightness(1.1);
        }
      `}</style>
    </div>
  );
}



