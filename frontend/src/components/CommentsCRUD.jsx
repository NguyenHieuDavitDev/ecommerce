import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

const API = "http://localhost:3001";
const PAGE_SIZE = 10;

export default function CommentsCRUD() {
  const [comments, setComments] = useState([]);
  const [form, setForm] = useState({
    username: "",
    text: "",
    rating: 0,
    productId: "",
    images: [],
  });
  const [editingId, setEditingId] = useState(null);
  const [previewImages, setPreviewImages] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [modalVisible, setModalVisible] = useState(false);

  // ============================
  // Load all comments
  // ============================
  const fetchComments = async () => {
    try {
      const res = await axios.get(`${API}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error("Load comments error", err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  // ============================
  // Handle image upload preview
  // ============================
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setForm({ ...form, images: files });

    const previews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages(previews);
  };

  // ============================
  // Add / update comment
  // ============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("username", form.username);
    data.append("text", form.text);
    data.append("rating", form.rating);
    data.append("productId", form.productId);
    form.images.forEach((img) => data.append("images", img));

    try {
      if (editingId) {
        await axios.patch(`${API}/comments/${editingId}`, data);
      } else {
        await axios.post(`${API}/comments`, data);
      }
      fetchComments();
      resetForm();
      setModalVisible(false);
    } catch (err) {
      console.error("Save error", err);
    }
  };

  // ============================
  // Delete comment
  // ============================
  const deleteComment = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa bình luận này?")) return;
    try {
      await axios.delete(`${API}/comments/${id}`);
      fetchComments();
    } catch (err) {
      console.error("Delete error", err);
    }
  };

  // ============================
  // Edit comment
  // ============================
  const editComment = (cmt) => {
    setEditingId(cmt.id);
    setForm({
      username: cmt.username,
      text: cmt.text,
      rating: cmt.rating,
      productId: cmt.product.id,
      images: [],
    });
    setPreviewImages(cmt.images.map((img) => `${API}/${img.url}`));
    setModalVisible(true);
  };

  // ============================
  // Reset form
  // ============================
  const resetForm = () => {
    setEditingId(null);
    setForm({ username: "", text: "", rating: 0, productId: "", images: [] });
    setPreviewImages([]);
  };

  // ============================
  // Filter & Pagination
  // ============================
  const filtered = comments.filter(
    (cmt) =>
      cmt.username.toLowerCase().includes(search.toLowerCase()) ||
      String(cmt.product.id).includes(search)
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const displayed = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="container mt-4">
      <h2 className="mb-4 text-primary">
        <i className="fas fa-comments me-2"></i>Quản lý bình luận
      </h2>

      <div className="mb-3 d-flex justify-content-between">
        <input
          type="text"
          className="form-control w-50"
          placeholder="Tìm kiếm theo tên người dùng hoặc ID sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="btn btn-success"
          onClick={() => {
            resetForm();
            setModalVisible(true);
          }}
        >
          <i className="fas fa-plus me-1"></i>Thêm bình luận
        </button>
      </div>

      {/* ============================
          Modal Thêm / Chỉnh sửa
      ============================ */}
      {modalVisible && (
        <div className="modal show fade d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  {editingId ? "Cập nhật bình luận" : "Thêm bình luận mới"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModalVisible(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Tên người dùng</label>
                      <input
                        className="form-control"
                        value={form.username}
                        onChange={(e) =>
                          setForm({ ...form, username: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">ID sản phẩm</label>
                      <input
                        className="form-control"
                        value={form.productId}
                        onChange={(e) =>
                          setForm({ ...form, productId: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label">Số sao</label>
                      <input
                        type="number"
                        className="form-control"
                        value={form.rating}
                        onChange={(e) =>
                          setForm({ ...form, rating: e.target.value })
                        }
                        max={5}
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Nội dung</label>
                    <textarea
                      className="form-control"
                      value={form.text}
                      onChange={(e) => setForm({ ...form, text: e.target.value })}
                      rows="3"
                      required
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Hình ảnh</label>
                    <input
                      type="file"
                      className="form-control"
                      multiple
                      onChange={handleImageChange}
                    />
                  </div>

                  {previewImages.length > 0 && (
                    <div className="mb-3 d-flex flex-wrap">
                      {previewImages.map((img, i) => (
                        <div
                          key={i}
                          className="position-relative me-2 mb-2"
                          style={{ width: 100, height: 100 }}
                        >
                          <img
                            src={img}
                            alt="preview"
                            className="rounded shadow-sm"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                          <span
                            className="position-absolute top-0 end-0 badge bg-danger rounded-circle"
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              setPreviewImages(
                                previewImages.filter((_, idx) => idx !== i)
                              )
                            }
                          >
                            &times;
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-end">
                    <button className="btn btn-secondary me-2" type="button" onClick={() => setModalVisible(false)}>
                      Hủy
                    </button>
                    <button className="btn btn-success" type="submit">
                      {editingId ? "Cập nhật" : "Thêm mới"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================
          Table danh sách bình luận
      ============================ */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-dark text-white">
          <i className="fas fa-list me-2"></i>Danh sách bình luận
        </div>
        <div className="card-body table-responsive">
          <table className="table table-bordered table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>ID</th>
                <th>Sản phẩm</th>
                <th>Người dùng</th>
                <th>Nội dung</th>
                <th>Rating</th>
                <th>Ảnh</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((cmt) => (
                <tr key={cmt.id}>
                  <td>{cmt.id}</td>
                  <td>{cmt.product?.id}</td>
                  <td>{cmt.username}</td>
                  <td>{cmt.text}</td>
                  <td>
                    <span className="badge bg-warning text-dark">
                      {cmt.rating} <i className="fas fa-star"></i>
                    </span>
                  </td>
                  <td>
                    {cmt.images?.map((img) => (
                      <img
                        key={img.id}
                        src={`${API}/${img.url}`}
                        alt=""
                        width={50}
                        className="rounded me-1 shadow-sm"
                      />
                    ))}
                  </td>
                  <td>{new Date(cmt.createdAt).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn btn-primary btn-sm me-2"
                      onClick={() => editComment(cmt)}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteComment(cmt.id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <nav>
            <ul className="pagination justify-content-center">
              <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </button>
              </li>
              {Array.from({ length: totalPages }, (_, i) => (
                <li
                  key={i}
                  className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                >
                  <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                    {i + 1}
                  </button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
