import { useState, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Doughnut, Pie } from "react-chartjs-2";

// Register chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [period, setPeriod] = useState("month");

  // ================================
  // FAKE DATA
  // ================================
  const fakeOverview = {
    totalOrders: 1520,
    pendingOrders: 87,
    totalRevenue: 321000000,
    totalUsers: 12800,
    totalProducts: 650,
  };

  const fakeRevenue = {
    day: [
      { period: "01", revenue: 12000000, count: 32 },
      { period: "02", revenue: 14000000, count: 41 },
      { period: "03", revenue: 9000000, count: 22 },
      { period: "04", revenue: 18000000, count: 55 },
      { period: "05", revenue: 22000000, count: 61 },
    ],
    month: [
      { period: "01/24", revenue: 38000000, count: 310 },
      { period: "02/24", revenue: 42000000, count: 288 },
      { period: "03/24", revenue: 45000000, count: 322 },
      { period: "04/24", revenue: 60000000, count: 410 },
      { period: "05/24", revenue: 82000000, count: 581 },
      { period: "06/24", revenue: 72000000, count: 441 },
    ],
    year: [
      { period: "2020", revenue: 110000000, count: 1320 },
      { period: "2021", revenue: 160000000, count: 1550 },
      { period: "2022", revenue: 210000000, count: 1870 },
      { period: "2023", revenue: 260000000, count: 2290 },
      { period: "2024", revenue: 320000000, count: 2510 },
    ],
  };

  const fakeUserStats = {
    labels: ["Nam", "Nữ", "Khác"],
    count: [7500, 5000, 300],
  };

  const fakeOrderStatus = {
    labels: ["Chờ xử lý", "Đang giao", "Hoàn thành", "Hủy"],
    count: [87, 122, 1280, 31],
  };

  const fakeProductStats = {
    labels: ["Còn hàng", "Hết hàng", "Sắp hết"],
    count: [480, 120, 50],
  };

  const fakeCommentStats = {
    labels: ["Tốt", "Trung bình", "Xấu"],
    count: [820, 140, 41],
  };

  const fakeBlogStats = {
    labels: ["Tin tức", "Hướng dẫn", "Khuyến mãi"],
    count: [35, 22, 14],
  };

  // ================================
  // BIỂU ĐỒ DOANH THU
  // ================================
  const revenueChart = useMemo(() => {
    const data = fakeRevenue[period];
    return {
      labels: data.map((r) => r.period),
      datasets: [
        {
          label: "Doanh thu (VNĐ)",
          data: data.map((r) => r.revenue),
          borderColor: "#4bc0c0",
          backgroundColor: "rgba(75,192,192,0.2)",
          tension: 0.4,
        },
        {
          label: "Số đơn",
          data: data.map((r) => r.count),
          borderColor: "#ff6384",
          backgroundColor: "rgba(255,99,132,0.2)",
          yAxisID: "y1",
          tension: 0.4,
        },
      ],
    };
  }, [period]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } },
  };

  const revenueChartOptions = {
    ...chartOptions,
    scales: {
      y: { type: "linear", position: "left", title: { display: true, text: "Doanh thu" } },
      y1: { type: "linear", position: "right", grid: { drawOnChartArea: false } },
    },
  };

  // ================================
  // UI
  // ================================
  return (
    <div className="container-fluid py-4">

      <h3 className="fw-bold mb-4">
        <i className="fas fa-chart-line text-primary me-2"></i>
        Dashboard thống kê
      </h3>

      {/* OVERVIEW */}
      <div className="row g-4 mb-4">
        {[
          { icon: "fa-shopping-cart", color: "primary", label: "Tổng đơn hàng", value: fakeOverview.totalOrders },
          { icon: "fa-money-bill-wave", color: "success", label: "Tổng doanh thu", value: fakeOverview.totalRevenue.toLocaleString() + " đ" },
          { icon: "fa-users", color: "info", label: "Người dùng", value: fakeOverview.totalUsers },
          { icon: "fa-box", color: "warning", label: "Sản phẩm", value: fakeOverview.totalProducts },
        ].map((item, i) => (
          <div className="col-md-3" key={i}>
            <div className={`card text-center bg-${item.color} bg-opacity-10 border-0 shadow-sm`}>
              <div className="card-body">
                <i className={`fas ${item.icon} text-${item.color} fs-2 mb-2`} />
                <h5 className="fw-bold">{item.value}</h5>
                <p className="text-muted">{item.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* BIỂU ĐỒ DOANH THU */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-primary text-white d-flex justify-content-between">
          <h5 className="mb-0"><i className="fas fa-chart-line me-2"></i>Doanh thu</h5>
          <div className="btn-group btn-group-sm">
            {[
              { key: "day", label: "Ngày" },
              { key: "month", label: "Tháng" },
              { key: "year", label: "Năm" },
            ].map(btn => (
              <button
                key={btn.key}
                className={`btn ${period === btn.key ? "btn-light" : "btn-outline-light"}`}
                onClick={() => setPeriod(btn.key)}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card-body">
          <div style={{ height: 380 }}>
            <Line data={revenueChart} options={revenueChartOptions} />
          </div>
        </div>
      </div>

      {/* 3 BIỂU ĐỒ DÃY 1 */}
      <div className="row g-4 mb-4">
        <ChartCard title="Thống kê người dùng">
          <Pie
            options={chartOptions}
            data={{
              labels: fakeUserStats.labels,
              datasets: [{ data: fakeUserStats.count, backgroundColor: ["#36a2eb", "#ff6384", "#ffcd56"] }],
            }}
          />
        </ChartCard>

        <ChartCard title="Trạng thái đơn hàng">
          <Doughnut
            options={chartOptions}
            data={{
              labels: fakeOrderStatus.labels,
              datasets: [{ data: fakeOrderStatus.count, backgroundColor: ["#ffcd56", "#36a2eb", "#4bc0c0", "#ff6384"] }],
            }}
          />
        </ChartCard>

        <ChartCard title="Tình trạng sản phẩm">
          <Pie
            options={chartOptions}
            data={{
              labels: fakeProductStats.labels,
              datasets: [{ data: fakeProductStats.count, backgroundColor: ["#4bc0c0", "#ff6384", "#ffcd56"] }],
            }}
          />
        </ChartCard>
      </div>

      {/* 3 BIỂU ĐỒ DÃY 2 */}
      <div className="row g-4 mb-4">
        <ChartCard title="Bình luận">
          <Bar
            options={chartOptions}
            data={{
              labels: fakeCommentStats.labels,
              datasets: [{ label: "Số lượng", data: fakeCommentStats.count, backgroundColor: ["#36a2eb", "#ffcd56", "#ff6384"] }],
            }}
          />
        </ChartCard>

        <ChartCard title="Danh mục blog">
          <Pie
            options={chartOptions}
            data={{
              labels: fakeBlogStats.labels,
              datasets: [{ data: fakeBlogStats.count, backgroundColor: ["#ff6384", "#36a2eb", "#4bc0c0"] }],
            }}
          />
        </ChartCard>
      </div>

    </div>
  );
}

// ===============================
// COMPONENT CHUNG
// ===============================
function ChartCard({ title, children }) {
  return (
    <div className="col-md-4">
      <div className="card shadow-sm border-0 h-100">
        <div className="card-header bg-light fw-bold">{title}</div>
        <div className="card-body">
          <div style={{ height: 260 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
