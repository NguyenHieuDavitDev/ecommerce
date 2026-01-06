import { useEffect, useState } from "react";
import axios from "axios";
import { listRoles } from "../api/roles";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [roleOptions, setRoleOptions] = useState([]);

  // Modal + form
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [alert, setAlert] = useState(null);

  // form state (includes the additional fields requested)
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    roleId: "",
    roleName: "",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    dateOfBirth: "",
    gender: "", // "male" | "female" | "other" | ""
    avatarUrl: "", // existing URL from server
    addresses: "", // JSON string or simple text
    paymentMethods: "", // JSON string or simple text
  });

  // avatar file for upload + preview
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const API_URL = "http://localhost:3001/users";

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const showAlert = (message, type = "info") => setAlert({ message, type });
  const closeAlert = () => setAlert(null);

  const updateForm = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      showAlert("Lỗi khi tải danh sách người dùng!", "danger");
    }
    setLoading(false);
  };

  const fetchRoles = async () => {
    try {
      const data = await listRoles();
      setRoleOptions(data);
    } catch (err) {
      console.error(err);
      showAlert("Không tải được danh sách quyền!", "danger");
    }
  };

  const resetForm = () => {
    setForm({
      username: "",
      password: "",
      email: "",
      roleId: "",
      roleName: "",
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      dateOfBirth: "",
      gender: "",
      avatarUrl: "",
      addresses: "",
      paymentMethods: "",
    });
    setAvatarFile(null);
    setAvatarPreview("");
    setEditId(null);
    setShowModal(false);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (u) => {
    // populate fields using returned payload structure (supports roleDetail)
    setEditId(u.id);
    setForm({
      username: u.username || "",
      password: "", // don't prefill password
      email: u.email || "",
      roleId: u.roleId ?? u.roleDetail?.id ?? "",
      roleName: u.roleName || u.role || u.roleDetail?.name || "",
      customerName: u.customerName || "",
      customerPhone: u.customerPhone || "",
      customerAddress: u.customerAddress || "",
      dateOfBirth: u.dateOfBirth ? u.dateOfBirth.split("T")[0] : "", // yyyy-mm-dd
      gender: u.gender || "",
      avatarUrl: u.avatarUrl || "",
      addresses: u.addresses ? JSON.stringify(u.addresses, null, 2) : "",
      paymentMethods: u.paymentMethods ? JSON.stringify(u.paymentMethods, null, 2) : "",
    });

    setAvatarFile(null);
    setAvatarPreview(u.avatarUrl || "");
    setShowModal(true);
  };

  // avatar file change handler (preview)
  const handleAvatarChange = (e) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setAvatarFile(null);
      setAvatarPreview(form.avatarUrl || "");
      return;
    }
    setAvatarFile(f);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(f);
  };

  // save user (supports file upload if avatarFile is present)
  const handleSave = async () => {
    if (!form.username.trim()) return showAlert("Vui lòng nhập username!", "warning");
    if (!editId && !form.password.trim())
      return showAlert("Vui lòng nhập mật khẩu cho tài khoản mới!", "warning");
    if (!form.roleId) return showAlert("Vui lòng chọn vai trò!", "warning");

    try {
      let res;
      // If avatar file is provided, use FormData
      if (avatarFile) {
        const fd = new FormData();
        fd.append("username", form.username);
        if (!editId) fd.append("password", form.password);
        if (form.email) fd.append("email", form.email);
        fd.append("roleId", String(form.roleId));
        if (form.customerName) fd.append("customerName", form.customerName);
        if (form.customerPhone) fd.append("customerPhone", form.customerPhone);
        if (form.customerAddress) fd.append("customerAddress", form.customerAddress);
        if (form.dateOfBirth) fd.append("dateOfBirth", form.dateOfBirth);
        if (form.gender) fd.append("gender", form.gender);
        if (form.addresses) fd.append("addresses", form.addresses);
        if (form.paymentMethods) fd.append("paymentMethods", form.paymentMethods);
        fd.append("avatar", avatarFile);

        if (editId) {
          res = await axios.patch(`${API_URL}/${editId}`, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          res = await axios.post(API_URL, fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      } else {
        // send JSON (no file)
        const payload = {
          username: form.username,
          ...(form.password ? { password: form.password } : {}),
          email: form.email || null,
          roleId: Number(form.roleId),
          customerName: form.customerName || null,
          customerPhone: form.customerPhone || null,
          customerAddress: form.customerAddress || null,
          dateOfBirth: form.dateOfBirth || null,
          gender: form.gender || null,
          avatarUrl: form.avatarUrl || null,
          addresses: form.addresses ? tryParseMaybe(form.addresses) : null,
          paymentMethods: form.paymentMethods ? tryParseMaybe(form.paymentMethods) : null,
        };

        if (editId) {
          res = await axios.patch(`${API_URL}/${editId}`, payload);
        } else {
          res = await axios.post(API_URL, payload);
        }
      }

      showAlert(editId ? "Cập nhật người dùng thành công!" : "Thêm người dùng thành công!", "success");
      fetchUsers();
      resetForm();
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.message || "Lỗi khi lưu người dùng!";
      showAlert(message, "danger");
    }
  };

  // try parse JSON-like textarea into object, otherwise return raw string
  const tryParseMaybe = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa người dùng này?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      showAlert("Xóa người dùng thành công!", "success");
      fetchUsers();
    } catch (err) {
      console.error(err);
      showAlert("Lỗi khi xóa người dùng!", "danger");
    }
  };

  return (
    <div className="container py-4">
      {/* Alert modal */}
      {alert && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className={`modal-header bg-${alert.type} text-white`}>
                <h5 className="modal-title">Thông báo</h5>
                <button className="btn-close btn-close-white" onClick={closeAlert}></button>
              </div>
              <div className="modal-body">{alert.message}</div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">{editId ? "Cập nhật người dùng" : "Thêm người dùng"}</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>

              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Tên đăng nhập</label>
                    <input className="form-control" value={form.username} onChange={(e) => updateForm("username", e.target.value)} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input className="form-control" value={form.email} onChange={(e) => updateForm("email", e.target.value)} />
                  </div>

                  {!editId && (
                    <div className="col-md-6">
                      <label className="form-label">Mật khẩu</label>
                      <input type="password" className="form-control" value={form.password} onChange={(e) => updateForm("password", e.target.value)} />
                    </div>
                  )}

                  <div className="col-md-6">
                    <label className="form-label">Vai trò</label>
                    <select className="form-select" value={form.roleId} onChange={(e) => {
                      const selectedId = e.target.value;
                      updateForm("roleId", selectedId);
                      const sel = roleOptions.find(r => String(r.id) === String(selectedId));
                      if (sel) updateForm("roleName", sel.name || sel.description || "");
                    }}>
                      <option value="">-- Chọn vai trò --</option>
                      {roleOptions.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.description || r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Tên khách hàng</label>
                    <input className="form-control" value={form.customerName} onChange={(e) => updateForm("customerName", e.target.value)} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Số điện thoại</label>
                    <input className="form-control" value={form.customerPhone} onChange={(e) => updateForm("customerPhone", e.target.value)} />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Địa chỉ</label>
                    <input className="form-control" value={form.customerAddress} onChange={(e) => updateForm("customerAddress", e.target.value)} />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Ngày sinh</label>
                    <input type="date" className="form-control" value={form.dateOfBirth} onChange={(e) => updateForm("dateOfBirth", e.target.value)} />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Giới tính</label>
                    <select className="form-select" value={form.gender} onChange={(e) => updateForm("gender", e.target.value)}>
                      <option value="">-- Chọn --</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Avatar (upload)</label>
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width: 96, height: 96, borderRadius: 8, overflow: "hidden", background: "#f5f5f5" }}>
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <div className="text-center text-muted small py-3">Chưa có</div>
                        )}
                      </div>
                      <div>
                        <input type="file" accept="image/*" onChange={handleAvatarChange} />
                        <div className="form-text">Chọn file để upload avatar (nếu không chọn sẽ giữ avatar hiện có).</div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Địa chỉ (chi tiết / JSON)</label>
                    <textarea className="form-control" rows={3} value={form.addresses} onChange={(e) => updateForm("addresses", e.target.value)} placeholder='Có thể nhập JSON hoặc text tự do'></textarea>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Phương thức thanh toán (JSON hoặc text)</label>
                    <textarea className="form-control" rows={2} value={form.paymentMethods} onChange={(e) => updateForm("paymentMethods", e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={resetForm}>Hủy</button>
                <button className="btn btn-success" onClick={handleSave}>{editId ? "Cập nhật" : "Thêm mới"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Quản lý người dùng</h2>
        <div>
          <button className="btn btn-primary me-2" onClick={openCreateModal}>
            <i className="fas fa-user-plus me-2" /> Thêm người dùng
          </button>
          <button className="btn btn-outline-secondary" onClick={fetchUsers}>Tải lại</button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-5 text-muted">Đang tải...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-5 text-muted">Chưa có người dùng nào.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="table-primary">
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Khách hàng</th>
                <th>Điện thoại</th>
                <th>Vai trò</th>
                <th>Ngày tạo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.email || "-"}</td>
                  <td>{u.customerName || "-"}</td>
                  <td>{u.customerPhone || "-"}</td>
                  <td>
                    <span className="badge bg-secondary text-capitalize">
                      {u.roleDetail?.description || u.roleDetail?.name || u.roleName || u.role || u.roleId || "Không có"}
                    </span>
                  </td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleString() : "-"}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEditModal(u)}>
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(u.id)}>
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
