import { useEffect, useState } from "react";
import { listBlogs, createBlog, updateBlog, deleteBlog } from "../api/blogs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faEdit, faTrash, faSearch, faStar, faPlus, faTimes } from "@fortawesome/free-solid-svg-icons";
import RichTextEditor from "./RichTextEditor";

export default function BlogCRUD() {
  const [blogs, setBlogs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(5);
  const [search, setSearch] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [featured, setFeatured] = useState(false);

  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);

  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await listBlogs(page, limit, search);
      setBlogs(data.data || []);
      setTotal(data.total || 0);
    } catch {
      showAlert("Lỗi khi tải dữ liệu!", "danger");
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [page, search]);

  const showAlert = (msg, type = "info") => setAlert({ msg, type });
  const closeAlert = () => setAlert(null);

  const buildImageUrl = (path) => path ? (path.startsWith("http") ? path : `http://localhost:3001${path}`) : null;
  const stripHtml = (html = "") => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    const mapped = files.map((file, i) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${i}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setNewImages(prev => [...prev, ...mapped]);
  };

  const removeExistingImage = (path) => setExistingImages(prev => prev.filter(x => x !== path));
  const removeNewImage = (id) => {
    setNewImages(prev => {
      const target = prev.find(x => x.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter(x => x.id !== id);
    });
  };

  const resetForm = (close = true) => {
    setTitle(""); setContent(""); setFeatured(false);
    setExistingImages([]);
    newImages.forEach(x => URL.revokeObjectURL(x.preview));
    setNewImages([]);
    setEditId(null);
    if (close) setShowModal(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim())
      return showAlert("Vui lòng nhập đầy đủ tiêu đề và nội dung!", "warning");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("featured", featured ? "true" : "false");
    formData.append("currentImages", JSON.stringify(existingImages));
    newImages.forEach(img => formData.append("images", img.file));

    try {
      if (editId) await updateBlog(editId, formData);
      else await createBlog(formData);

      showAlert(editId ? "Cập nhật thành công!" : "Tạo blog thành công!", "success");
      resetForm();
      fetchData();
    } catch {
      showAlert("Lỗi khi lưu!", "danger");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa blog này?")) return;
    try {
      await deleteBlog(id);
      showAlert("Đã xóa!", "success");
      fetchData();
    } catch {
      showAlert("Lỗi khi xóa!", "danger");
    }
  };

  const handleEdit = (b) => {
    setEditId(b.id);
    setTitle(b.title);
    setContent(b.content);
    setFeatured(b.featured || false);
    setExistingImages(b.images?.length ? b.images : b.image ? [b.image] : []);
    newImages.forEach(x => URL.revokeObjectURL(x.preview));
    setNewImages([]);
    setShowModal(true);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="container py-4">
      {/* Alert */}
      {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          {alert.msg}
          <button className="btn-close" onClick={closeAlert}></button>
        </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between mb-4 align-items-center">
        <h2 className="fw-bold text-primary">Quản lý Blog</h2>
        <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => { resetForm(false); setShowModal(true); }}>
          <FontAwesomeIcon icon={faPlus} /> Thêm Blog
        </button>
      </div>

      {/* Search */}
      <div className="input-group mb-4">
        <input className="form-control" placeholder="Tìm kiếm tiêu đề..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="btn btn-outline-secondary" onClick={fetchData}><FontAwesomeIcon icon={faSearch} /></button>
      </div>

      {/* Table */}
      <div className="card shadow-sm">
        <div className="card-body">
          {loading ? <p>Đang tải...</p> :
            blogs.length === 0 ? <p className="text-muted">Chưa có blog nào.</p> :
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Tiêu đề</th>
                  <th>Nội dung</th>
                  <th>Nổi bật</th>
                  <th className="text-end">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map(b => (
                  <tr key={b.id}>
                    <td>
                      {buildImageUrl(b.images?.[0] || b.image) ? (
                        <img src={buildImageUrl(b.images?.[0] || b.image)} alt="thumb" width={65} height={65} className="rounded" style={{ objectFit: "cover" }} />
                      ) : (
                        <div className="bg-light d-flex justify-content-center align-items-center rounded" style={{ width: 65, height: 65 }}>
                          <FontAwesomeIcon icon={faImage} className="text-secondary" />
                        </div>
                      )}
                    </td>
                    <td className="fw-semibold">{b.title}</td>
                    <td>{stripHtml(b.content).slice(0, 80)}...</td>
                    <td>{b.featured && <FontAwesomeIcon icon={faStar} className="text-warning" />}</td>
                    <td className="text-end">
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(b)}><FontAwesomeIcon icon={faEdit} /></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(b.id)}><FontAwesomeIcon icon={faTrash} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          }

          {/* Pagination */}
          <nav className="mt-3">
            <ul className="pagination justify-content-center">
              <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => setPage(page - 1)}>Trước</button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => (
                <li key={i} className={`page-item ${page === i + 1 ? "active" : ""}`}>
                  <button className="page-link" onClick={() => setPage(i + 1)}>{i + 1}</button>
                </li>
              ))}
              <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                <button className="page-link" onClick={() => setPage(page + 1)}>Tiếp</button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">{editId ? "Cập nhật Blog" : "Thêm Blog mới"}</h5>
                <button className="btn-close btn-close-white" onClick={resetForm}></button>
              </div>
              <div className="modal-body">
                <label className="fw-semibold mb-2">Hình ảnh</label>
                <input type="file" accept="image/*" multiple className="form-control mb-3" onChange={handleFilesSelected} />
                <div className="row g-2">
                  {existingImages.map(img => (
                    <div className="col-4 position-relative" key={img}>
                      <img src={buildImageUrl(img)} alt="" className="img-fluid rounded" style={{ height: "130px", objectFit: "cover" }} />
                      <button className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1" onClick={() => removeExistingImage(img)}>
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  ))}
                  {newImages.map(img => (
                    <div className="col-4 position-relative" key={img.id}>
                      <img src={img.preview} alt="" className="img-fluid rounded" style={{ height: "130px", objectFit: "cover" }} />
                      <button className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1" onClick={() => removeNewImage(img.id)}>
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </div>
                  ))}
                </div>

                <input type="text" placeholder="Tiêu đề" className="form-control mt-3 mb-3" value={title} onChange={e => setTitle(e.target.value)} />
                <RichTextEditor value={content} onChange={setContent} />
                <div className="form-check mt-3">
                  <input className="form-check-input" type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} />
                  <label className="form-check-label">Nổi bật</label>
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
    </div>
  );
}
