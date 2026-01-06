// src/api/statistics.js
import axios from "axios";
import { getToken } from "./auth";

const API_URL = "http://localhost:3001"; // root API

function authHeaders() {
  const token = getToken();
  if (!token) {
    console.warn("[statistics] No token found");
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

// ======== OVERVIEW ========
export const getOverview = async () => {
  try {
    const res = await axios.get(`${API_URL}/overview`, { headers: authHeaders() });
    return res.data;
  } catch (err) {
    console.error("[getOverview] Error:", err.response ? err.response.data : err.message);
    throw new Error(err.response && err.response.data && err.response.data.message
      ? err.response.data.message
      : "Không thể tải tổng quan thống kê");
  }
};

// ======== REVENUE ========
export const getRevenueStats = async (period = "month") => {
  try {
    const res = await axios.get(`${API_URL}/orders/revenue?period=${period}`, { headers: authHeaders() });
    return res.data;
  } catch (err) {
    console.error("[getRevenueStats] Error:", err.response ? err.response.data : err.message);
    throw new Error(err.response && err.response.data && err.response.data.message
      ? err.response.data.message
      : "Không thể tải thống kê doanh thu");
  }
};

// ======== ORDER STATUS ========
export const getOrderStatusStats = async () => {
  try {
    const res = await axios.get(`${API_URL}/orders/status`, { headers: authHeaders() });
    return res.data;
  } catch (err) {
    console.error("[getOrderStatusStats] Error:", err.response ? err.response.data : err.message);
    throw new Error(err.response && err.response.data && err.response.data.message
      ? err.response.data.message
      : "Không thể tải thống kê trạng thái đơn hàng");
  }
};

// ======== USERS ========
export const getUserStats = async () => {
  try {
    const res = await axios.get(`${API_URL}/users`, { headers: authHeaders() });
    return res.data;
  } catch (err) {
    console.error("[getUserStats] Error:", err.response ? err.response.data : err.message);
    throw new Error(err.response && err.response.data && err.response.data.message
      ? err.response.data.message
      : "Không thể tải thống kê người dùng");
  }
};

// ======== PRODUCTS ========
export const getProductStats = async () => {
  try {
    const res = await axios.get(`${API_URL}/products`, { headers: authHeaders() });
    return res.data;
  } catch (err) {
    console.error("[getProductStats] Error:", err.response ? err.response.data : err.message);
    throw new Error(err.response && err.response.data && err.response.data.message
      ? err.response.data.message
      : "Không thể tải thống kê sản phẩm");
  }
};

// ======== BLOGS ========
export const getBlogStats = async () => {
  try {
    const res = await axios.get(`${API_URL}/blogs`, { headers: authHeaders() });
    return res.data;
  } catch (err) {
    console.error("[getBlogStats] Error:", err.response ? err.response.data : err.message);
    throw new Error(err.response && err.response.data && err.response.data.message
      ? err.response.data.message
      : "Không thể tải thống kê blog");
  }
};

// ======== COMMENTS ========
export const getCommentStats = async () => {
  try {
    const res = await axios.get(`${API_URL}/comments`, { headers: authHeaders() });
    return res.data;
  } catch (err) {
    console.error("[getCommentStats] Error:", err.response ? err.response.data : err.message);
    throw new Error(err.response && err.response.data && err.response.data.message
      ? err.response.data.message
      : "Không thể tải thống kê bình luận");
  }
};

// ======== SUPPLIERS ========
export const getSupplierStats = async () => {
  try {
    const res = await axios.get(`${API_URL}/suppliers`, { headers: authHeaders() });
    return res.data;
  } catch (err) {
    console.error("[getSupplierStats] Error:", err.response ? err.response.data : err.message);
    throw new Error(err.response && err.response.data && err.response.data.message
      ? err.response.data.message
      : "Không thể tải thống kê nhà cung cấp");
  }
};
