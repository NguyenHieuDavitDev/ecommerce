import { useEffect, useState } from "react";
import axios from "axios";

export default function SupplierCRUD() {
  const [suppliers, setSuppliers] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState(null);

  // ==========================
  // FETCH SUPPLIERS
  // ==========================
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3001/suppliers");
      setSuppliers(res.data);
    } catch {
      showAlert("Lỗi khi tải danh sách nhà cung cấp!", "danger");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================
  // ALERT
  // ==========================
  const showAlert = (message, type = "info") => setAlert({ message, type });
  const closeAlert = () => setAlert(null);

  // ==========================
  // HANDLE IMAGE UPLOAD
  // ==========================
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImage(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  // ==========================
  // SAVE / UPDATE SUPPLIER
  // ==========================
  const handleSave = async () => {
    if (!name.trim()) return showAlert("Vui lòng nhập tên nhà cung cấp!", "warning");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("address", address);
      if (image) formData.append("image", image);

      if (editId) {
        await axios.put(`http://localhost:3001/suppliers/${editId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showAlert("Cập nhật nhà cung cấp thành công!", "success");
      } else {
        await axios.post("http://localhost:3001/suppliers", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showAlert("Thêm nhà cung cấp mới thành công!", "success");
      }

      setName("");
      setPhone("");
      setAddress("");
      setImage(null);
      setPreview(null);
      setEditId(null);
      fetchData();
    } catch {
      showAlert("Lỗi khi lưu dữ liệu nhà cung cấp!", "danger");
    }
  };

  // ==========================
  // DELETE SUPPLIER
  // ==========================
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa nhà cung cấp này?")) return;
    try {
      await axios.delete(`http://localhost:3001/suppliers/${id}`);
      fetchData();
      showAlert("Đã xóa thành công!", "success");
    } catch {
      showAlert("Lỗi khi xóa nhà cung cấp!", "danger");
    }
  };

  // ==========================
  // EDIT SUPPLIER
  // ==========================
  const handleEdit = (supplier) => {
    setEditId(supplier.id);
    setName(supplier.name);
    setPhone(supplier.phone || "");
    setAddress(supplier.address || "");
    setPreview(supplier.image ? `http://localhost:3001${supplier.image}` : null);
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
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className={`modal-header bg-${alert.type} text-white`}>
                <h5 className="modal-title">
                  {alert.type === "success"
                    ? "Thành công"
                    : alert.type === "danger"
                    ? "Lỗi"
                    : "Thông báo"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeAlert}
                ></button>
              </div>
              <div className="modal-body text-center">
                <p>{alert.message}</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeAlert}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">Quản lý Nhà Cung Cấp</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus-circle me-2"></i> Thêm nhà cung cấp
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
          ) : suppliers.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="fas fa-box-open fs-1"></i>
              <p className="mt-2">Chưa có nhà cung cấp nào.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Ảnh</th>
                    <th>Tên nhà cung cấp</th>
                    <th>Số điện thoại</th>
                    <th>Địa chỉ</th>
                    <th className="text-end">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id}>
                      <td>
                        {s.image ? (
                          <img
                            src={`http://localhost:3001${s.image}`}
                            alt="supplier"
                            width="60"
                            height="60"
                            style={{ objectFit: "cover", borderRadius: "8px" }}
                          />
                        ) : (
                          <div className="bg-light text-secondary text-center rounded" style={{ width: 60, height: 60, lineHeight: "60px" }}>
                            <i className="fas fa-image"></i>
                          </div>
                        )}
                      </td>
                      <td className="fw-semibold">{s.name}</td>
                      <td>{s.phone || "-"}</td>
                      <td>{s.address || "-"}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-outline-primary btn-sm me-2"
                          onClick={() => handleEdit(s)}
                        >
                          <i className="fas fa-edit me-1"></i> Sửa
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(s.id)}
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

      {/* MODAL ADD / EDIT */}
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
                  <i className={`fas ${editId ? "fa-edit" : "fa-plus-circle"} me-2`}></i>
                  {editId ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp mới"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowModal(false);
                    setEditId(null);
                    setName("");
                    setPhone("");
                    setAddress("");
                    setImage(null);
                    setPreview(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3 text-center">
                  {preview ? (
                    <img
                      src={preview}
                      alt="preview"
                      className="rounded shadow-sm mb-2"
                      width="120"
                      height="120"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div className="border rounded d-inline-block p-4 text-secondary">
                      <i className="fas fa-image fs-3"></i>
                    </div>
                  )}
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      className="form-control"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Tên nhà cung cấp</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập tên..."
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Số điện thoại</label>
                  <input
                    type="text"
                    className="form-control"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nhập số điện thoại..."
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Địa chỉ</label>
                  <input
                    type="text"
                    className="form-control"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Nhập địa chỉ..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setEditId(null);
                    setName("");
                    setPhone("");
                    setAddress("");
                    setImage(null);
                    setPreview(null);
                  }}
                >
                  Hủy
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => {
                    handleSave();
                    setShowModal(false);
                  }}
                >
                  <i className={`fas me-2 ${editId ? "fa-save" : "fa-plus"}`}></i>
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
