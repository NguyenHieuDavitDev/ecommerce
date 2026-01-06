import { useEffect, useState } from "react";
import axios from "axios";

const PRODUCT_API = "http://localhost:3001/products";
const CATEGORY_API = "http://localhost:3001/categories";
const SUPPLIER_API = "http://localhost:3001/suppliers";
const FILE_HOST = "http://localhost:3001";

const initialForm = {
  id: null,
  name: "",
  description: "",
  price: "",
  stock: "",
  categoryId: "",
  supplierId: "",
  files: [],
};

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("vi-VN", { style: "currency", currency: "VND" });

const normalizeImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${FILE_HOST}${url}`;
  return `${FILE_HOST}/${url}`;
};

export default function ProductCRUD() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [existingImages, setExistingImages] = useState([]);
  const [previewSources, setPreviewSources] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productRes, categoryRes, supplierRes] = await Promise.all([
        axios.get(PRODUCT_API),
        axios.get(CATEGORY_API),
        axios.get(SUPPLIER_API),
      ]);
      setProducts(productRes.data || []);
      setCategories(categoryRes.data || []);
      setSuppliers(supplierRes.data || []);
    } catch (err) {
      console.error(err);
      showAlert("Không thể tải dữ liệu sản phẩm!", "danger");
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type = "info") => setAlert({ message, type });
  const closeAlert = () => setAlert(null);

  const resetPreview = () => {
    setPreviewSources((prev) => {
      prev.forEach((src) => src.startsWith("blob:") && URL.revokeObjectURL(src));
      return [];
    });
  };

  const resetForm = () => {
    setForm(initialForm);
    setExistingImages([]);
    resetPreview();
    setShowModal(false);
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setForm((prev) => ({ ...prev, files }));
    setPreviewSources((prev) => {
      prev.forEach((src) => src.startsWith("blob:") && URL.revokeObjectURL(src));
      return files.map((file) => URL.createObjectURL(file));
    });
  };

  const buildFormData = () => {
    if (!form.name.trim() || !form.price) {
      showAlert("Tên sản phẩm và giá bán là bắt buộc!", "warning");
      return null;
    }
    const payload = new FormData();
    payload.append("name", form.name.trim());
    payload.append("price", Number(form.price));
    payload.append("stock", Number(form.stock || 0));
    if (form.description) payload.append("description", form.description);
    if (form.categoryId) payload.append("categoryId", form.categoryId);
    if (form.supplierId) payload.append("supplierId", form.supplierId);
    form.files.forEach((file) => payload.append("images", file));
    return payload;
  };

  const handleSave = async () => {
    const payload = buildFormData();
    if (!payload) return;

    try {
      if (form.id) {
        await axios.patch(`${PRODUCT_API}/${form.id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showAlert("Cập nhật sản phẩm thành công!", "success");
      } else {
        await axios.post(PRODUCT_API, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showAlert("Thêm sản phẩm mới thành công!", "success");
      }
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      showAlert(err?.response?.data?.message || "Không thể lưu sản phẩm!", "danger");
    }
  };

  const handleEdit = (product) => {
    setForm({
      id: product.id,
      name: product.name || "",
      description: product.description || "",
      price: product.price ?? "",
      stock: product.stock ?? "",
      categoryId: product.category?.id || "",
      supplierId: product.supplier?.id || "",
      files: [],
    });
    setExistingImages(product.images || []);
    resetPreview();
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    try {
      await axios.delete(`${PRODUCT_API}/${id}`);
      showAlert("Xóa sản phẩm thành công!", "success");
      fetchData();
    } catch (err) {
      console.error(err);
      showAlert("Không thể xóa sản phẩm!", "danger");
    }
  };

  const renderImages = (images = []) => {
    if (!images.length) return <span>—</span>;
    return (
      <div className="d-flex flex-wrap gap-1">
        {images.map((img) => (
          <img
            key={img.id || img.url}
            src={normalizeImageUrl(img.url)}
            alt={img.url}
            width={70}
            height={60}
            style={{ objectFit: "cover", borderRadius: 4 }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container-fluid py-4">
      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show`}
          style={{ position: "fixed", top: 20, right: 20, zIndex: 9999 }}
        >
          {alert.message}
          <button type="button" className="btn-close" onClick={closeAlert}></button>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">Quản lý Sản phẩm</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setForm(initialForm);
            setExistingImages([]);
            resetPreview();
            setShowModal(true);
          }}
        >
          <i className="fas fa-plus-circle me-2"></i> Thêm sản phẩm
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
              <p className="mt-3 text-muted fs-5">Đang tải dữ liệu...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="fas fa-box-open fs-1"></i>
              <p className="mt-2">Chưa có sản phẩm nào.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Tên sản phẩm</th>
                    <th>Giá bán</th>
                    <th>Tồn kho</th>
                    <th>Danh mục</th>
                    <th>Nhà cung cấp</th>
                    <th>Ảnh</th>
                    <th className="text-end">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="fw-semibold">{product.name}</div>
                        <div className="text-muted small text-truncate" style={{ maxWidth: 220 }}>
                          {product.description || "—"}
                        </div>
                      </td>
                      <td>{formatCurrency(product.price)}</td>
                      <td>{product.stock ?? 0}</td>
                      <td>{product.category?.name || "—"}</td>
                      <td>{product.supplier?.name || "—"}</td>
                      <td>{renderImages(product.images)}</td>
                      <td className="text-end">
                        <button className="btn btn-outline-primary btn-sm me-2" onClick={() => handleEdit(product)}>
                          <i className="fas fa-edit me-1"></i> Sửa
                        </button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(product.id)}>
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

      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">{form.id ? "Cập nhật sản phẩm" : "Thêm sản phẩm mới"}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={resetForm}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Tên sản phẩm *</label>
                    <input className="form-control" name="name" value={form.name} onChange={handleFieldChange} required />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Giá bán *</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      name="price"
                      value={form.price}
                      onChange={handleFieldChange}
                      required
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Tồn kho</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      name="stock"
                      value={form.stock}
                      onChange={handleFieldChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Danh mục</label>
                    <select className="form-select" name="categoryId" value={form.categoryId} onChange={handleFieldChange}>
                      <option value="">-- Chọn danh mục --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Nhà cung cấp</label>
                    <select className="form-select" name="supplierId" value={form.supplierId} onChange={handleFieldChange}>
                      <option value="">-- Chọn nhà cung cấp --</option>
                      {suppliers.map((sup) => (
                        <option key={sup.id} value={sup.id}>
                          {sup.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Mô tả</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      name="description"
                      value={form.description}
                      onChange={handleFieldChange}
                    ></textarea>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Ảnh sản phẩm (tối đa 5)</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="form-control"
                      onChange={handleFileChange}
                    />
                    <small className="text-muted">
                      Nếu tải ảnh mới, toàn bộ ảnh cũ sẽ được thay thế. Ảnh hiện tại hiển thị bên dưới.
                    </small>
                  </div>
                  {existingImages.length > 0 && (
                    <div className="col-12">
                      <label className="form-label">Ảnh đang sử dụng</label>
                      <div className="d-flex flex-wrap gap-2">
                        {existingImages.map((img) => (
                          <img
                            key={img.id || img.url}
                            src={normalizeImageUrl(img.url)}
                            alt={img.url}
                            width={90}
                            height={80}
                            style={{ objectFit: "cover", borderRadius: 6 }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {previewSources.length > 0 && (
                    <div className="col-12">
                      <label className="form-label">Ảnh mới sẽ tải lên</label>
                      <div className="d-flex flex-wrap gap-2">
                        {previewSources.map((src) => (
                          <img
                            key={src}
                            src={src}
                            alt="preview"
                            width={90}
                            height={80}
                            style={{ objectFit: "cover", borderRadius: 6 }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={resetForm}>
                  Hủy
                </button>
                <button className="btn btn-success" onClick={handleSave}>
                  {form.id ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
