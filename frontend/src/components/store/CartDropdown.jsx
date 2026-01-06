export default function CartDropdown({ open, items, onClose, onIncrease, onDecrease, onRemove, total, onCheckout }) {
  if (!open) return null;
  return (
    <div className="container" style={{ position: "relative" }}>
      <div className="card shadow" style={{ position: "absolute", right: 0, zIndex: 1000, width: 380 }}>
        <div className="card-header d-flex justify-content-between align-items-center">
          <strong>Giỏ hàng</strong>
          <button className="btn-close" onClick={onClose}></button>
        </div>
        <div className="card-body p-0" style={{ maxHeight: 360, overflowY: "auto" }}>
          {(!items || items.length === 0) ? (
            <div className="p-3 text-center text-muted">Chưa có sản phẩm</div>
          ) : (
            items.map((i) => (
              <div className="d-flex align-items-center gap-3 p-3 border-bottom" key={i.id}>
                <img
                  src={i.image ? `http://localhost:3001${i.image.startsWith('/') ? i.image : `/${i.image}`}` : "https://via.placeholder.com/60"}
                  alt={i.name}
                  width="60"
                  height="60"
                  style={{ objectFit: "cover" }}
                  className="rounded"
                />
                <div className="flex-grow-1">
                  <div className="fw-semibold text-truncate" title={i.name}>{i.name}</div>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => onDecrease(i)} disabled={i.quantity <= 1}><i className="fas fa-minus"></i></button>
                    <span className="px-2">{i.quantity}</span>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => onIncrease(i)}><i className="fas fa-plus"></i></button>
                    <button className="btn btn-sm btn-outline-danger ms-2" onClick={() => onRemove(i)} title="Xóa"><i className="fas fa-trash"></i></button>
                  </div>
                </div>
                <div className="fw-bold text-primary">{(Number(i.price) * i.quantity).toLocaleString()} đ</div>
              </div>
            ))
          )}
        </div>
        <div className="card-footer d-flex justify-content-between align-items-center">
          <div><span className="text-muted me-1">Tổng:</span><strong className="text-primary">{Number(total || 0).toLocaleString()} đ</strong></div>
          <button
            className="btn btn-success btn-sm"
            onClick={() => {
              if (!items || items.length === 0 || Number(total) <= 0) return;
              onCheckout();
            }}
            disabled={!items || items.length === 0 || Number(total) <= 0}
            title={!items || items.length === 0 ? "Giỏ hàng trống" : undefined}
          >
            <i className="fas fa-credit-card me-1"></i>Thanh toán
          </button>
        </div>
      </div>
    </div>
  );
}
