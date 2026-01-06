import { useEffect, useState } from "react";
import { createBlog, listBlogs } from "../../api/blogs";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faSearch, faNewspaper } from "@fortawesome/free-solid-svg-icons";
import RichTextEditor from "../RichTextEditor";

export default function BlogSection() {
  const [blogs, setBlogs] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(4);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [featured, setFeatured] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();

  const fetchBlogs = async () => {
    try {
      const res = await listBlogs(page, limit, search);
      setBlogs(res.data || []);
      setTotal(res.total || 0);
    } catch {
      console.error("Không tải được blog");
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [page, search]);

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    const mapped = files.map((file, index) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${index}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setUploads((prev) => [...prev, ...mapped]);
  };

  const removeUpload = (id) => {
    setUploads((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((item) => item.id !== id);
    });
  };

  const resetForm = (shouldClose = true) => {
    setTitle("");
    setContent("");
    setFeatured(false);
    uploads.forEach((item) => URL.revokeObjectURL(item.preview));
    setUploads([]);
    if (shouldClose) setShowModal(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      return alert("Vui lòng nhập đầy đủ tiêu đề và nội dung!");
    }
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("featured", featured ? "true" : "false");
      formData.append("currentImages", JSON.stringify([]));
      uploads.forEach((item) => formData.append("images", item.file));

      await createBlog(formData);
      resetForm();
      fetchBlogs();
    } catch {
      alert("Lỗi khi đăng bài!");
    }
  };

  const handleViewDetail = (id) => {
    navigate(`/blog/${id}`);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div id="blog" className="mt-5">
      {/* Tiêu đề và nút đăng */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold m-0">Tin tức & Mẹo mua sắm</h2>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            resetForm(false);
            setShowModal(true);
          }}
        >
          Đăng bài
        </button>
      </div>

      {/* Ô tìm kiếm */}
      <div className="mb-3 input-group">
        <input
          type="text"
          className="form-control"
          placeholder="Tìm bài viết..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-outline-secondary" onClick={fetchBlogs}>
          <FontAwesomeIcon icon={faSearch} />
        </button>
      </div>

      {/* Danh sách bài viết */}
      <div className="row g-4">
        {blogs.map((b) => (
          <div className="col-12 col-md-6 col-lg-4" key={b.id}>
            <div
              className="card h-100 shadow-sm cursor-pointer"
              onClick={() => handleViewDetail(b.id)}
            >
              <div
                style={{ height: 160 }}
                className="bg-light rounded-top d-flex align-items-center justify-content-center"
              >
                { (b.images?.[0] || b.image) ? (
                  <img
                    src={(b.images?.[0] || b.image).startsWith("http") ? b.images?.[0] || b.image : `http://localhost:3001${b.images?.[0] || b.image}`}
                    alt="blog"
                    style={{
                      height: "100%",
                      width: "100%",
                      objectFit: "cover",
                      borderRadius: "8px 8px 0 0",
                    }}
                  />
                ) : (
                  <FontAwesomeIcon icon={faNewspaper} className="text-muted fs-1" />
                )}
              </div>
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{b.title}</h5>
                <p className="card-text text-muted">
                  {b.content ? b.content.replace(/<[^>]+>/g, " ").slice(0, 100) + "..." : ""}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      

      {/* Modal đăng bài */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Đăng bài mới</h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={resetForm}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Hình ảnh</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="form-control"
                    onChange={handleFilesSelected}
                  />
                  {uploads.length > 0 && (
                    <div className="row g-2 mt-2">
                      {uploads.map((img) => (
                        <div className="col-4 position-relative" key={img.id}>
                          <img
                            src={img.preview}
                            alt="preview"
                            className="img-fluid rounded"
                            style={{ objectFit: "cover", height: "110px" }}
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                            onClick={() => removeUpload(img.id)}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Tiêu đề"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <RichTextEditor value={content} onChange={setContent} />
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                  />
                  <label className="form-check-label">Nổi bật</label>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={resetForm}>
                  Hủy
                </button>
                <button className="btn btn-success" onClick={handleSave}>
                  Đăng bài
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
