import { useEffect, useState } from "react";
import { listRoles, createRole, updateRole, deleteRole } from "../api/roles";

export default function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await listRoles();
      setRoles(data);
    } catch (err) {
      console.error(err);
      setAlert({ type: "danger", message: "Không tải được danh sách quyền." });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingRole(null);
    setShowModal(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setAlert({ type: "warning", message: "Vui lòng nhập tên quyền." });
      return;
    }
    try {
      if (editingRole) {
        await updateRole(editingRole.id, { name, description });
        setAlert({ type: "success", message: "Đã cập nhật quyền." });
      } else {
        await createRole({ name, description });
        setAlert({ type: "success", message: "Đã tạo quyền mới." });
      }
      resetForm();
      fetchRoles();
    } catch (err) {
      const message = err?.response?.data?.message || "Không lưu được quyền.";
      setAlert({ type: "danger", message });
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description || "");
    setShowModal(true);
  };

  const handleDelete = async (role) => {
    if (!window.confirm(`Xóa quyền "${role.name}"?`)) return;
    try {
      await deleteRole(role.id);
      setAlert({ type: "success", message: "Đã xóa quyền." });
      fetchRoles();
    } catch (err) {
      const message =
        err?.response?.data?.message || "Không thể xóa quyền đang được sử dụng.";
      setAlert({ type: "danger", message });
    }
  };

  return (
    <div className="container py-4">
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible`} role="alert">
          {alert.message}
          <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Quản lý quyền</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <i className="fas fa-plus me-2"></i> Thêm quyền
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-5 text-muted">Đang tải...</div>
          ) : roles.length === 0 ? (
            <div className="text-center py-5 text-muted">Chưa có quyền nào.</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Tên quyền</th>
                    <th>Mô tả</th>
                    <th>Người dùng</th>
                    <th className="text-end">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id}>
                      <td className="text-capitalize">{role.name}</td>
                      <td>{role.description || "—"}</td>
                      <td>
                        <span className="badge bg-secondary">
                          {role.userCount ?? role.users?.length ?? 0}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleEdit(role)}
                        >
                          <i className="fas fa-edit me-1"></i> Sửa
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(role)}
                          disabled={(role.userCount ?? 0) > 0}
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

      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  {editingRole ? "Cập nhật quyền" : "Thêm quyền mới"}
                </h5>
                <button className="btn-close btn-close-white" onClick={resetForm}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Tên quyền</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="vd: admin, editor..."
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Mô tả</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả ngắn về quyền này"
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={resetForm}>
                  Hủy
                </button>
                <button className="btn btn-success" onClick={handleSave}>
                  {editingRole ? "Lưu thay đổi" : "Tạo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


