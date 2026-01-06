import React, { useEffect, useState } from "react";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Component StarRating với FontAwesome
const StarRating = ({ rating, onRate }) => {
  return (
    <div>
      {[1,2,3,4,5].map(star => (
        <i
          key={star}
          className={`fa-star fa-lg me-1 ${
            star <= rating ? "fas text-warning" : "far text-secondary"
          }`}
          style={{ cursor: onRate ? "pointer" : "default" }}
          onClick={() => onRate && onRate(star)}
        />
      ))}
    </div>
  );
};

export default function CommentUser({ productId }) {
  const [comments, setComments] = useState([]);
  const [username, setUsername] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(0);
  const [images, setImages] = useState([]);

  const fetchComments = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/products/${productId}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchComments(); }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !text.trim()) {
      alert("Vui lòng nhập tên và nội dung bình luận");
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("text", text);
    formData.append("rating", rating);
    images.forEach(file => formData.append("images", file));

    try {
      await axios.post(`http://localhost:3001/products/${productId}/comments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUsername(""); setText(""); setRating(0); setImages([]);
      fetchComments();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="container my-4">
      <h3 className="mb-4 text-primary">Bình luận</h3>

      {/* Form bình luận */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Tên của bạn"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <textarea
                className="form-control"
                placeholder="Viết bình luận..."
                value={text}
                onChange={e => setText(e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="mb-3 d-flex align-items-center justify-content-between">
              <StarRating rating={rating} onRate={setRating} />
              <input
                type="file"
                className="form-control-file"
                multiple
                onChange={e => setImages(Array.from(e.target.files))}
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">
              <i className="fas fa-paper-plane me-2"></i> Gửi bình luận
            </button>
          </form>
        </div>
      </div>

      {/* Danh sách bình luận */}
      {comments.map(comment => (
        <div key={comment.id} className="card mb-3 shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="card-title mb-0">{comment.username}</h6>
              <StarRating rating={comment.rating} />
            </div>
            <p className="card-text">{comment.text}</p>
            {comment.images?.length > 0 && (
              <div className="d-flex flex-wrap gap-2 mt-2">
                {comment.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={`http://localhost:3001/${img.url}`}
                    alt="comment"
                    className="img-thumbnail"
                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
