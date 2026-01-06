import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faCalendarAlt } from "@fortawesome/free-solid-svg-icons";

export default function BlogDetailPage() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);

  useEffect(() => {
    axios
      .get(`http://localhost:3001/blogs/${id}`)
      .then((res) => setBlog(res.data))
      .catch((err) => console.error("Không tải được blog:", err));
  }, [id]);

  const gallery = useMemo(() => {
    if (!blog) return [];
    if (Array.isArray(blog.images) && blog.images.length > 0) return blog.images;
    return blog.image ? [blog.image] : [];
  }, [blog]);

  const buildImageUrl = (path) => (path?.startsWith("http") ? path : `http://localhost:3001${path}`);

  if (!blog) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-3">Đang tải bài viết...</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      {/* Nút quay lại */}
      <Link to="/" className="btn btn-outline-secondary mb-4">
        <FontAwesomeIcon icon={faArrowLeft} /> Quay lại
      </Link>

   

      {/* Tiêu đề */}
      <h1 className="fw-bold text-center mb-3">{blog.title}</h1>

      {/* Ngày đăng */}
      <p className="text-muted text-center mb-4">
        <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
        {new Date(blog.createdAt).toLocaleDateString("vi-VN")}
      </p>

      {/* Ảnh bìa */}
      {gallery[0] && (
        <div className="text-center mb-4">
          <img
            src={buildImageUrl(gallery[0])}
            alt={blog.title}
            className="img-fluid rounded shadow-sm"
            style={{ maxHeight: "400px", objectFit: "cover", width: "100%" }}
          />
        </div>
      )}

      {/* Nội dung bài viết */}
      <div
        className="mx-auto blog-content"
        style={{ maxWidth: "800px", lineHeight: "1.9", fontSize: "1.05rem" }}
        dangerouslySetInnerHTML={{ __html: blog.content }}
      ></div>

      {gallery.length > 1 && (
        <div className="mt-4">
          <h5 className="fw-bold mb-3">Thư viện ảnh</h5>
          <div className="row g-3">
            {gallery.slice(1).map((img, idx) => (
              <div className="col-12 col-md-6" key={`${img}-${idx}`}>
                <img
                  src={buildImageUrl(img)}
                  alt={`blog-${idx}`}
                  className="img-fluid rounded shadow-sm"
                  style={{ width: "100%", objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
