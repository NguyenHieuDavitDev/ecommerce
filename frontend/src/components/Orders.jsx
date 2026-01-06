import { useEffect, useState, useMemo } from "react";
import { listOrders, createOrder, updateOrder, deleteOrder, updateOrderStatus } from "../api/orders";
import { listProducts } from "../api/products";

export default function OrderCRUD() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [items, setItems] = useState([{ productId: "", quantity: 1, productName: "" }]);
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 4;
  const totalPages = Math.ceil(filteredOrders.length / pageSize);

  const calculatedTotal = useMemo(() => {
    return items.reduce((sum, it) => {
      const product = products.find((p) => p.id === Number(it.productId));
      if (!product) return sum;
      const price = Number(product.price) || 0;
      const qty = Number(it.quantity) || 0;
      return sum + price * qty;
    }, 0);
  }, [items, products]);

  const canSubmit = useMemo(() => {
    if (!customerName || !customerPhone || !customerAddress) return false;
    if (!items.length) return false;
    if (calculatedTotal <= 0) return false;
    return items.every((it) => Number(it.productId) > 0 && Number(it.quantity) > 0);
  }, [customerName, customerPhone, customerAddress, items, calculatedTotal]);

  // ==========================
  // FETCH ORDERS & PRODUCTS
  // ==========================
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await listOrders();
      setOrders(data);
      setFilteredOrders(data);
    } catch (err) {
      showAlert(err?.response?.data?.message || err.message || "Lỗi tải đơn hàng", "danger");
    }
    setLoading(false);
  };

  const fetchProducts = async () => {
    try {
      const data = await listProducts();
      setProducts(data);
    } catch (err) {
      showAlert(err?.response?.data?.message || err.message || "Lỗi tải sản phẩm", "danger");
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  // ==========================
  // ALERT
  // ==========================
  const showAlert = (message, type = "info") => setAlert({ message, type });
  const closeAlert = () => setAlert(null);

  // ==========================
  // SEARCH
  // ==========================
  const handleSearch = (keyword) => {
    const k = keyword.toLowerCase();
    const filtered = orders.filter(
      (o) =>
        o.customerName.toLowerCase().includes(k) ||
        o.customerPhone.includes(k) ||
        o.id.toString().includes(k)
    );
    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  // ==========================
  // ORDER ITEM HANDLERS
  // ==========================
  const handleAddItem = () => setItems((prev) => [...prev, { productId: "", quantity: 1, productName: "" }]);
  const handleRemoveItem = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleChangeItem = (idx, field, value) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const updated = { ...it };
        if (field === "productId") {
          const numericId = Number(value);
          const match =
            products.find((p) => p.id === numericId) ||
            products.find((p) => p.name.toLowerCase() === String(value).toLowerCase());
          updated.productId = match ? match.id : numericId;
          updated.productName = match ? match.name : "";
        } else if (field === "quantity") {
          updated.quantity = Math.max(1, Number(value) || 1);
        }
        return updated;
      })
    );
  };

  const handleSearchItem = (keyword) => {
    const rawKeyword = keyword || "";
    const normalized = rawKeyword.toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(normalized) || String(p.id).includes(rawKeyword))
      .slice(0, 5);
  };

  const resetForm = () => {
    setEditId(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setCustomerEmail("");
    setPaymentMethod("COD");
    setItems([{ productId: "", quantity: 1, productName: "" }]);
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const payload = {
        customerName,
        customerPhone,
        customerAddress,
        customerEmail,
        paymentMethod,
        items: items.map((it) => ({ productId: Number(it.productId), quantity: Number(it.quantity) })),
        totalAmount: calculatedTotal,
      };
      if (editId) {
        await updateOrder(editId, payload);
        showAlert("Cập nhật đơn hàng thành công!", "success");
      } else {
        const created = await createOrder(payload);
        showAlert(
          paymentMethod === "MOMO" ? "Đã tạo đơn hàng và chờ thanh toán MoMo" : "Tạo đơn hàng COD thành công!",
          "success"
        );
        const paymentUrl = created?.momoPaymentUrl || created?.payUrl;
        if (paymentMethod === "MOMO" && paymentUrl) window.open(paymentUrl, "_blank");
      }
      fetchOrders();
      resetForm();
    } catch (err) {
      showAlert(err?.response?.data?.message || err.message || "Thao tác thất bại", "danger");
    }
    setLoading(false);
  };

  const handleEdit = (order) => {
    setEditId(order.id);
    setCustomerName(order.customerName);
    setCustomerPhone(order.customerPhone);
    setCustomerAddress(order.customerAddress);
    setCustomerEmail(order.customerEmail || "");
    setPaymentMethod(order.paymentMethod || "COD");
    setItems(
      order.items?.map((i) => ({
        productId: i.product?.id || i.productId,
        quantity: i.quantity,
        productName: products.find((p) => p.id === (i.product?.id || i.productId))?.name || i.product?.name || "",
      })) || [{ productId: "", quantity: 1, productName: "" }]
    );
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa đơn hàng này?")) return;
    setLoading(true);
    try {
      await deleteOrder(id);
      showAlert("Xóa đơn hàng thành công!", "success");
      fetchOrders();
    } catch (err) {
      showAlert(err?.response?.data?.message || err.message || "Xóa thất bại", "danger");
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    if (!window.confirm(`Bạn có chắc muốn chuyển đơn hàng sang trạng thái "${statusBadgeMap[newStatus]?.label || newStatus}"?`)) return;
    setLoading(true);
    try {
      await updateOrderStatus(id, newStatus);
      showAlert("Cập nhật trạng thái đơn hàng thành công!", "success");
      fetchOrders();
    } catch (err) {
      showAlert(err?.response?.data?.message || err.message || "Cập nhật thất bại", "danger");
    }
    setLoading(false);
  };

  // ==========================
  // PAGINATION
  // ==========================
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const changePage = (num) => {
    if (num < 1 || num > totalPages) return;
    setCurrentPage(num);
  };

  const statusBadgeMap = {
    PENDING: { className: "bg-warning text-dark", label: "Chờ xử lý" },
    PAID: { className: "bg-success", label: "Đã thanh toán" },
    CANCELLED: { className: "bg-secondary", label: "Đã hủy" },
  };

  const paymentMethodMap = {
    COD: "COD",
    MOMO: "MoMo",
  };

  // ==========================
  // RENDER
  // ==========================
  return (
    <div className="container-fluid py-4">
      {/* ALERT */}
      {alert && (
        <div
          className={`alert alert-${alert.type} alert-dismissible fade show`}
          role="alert"
          style={{ position: "fixed", top: 20, right: 20, zIndex: 9999 }}
        >
          {alert.message}
          <button type="button" className="btn-close" onClick={closeAlert}></button>
        </div>
      )}

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold text-primary">Quản lý Đơn hàng</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <i className="fas fa-plus-circle me-2"></i> Thêm đơn hàng
        </button>
      </div>

      {/* SEARCH */}
      <div className="mb-3">
        <input
          className="form-control"
          placeholder="Tìm kiếm theo tên khách hàng, SĐT hoặc ID"
          onChange={(e) => handleSearch(e.target.value)}
        />
        <small className="text-muted">Đơn COD sẽ luôn ở trạng thái "Chờ xử lý" cho đến khi bạn cập nhật tại dashboard.</small>
      </div>

      {/* ORDERS TABLE */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
              <p className="mt-3 text-muted">Đang tải đơn hàng...</p>
            </div>
          ) : paginatedOrders.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="fas fa-receipt fs-1"></i>
              <p className="mt-2">Chưa có đơn hàng nào.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover table-striped mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Khách hàng</th>
                    <th>Tổng tiền</th>
                    <th>Phương thức</th>
                    <th>Trạng thái</th>
                    <th>Thanh toán</th>
                    <th>Ngày tạo</th>
                    <th className="text-end">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map((o) => (
                    <tr key={o.id}>
                      <td>{o.id}</td>
                      <td>
                        <div className="fw-bold">{o.customerName}</div>
                        <small className="text-muted">{o.customerPhone}</small>
                      </td>
                      <td>
                        {Number(o.totalAmount).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">{paymentMethodMap[o.paymentMethod] || o.paymentMethod || "COD"}</span>
                      </td>
                      <td>
                        {(() => {
                          const badge = statusBadgeMap[o.status] || { className: "bg-secondary", label: o.status };
                          return (
                            <div className="d-flex align-items-center gap-2">
                              <span className={`badge ${badge.className}`}>{badge.label}</span>
                              {o.status === "PENDING" && (
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-success btn-sm"
                                    onClick={() => handleUpdateStatus(o.id, "PAID")}
                                    title="Xác nhận thanh toán"
                                    disabled={loading}
                                  >
                                    <i className="fas fa-check"></i>
                                  </button>
                                  <button
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => handleUpdateStatus(o.id, "CANCELLED")}
                                    title="Hủy đơn hàng"
                                    disabled={loading}
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td>
                        {o.momoPaymentUrl ? (
                          <a className="btn btn-sm btn-outline-success" href={o.momoPaymentUrl} target="_blank" rel="noreferrer">
                            Thanh toán
                          </a>
                        ) : (
                          <span className="text-muted">
                            {o.paymentMethod === "COD" ? "Xử lý tại kho" : "Không khả dụng"}
                          </span>
                        )}
                      </td>
                      <td>{new Date(o.createdAt).toLocaleString("vi-VN")}</td>
                      <td className="text-end">
                        <button className="btn btn-outline-primary btn-sm me-2" onClick={() => handleEdit(o)}>
                          <i className="fas fa-edit me-1"></i> Sửa
                        </button>
                        <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(o.id)}>
                          <i className="fas fa-trash me-1"></i> Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center align-items-center my-2 gap-2">
            <button className="btn btn-sm btn-outline-secondary" onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}>
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`btn btn-sm ${currentPage === i + 1 ? "btn-primary" : "btn-outline-secondary"}`}
                onClick={() => changePage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button className="btn btn-sm btn-outline-secondary" onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages}>
              Next
            </button>
          </div>
        )}
      </div>

      {/* MODAL CREATE/EDIT ORDER */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">{editId ? "Cập nhật đơn hàng" : "Tạo đơn hàng mới"}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={resetForm}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="row mb-2">
                    <div className="col-md-4">
                      <input className="form-control" placeholder="Họ tên" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
                    </div>
                    <div className="col-md-4">
                      <input className="form-control" placeholder="SĐT" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required />
                    </div>
                    <div className="col-md-4">
                      <input className="form-control" placeholder="Địa chỉ" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} required />
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Email nhận hóa đơn"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <select className="form-select" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                        <option value="COD">COD - xử lý tại dashboard</option>
                        <option value="MOMO">MoMo - thanh toán ngay</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <label className="form-label mb-0">Sản phẩm</label>
                      <div className="text-muted small me-auto ms-3">
                        Tổng tạm tính: {Number(calculatedTotal).toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                      </div>
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleAddItem}>
                        Thêm dòng
                      </button>
                    </div>
                    {items.map((it, idx) => (
                      <div key={idx} className="d-flex gap-2 mb-2 align-items-center">
                        <input
                          className="form-control"
                          type="text"
                          placeholder="ID hoặc tên sản phẩm"
                          value={it.productName || it.productId}
                          onChange={(e) => handleChangeItem(idx, "productId", e.target.value)}
                          list={`products-list-${idx}`}
                          required
                        />
                        <datalist id={`products-list-${idx}`}>
                          {handleSearchItem(it.productName || String(it.productId || "")).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — {Number(p.price).toLocaleString("vi-VN")}đ
                            </option>
                          ))}
                        </datalist>

                        <input
                          className="form-control"
                          type="number"
                          min="1"
                          placeholder="Số lượng"
                          value={it.quantity}
                          onChange={(e) => handleChangeItem(idx, "quantity", e.target.value)}
                          required
                        />
                        <button type="button" className="btn btn-outline-danger" onClick={() => handleRemoveItem(idx)}>
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-3">
                    <button type="button" className="btn btn-secondary" onClick={resetForm}>
                      Hủy
                    </button>
                    <button type="submit" className="btn btn-success" disabled={!canSubmit || loading}>
                      {loading ? "Đang xử lý..." : editId ? "Cập nhật" : "Tạo"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
