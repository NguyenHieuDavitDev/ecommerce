import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { FaCartPlus, FaBolt, FaBoxOpen, FaTag, FaWarehouse } from "react-icons/fa";
import StoreHeader from "../components/store/Header";
import CommentUser from "../components/CommentUser";
import StoreFooter from "../components/store/StoreFooter";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    axios.get(`http://localhost:3001/products/${id}`)
      .then(res => setProduct(res.data))
      .catch(() => alert("Không thể tải sản phẩm"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartCount(cart.reduce((a,b)=>a+b.quantity,0));
  }, []);

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("cart")||"[]");
    const exist = cart.findIndex(c=>c.id===product.id);
    if(exist>=0) cart[exist].quantity+=quantity;
    else cart.push({id:product.id,name:product.name,price:product.price,image:product.images?.[0]?.url||"",quantity});
    localStorage.setItem("cart",JSON.stringify(cart));
    setCartCount(cart.reduce((a,b)=>a+b.quantity,0));
    alert("Đã thêm vào giỏ hàng!");
  };

  const getImageUrl = (p) => p?.images?.[0]?.url ? `http://localhost:3001${p.images[0].url}` : "https://via.placeholder.com/600x400";

  return (
    <>
      <StoreHeader cartCount={cartCount} onToggleCart={()=>{}} />
      <div className="container py-5">
        {loading && <div className="text-center py-5">Đang tải...</div>}

        {!loading && product && (
          <div className="row g-5">
            {/* Hình ảnh sản phẩm */}
            <div className="col-md-6">
              <img
                id="mainImg"
                src={getImageUrl(product)}
                alt={product.name}
                className="img-fluid rounded shadow-sm w-100 mb-3"
                style={{objectFit:'cover', maxHeight:450}}
              />
              {product.images?.length > 1 && (
                <div className="d-flex gap-2 flex-wrap">
                  {product.images.map((img,i)=>(
                    <img
                      key={i}
                      src={`http://localhost:3001${img.url}`}
                      alt={`thumb-${i}`}
                      width="80"
                      height="80"
                      className="rounded border shadow-sm"
                      style={{cursor:'pointer', objectFit:'cover'}}
                      onClick={e=>document.querySelector("#mainImg").src=e.target.src}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thông tin sản phẩm */}
            <div className="col-md-6">
              <h2 className="fw-bold mb-3">{product.name}</h2>
              <h4 className="text-primary mb-3">{Number(product.price).toLocaleString()} đ</h4>

              <div className="mb-3">
                <span className="badge bg-light text-dark me-2"><FaBoxOpen className="me-1"/>Tồn kho: {product.stock}</span>
                <span className="badge bg-light text-dark"><FaWarehouse className="me-1"/>Kho: {product.supplier?.name || '-'}</span>
              </div>

              <div className="mb-3 d-flex align-items-center gap-2">
                <label className="fw-semibold m-0">Số lượng:</label>
                <input
                  type="number"
                  className="form-control"
                  style={{width:80}}
                  min="1"
                  value={quantity}
                  onChange={e=>setQuantity(Math.max(1,Number(e.target.value)))}
                />
              </div>

              <div className="d-flex gap-2 mb-4">
                <button className="btn btn-primary" onClick={addToCart}><FaCartPlus className="me-1"/>Thêm vào giỏ</button>
                <button className="btn btn-success"><FaBolt className="me-1"/>Mua ngay</button>
              </div>

              <div className="mb-4">
                <h5 className="fw-semibold mb-2">Mô tả sản phẩm</h5>
                <p className="text-muted">{product.description || "Không có mô tả."}</p>
              </div>
            </div>

            {/* Bình luận */}
            <div className="col-12 mt-5">
              <CommentUser productId={id} />
            </div>
          </div>
        )}
      </div>
      <StoreFooter />
    </>
  );
}
