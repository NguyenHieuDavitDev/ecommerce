import { useEffect, useState } from "react";
import axios from "axios";

export default function FlashsaleCRUD() {
  const [flashsales, setFlashsales] = useState([]);
  const [products, setProducts] = useState([]);
  const [title, setTitle] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [productId, setProductId] = useState("");

  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [search, setSearch] = useState("");

  const API_URL = "http://localhost:3001/flashsales";

  // ==========================
  // FETCH DATA
  // ==========================
  const fetchData = async () => {
    setLoading(true);
    try {
      const [flashRes, prodRes] = await Promise.all([
        axios.get(`${API_URL}?page=${page}&limit=${limit}&search=${search}`),
        axios.get("http://localhost:3001/products"),
      ]);
      setFlashsales(flashRes.data.data || flashRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      console.error(err);
      showAlert("Lỗi khi tải dữ liệu flash sale!", "danger");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [page, search]);

  // ==========================
  // ALERT
  // ==========================
  const showAlert = (message, type = "info") => setAlert({ message, type });
  const closeAlert = () => setAlert(null);

  // ==========================
  // SAVE / UPDATE
  // ==========================
  const handleSave = async () => {
    if (!title.trim() || !discountPrice || !productId)
      return showAlert("Vui lòng nhập đầy đủ thông tin!", "warning");

    const data = {
      title,
      discountPrice: Number(discountPrice),
      startTime,
      endTime,
      productId: Number(productId),
    };

    try {
      if (editId) {
        await axios.put(`${API_URL}/${editId}`, data);
        showAlert("Cập nhật Flash Sale thành công!", "success");
      } else {
        await axios.post(API_URL, data);
        showAlert("Thêm Flash Sale mới thành công!", "success");
      }
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      showAlert("Lỗi khi lưu Flash Sale!", "danger");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDiscountPrice("");
    setStartTime("");
    setEndTime("");
    setProductId("");
    setEditId(null);
    setShowModal(false);
  };

  // ==========================
  // DELETE
  // ==========================
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa Flash Sale này?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      showAlert("Đã xóa Flash Sale thành công!", "success");
      fetchData();
    } catch {
      showAlert("Lỗi khi xóa Flash Sale!", "danger");
    }
  };

  // ==========================
  // EDIT
  // ==========================
  const handleEdit = (item) => {
    setEditId(item.id);
    setTitle(item.title);
    setDiscountPrice(item.discountPrice);
    setStartTime(item.startTime?.slice(0, 16) || "");
    setEndTime(item.endTime?.slice(0, 16) || "");
    setProductId(item.product?.id || "");
    setShowModal(true);
  };

  // ==========================
  // RENDER UI
  // ==========================
  return (
    <div className="container-fluid py-4">
      {/* ALERT */}
      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show`}
          role="alert"
          style={{ position: "fixed", top: 20, right: 20, zIndex: 9999 }}
        >
          {alert.message}
          <button
            type="button"
            className="btn-close"
            onClick={closeAlert}
          ></button>
        </div>
      )}

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">Quản lý Flash Sale</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus-circle me-2"></i> Thêm Flash Sale
        </button>
      </div>

      {/* SEARCH */}
      <div className="input-group mb-3" style={{ maxWidth: 400 }}>
        <input
          type="text"
          className="form-control"
          placeholder="Tìm kiếm flash sale..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-outline-secondary" onClick={fetchData}>
          <i className="fas fa-search"></i>
        </button>
      </div>

      {/* TABLE */}
      <div className="card shadow-sm border-0">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
              <p className="mt-3 text-muted fs-5">Đang tải dữ liệu...</p>
            </div>
          ) : flashsales.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="fas fa-bolt fs-1"></i>
              <p className="mt-2">Chưa có Flash Sale nào.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Tên Flash Sale</th>
                    <th>Giá giảm</th>
                    <th>Thời gian bắt đầu</th>
                    <th>Thời gian kết thúc</th>
                    <th>Sản phẩm</th>
                    <th className="text-end">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {flashsales.map((f) => (
                    <tr key={f.id}>
                      <td>{f.title}</td>
                      <td>{Number(f.discountPrice).toLocaleString()} đ</td>
                      <td>{new Date(f.startTime).toLocaleString()}</td>
                      <td>{new Date(f.endTime).toLocaleString()}</td>
                      <td>{f.product?.name || "—"}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-outline-primary btn-sm me-2"
                          onClick={() => handleEdit(f)}
                        >
                          <i className="fas fa-edit me-1"></i> Sửa
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(f.id)}
                        >
                          <i className="fas fa-trash me-1"></i> Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* PAGINATION */}
      <div className="d-flex justify-content-center mt-4">
        <button
          className="btn btn-outline-primary me-2"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <span className="align-self-center">Trang {page}</span>
        <button
          className="btn btn-outline-primary ms-2"
          onClick={() => setPage(page + 1)}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  {editId ? "Cập nhật Flash Sale" : "Thêm Flash Sale"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={resetForm}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Tên Flash Sale</label>
                  <input
                    type="text"
                    className="form-control"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Giá giảm</label>
                  <input
                    type="number"
                    className="form-control"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Thời gian bắt đầu</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Thời gian kết thúc</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Sản phẩm</label>
                  <select
                    className="form-select"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={resetForm}>
                  Hủy
                </button>
                <button className="btn btn-success" onClick={handleSave}>
                  {editId ? "Cập nhật" : "Thêm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
