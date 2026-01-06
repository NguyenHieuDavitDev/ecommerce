// src/components/store/StoreFooter.jsx
import React from "react";

export default function StoreFooter() {
  return (
    <footer className="bg-light border-top mt-5">
      <div className="container py-5">
        <div className="row g-4">
          {/* About */}
          <div className="col-12 col-md-4">
            <h5 className="fw-bold mb-3">Về MyShop</h5>
            <p className="text-muted">
              MyShop mang đến trải nghiệm mua sắm trực tuyến nhanh chóng và đáng tin cậy.
            </p>
            <div className="text-muted small">Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM</div>
            <div className="text-muted small">Hotline: 1900 1234</div>
            <div className="text-muted small">Email: support@myshop.vn</div>
          </div>

          {/* Policies */}
          <div className="col-6 col-md-2">
            <h6 className="fw-semibold mb-3">Chính sách</h6>
            <ul className="list-unstyled">
              <li><a href="#" className="text-muted text-decoration-none hover-link">Bảo mật</a></li>
              <li><a href="#" className="text-muted text-decoration-none hover-link">Đổi trả</a></li>
              <li><a href="#" className="text-muted text-decoration-none hover-link">Giao hàng</a></li>
              <li><a href="#" className="text-muted text-decoration-none hover-link">Điều khoản</a></li>
            </ul>
          </div>

          {/* Social & Newsletter */}
          <div className="col-6 col-md-3">
            <h6 className="fw-semibold mb-3">Kết nối với chúng tôi</h6>
            <div className="d-flex gap-3 mb-3">
              <a href="#" className="text-muted fs-4 hover-icon"><i className="fab fa-facebook"></i></a>
              <a href="#" className="text-muted fs-4 hover-icon"><i className="fab fa-instagram"></i></a>
              <a href="#" className="text-muted fs-4 hover-icon"><i className="fab fa-tiktok"></i></a>
              <a href="#" className="text-muted fs-4 hover-icon"><i className="fab fa-youtube"></i></a>
            </div>
            <div className="mt-3">
              <div className="fw-semibold mb-2">Đăng ký nhận bản tin</div>
              <div className="d-flex">
                <input className="form-control" placeholder="Email của bạn" />
                <button className="btn btn-primary ms-2">Đăng ký</button>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="col-12 col-md-3">
            <h6 className="fw-semibold mb-3">Phương thức thanh toán</h6>
            <div className="d-flex flex-wrap gap-2">
              <span className="badge bg-white text-dark border p-2 hover-badge"><i className="fab fa-cc-visa me-1"></i>Visa</span>
              <span className="badge bg-white text-dark border p-2 hover-badge"><i className="fas fa-mobile-alt me-1"></i>MoMo</span>
              <span className="badge bg-white text-dark border p-2 hover-badge"><i className="fas fa-qrcode me-1"></i>ZaloPay</span>
              <span className="badge bg-white text-dark border p-2 hover-badge"><i className="fab fa-cc-mastercard me-1"></i>MasterCard</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-muted mt-4 small">
          © {new Date().getFullYear()} MyShop. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
