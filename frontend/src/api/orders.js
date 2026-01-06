// import axios from "axios";

// const API_URL = "http://localhost:3001/orders";

// export const listOrders = async () => {
//   try {
//     const res = await axios.get(API_URL);
//     return res.data;
//   } catch (err) {
//     throw new Error(err?.response?.data?.message || 'Không thể tải danh sách đơn hàng');
//   }
// };

// export const createOrder = async (payload) => {
//   try {
//     const res = await axios.post(API_URL, payload);
//     return res.data;
//   } catch (err) {
//     throw new Error(err?.response?.data?.message || 'Không thể tạo đơn hàng');
//   }
// };

// export const createMomoPayment = async (payload) => {
//   try {
//     const res = await axios.post(`${API_URL}/momo`, payload);
//     if (process.env.NODE_ENV !== 'production') {
//       // eslint-disable-next-line no-console
//       console.log('[MoMo][create] response', res.data);
//     }
//     return res.data;
//   } catch (err) {
//     throw new Error(err?.response?.data?.message || 'Không thể khởi tạo thanh toán MoMo');
//   }
// };

// export const finalizeOrder = async (payload) => {
//   try {
//     const res = await axios.post(`${API_URL}/finalize`, payload);
//     return res.data;
//   } catch (err) {
//     throw new Error(err?.response?.data?.message || 'Không thể hoàn tất đơn hàng sau thanh toán');
//   }
// };

// export const updateOrder = async (id, payload) => {
//   try {
//     const res = await axios.patch(`${API_URL}/${id}`, payload);
//     return res.data;
//   } catch (err) {
//     throw new Error(err?.response?.data?.message || 'Không thể cập nhật đơn hàng');
//   }
// };

// export const deleteOrder = async (id) => {
//   try {
//     const res = await axios.delete(`${API_URL}/${id}`);
//     return res.data;
//   } catch (err) {
//     throw new Error(err?.response?.data?.message || 'Không thể xóa đơn hàng');
//   }
// };

import axios from "axios";

const API_URL = "http://localhost:3001/orders";

/**
 * Chuẩn hóa payload theo đúng DTO backend (CreateOrderDto)
 * - Đảm bảo paymentMethod là 'COD' hoặc 'MOMO' (chữ hoa)
 * - Ép kiểu số cho totalAmount, productId, quantity
 */
const normalizeOrderPayload = (payload = {}) => ({
  customerName: payload.customerName?.trim() || "",
  customerPhone: payload.customerPhone?.trim() || "",
  customerAddress: payload.customerAddress?.trim() || "",
  customerEmail: payload.customerEmail?.trim() || undefined,
  paymentMethod: payload.paymentMethod?.toUpperCase?.() || "COD",
  totalAmount: Number(payload.totalAmount) || 0,
  items: Array.isArray(payload.items)
    ? payload.items.map((i) => ({
        productId: Number(i.productId || i.id),
        quantity: Number(i.quantity) || 1,
      }))
    : [],
});

export const listOrders = async () => {
  try {
    const res = await axios.get(API_URL);
    return res.data;
  } catch (err) {
    console.error("[listOrders] Error:", err?.response?.data || err.message);
    throw new Error(err?.response?.data?.message || "Không thể tải danh sách đơn hàng");
  }
};

export const createOrder = async (payload) => {
  try {
    const body = normalizeOrderPayload(payload);
    const res = await axios.post(API_URL, body);
    return res.data;
  } catch (err) {
    console.error("[createOrder] Error:", err?.response?.data || err.message);
    throw new Error(err?.response?.data?.message || "Không thể tạo đơn hàng");
  }
};

export const createMomoPayment = async (payload) => {
  try {
    const body = normalizeOrderPayload(payload);
    const res = await axios.post(`${API_URL}/momo`, body);
    if (process.env.NODE_ENV !== "production") {
      console.log("[MoMo][create] request:", body);
      console.log("[MoMo][create] response:", res.data);
    }
    return res.data;
  } catch (err) {
    console.error("[createMomoPayment] Error:", err?.response?.data || err.message);
    throw new Error(err?.response?.data?.message || "Không thể khởi tạo thanh toán MoMo");
  }
};

export const finalizeOrder = async (payload) => {
  try {
    const body = normalizeOrderPayload(payload);
    const res = await axios.post(`${API_URL}/finalize`, body);
    return res.data;
  } catch (err) {
    console.error("[finalizeOrder] Error:", err?.response?.data || err.message);
    throw new Error(err?.response?.data?.message || "Không thể hoàn tất đơn hàng sau thanh toán");
  }
};

export const updateOrder = async (id, payload) => {
  try {
    const res = await axios.patch(`${API_URL}/${id}`, payload);
    return res.data;
  } catch (err) {
    console.error("[updateOrder] Error:", err?.response?.data || err.message);
    throw new Error(err?.response?.data?.message || "Không thể cập nhật đơn hàng");
  }
};

export const deleteOrder = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/${id}`);
    return res.data;
  } catch (err) {
    console.error("[deleteOrder] Error:", err?.response?.data || err.message);
    throw new Error(err?.response?.data?.message || "Không thể xóa đơn hàng");
  }
};

export const updateOrderStatus = async (id, status) => {
  try {
    const res = await axios.patch(`${API_URL}/${id}/status`, { status });
    return res.data;
  } catch (err) {
    console.error("[updateOrderStatus] Error:", err?.response?.data || err.message);
    throw new Error(err?.response?.data?.message || "Không thể cập nhật trạng thái đơn hàng");
  }
};
