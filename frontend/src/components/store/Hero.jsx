export default function Hero() {
  return (
    <div className="p-5 mb-5 bg-light rounded-3 text-center">
      <h1 className="display-5 fw-bold">Cửa hàng trực tuyến</h1>
      <p className="lead mb-4">
        Khám phá những sản phẩm mới nhất với giá tốt nhất hôm nay!
      </p>
      <div className="d-flex justify-content-center gap-2">
        <a href="#featured" className="btn btn-primary btn-lg">
          Mua sắm ngay
        </a>
        <a href="/admin" className="btn btn-outline-secondary btn-lg">
          Trang quản trị
        </a>
      </div>
    </div>
  );
}


