import { useEffect, useState } from "react";
import axios from "axios";

export default function ProductCRUD() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [alert, setAlert] = useState(null);

  // Hàm chuyển danh sách thành cấu trúc cây
  const buildTree = (flatList) => {
    const idMap = {};
    const tree = [];

    flatList.forEach(item => {
      idMap[item.id] = { ...item, children: [] };
    });

    flatList.forEach(item => {
      if (item.parent && item.parent.id) {
        idMap[item.parent.id]?.children.push(idMap[item.id]);
      } else {
        tree.push(idMap[item.id]);
      }
    });

    return tree;
  };


  // Lấy dữ liệu danh mục từ API
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3001/categories");
      const treeData = buildTree(res.data);
      setCategories(treeData);
    } catch {
      showAlert("Lỗi khi tải dữ liệu!", "danger");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Hiển thị thông báo modal
  const showAlert = (message, type = "info") => setAlert({ message, type });
  const closeAlert = () => setAlert(null);

  // Lưu hoặc cập nhật danh mục
  const handleSave = async () => {
    if (!name.trim()) return showAlert("Vui lòng nhập tên danh mục!", "warning");

    try {
      if (editId) {
        await axios.put(`http://localhost:3001/categories/${editId}`, {
          name,
          parent: parentId ? { id: +parentId } : null,
        });
        showAlert("Cập nhật danh mục thành công!", "success");
      } else {
        await axios.post("http://localhost:3001/categories", {
          name,
          parent: parentId ? { id: +parentId } : null,
        });
        showAlert("Thêm danh mục thành công!", "success");
      }

      setName("");
      setParentId("");
      setEditId(null);
      fetchData();
    } catch {
      showAlert("Lỗi khi lưu danh mục!", "danger");
    }
  };

  // Xóa danh mục
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa danh mục này?")) return;
    try {
      await axios.delete(`http://localhost:3001/categories/${id}`);
      fetchData();
      showAlert("Xóa danh mục thành công!", "success");
    } catch {
      showAlert("Lỗi khi xóa danh mục!", "danger");
    }
  };

  // Chỉnh sửa danh mục
  const handleEdit = (cat) => {
    setEditId(cat.id);
    setName(cat.name);
    setParentId(cat.parent ? cat.parent.id : "");
    setShowModal(true);
  };

  // Hiển thị danh mục dạng cây
  const renderCategory = (list, level = 0) =>
    list.map((cat) => (
      <div
        key={cat.id}
        className={`card mb-3 shadow-sm border-0 ${
          level === 0
            ? "border-start border-primary border-4"
            : level === 1
            ? "border-start border-success border-4"
            : "border-start border-warning border-4"
        }`}
        style={{ marginLeft: `${level * 25}px`, borderRadius: "12px" }}
      >
        <div className="card-body p-3 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <div
              className={`me-3 p-2 rounded-3 ${
                level === 0
                  ? "bg-primary bg-opacity-10 text-primary"
                  : level === 1
                  ? "bg-success bg-opacity-10 text-success"
                  : "bg-warning bg-opacity-10 text-warning"
              }`}
            >
              <i
                className={`fas ${
                  level === 0
                    ? "fa-folder"
                    : level === 1
                    ? "fa-folder-open"
                    : "fa-file-alt"
                } fs-5`}
              ></i>
            </div>
            <div>
              <h6 className="mb-0 fw-semibold text-dark">{cat.name}</h6>
              <small className="text-muted">
                {level === 0
                  ? "Danh mục chính"
                  : level === 1
                  ? "Danh mục phụ"
                  : "Danh mục con"}
              </small>
            </div>
          </div>
          <div>
            <button
              className="btn btn-outline-primary btn-sm rounded-pill me-2"
              onClick={() => handleEdit(cat)}
            >
              <i className="fas fa-edit me-1"></i> Sửa
            </button>
            <button
              className="btn btn-outline-danger btn-sm rounded-pill"
              onClick={() => handleDelete(cat.id)}
            >
              <i className="fas fa-trash me-1"></i> Xóa
            </button>
          </div>
        </div>
        {cat.children && cat.children.length > 0 && (
          <div className="ms-4">{renderCategory(cat.children, level + 1)}</div>
        )}
      </div>
    ));

  return (
    <div className="container-fluid">

      {/* Modal thêm hoặc cập nhật danh mục */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i
                    className={`fas ${editId ? "fa-edit" : "fa-plus-circle"} me-2`}
                  ></i>
                  {editId ? "Cập nhật danh mục" : "Thêm danh mục mới"}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowModal(false);
                    setEditId(null);
                    setName("");
                    setParentId("");
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">
                    <i className="fas fa-tag me-1 text-primary"></i> Tên danh mục
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg border-2"
                    placeholder="Nhập tên danh mục..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">
                    <i className="fas fa-sitemap me-1 text-primary"></i> Danh mục cha
                  </label>
                  <select
                    className="form-select form-select-lg border-2"
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                  >
                    <option value="">-- Không có danh mục cha --</option>
                    {categories.flatMap((c) => [
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>,
                      ...(c.children || []).map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          └── {sub.name}
                        </option>
                      )),
                    ])}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary rounded-pill"
                  onClick={() => {
                    setShowModal(false);
                    setEditId(null);
                    setName("");
                    setParentId("");
                  }}
                >
                  Hủy
                </button>
                <button
                  className="btn btn-success rounded-pill"
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

      {/* Modal thông báo */}
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
              <div className="modal-body">
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

      {/* Tiêu đề và nút thêm */}
      <div className="row mb-4">
        <div className="col-12 d-flex justify-content-between align-items-center">
          <h2>Quản lý danh mục 3 cấp</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <i className="fas fa-plus-circle me-2"></i> Thêm danh mục mới
          </button>
        </div>
      </div>

      {/* Danh sách danh mục */}
      <div className="row">
        <div className="col-12">
          {loading ? (
            <div className="text-center py-5">
              <div
                className="spinner-border text-primary"
                style={{ width: "3rem", height: "3rem" }}
              ></div>
              <p className="mt-3 text-muted fs-5">Đang tải danh mục...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-5">
              <i className="fas fa-folder-open text-muted" style={{ fontSize: "4rem" }}></i>
              <h5 className="text-muted mt-3">Chưa có danh mục nào</h5>
              <p className="text-muted">Hãy thêm danh mục đầu tiên của bạn</p>
            </div>
          ) : (
            renderCategory(categories)
          )}
        </div>
      </div>
    </div>
  );
}
