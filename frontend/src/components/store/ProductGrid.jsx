import { Link } from "react-router-dom";

export default function ProductGrid({ products, onBuyNow, onAddToCart, getImageUrl }) {
  if (!products || products.length === 0) {
    return (
      <div className="text-center text-muted py-5">
        <i className="fas fa-box-open fs-1"></i>
        <p className="mt-2">Chưa có sản phẩm nào.</p>
      </div>
    );
  }
  return (
    <div className="row g-4">
      {products.slice(0, 8).map((p) => (
        <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={p.id}>
          <div className="card h-100 shadow-sm">
            <Link to={`/product/${p.id}`}>
              <img
                src={getImageUrl(p)}
                className="card-img-top"
                alt={p.name}
                style={{ height: 180, objectFit: "cover" }}
              />
            </Link>
            <div className="card-body d-flex flex-column">
              <Link to={`/product/${p.id}`} className="text-decoration-none text-dark">
                <h5 className="card-title text-truncate" title={p.name}>{p.name}</h5>
              </Link>
              <p className="card-text text-primary fw-bold mb-3">
                {Number(p.price).toLocaleString()} đ
              </p>
              <div className="mt-auto d-flex gap-2">
                <button className="btn btn-sm btn-primary w-100" onClick={() => onBuyNow(p)}>Mua ngay</button>
                <button className="btn btn-sm btn-outline-primary" onClick={() => onAddToCart(p)}>Thêm vào giỏ</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


