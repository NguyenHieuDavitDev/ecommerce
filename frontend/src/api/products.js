import axios from "axios";

const PRODUCT_API = "http://localhost:3001/products";

export const listProducts = async () => {
  const res = await axios.get(PRODUCT_API);
  return res.data;
};

export const searchProducts = async (q) => {
  const params = q ? { params: { q } } : undefined;
  const res = await axios.get(PRODUCT_API, params);
  return res.data;
};
// API lấy recommended từ backend
export const getRecommendedProducts = async () => {
  const res = await axios.get("http://localhost:3001/products/recommended");
  return res.data;
};