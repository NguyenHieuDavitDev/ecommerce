import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./components/Dashboard";
import Product from "./components/Catelogy";
import Supplier from "./components/Supplier";
import ProductCRUD from "./components/ProductCRUD"; 
import Orders from "./components/Orders";
import HomePage from "./pages/HomePage";
import ProductDetail from "./pages/ProductDetail";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CheckoutSummary from "./pages/CheckoutSummary";
import CheckoutFinalize from "./pages/CheckoutFinalize";
import AccountSettings from "./pages/AccountSettings";
import ProtectedRoute from "./components/ProtectedRoute";
import UserManagement from "./components/UserManagement";
import FlashsaleCRUD from "./components/FlashsaleCRUD";
import BlogCRUD from "./components/BlogCRUD";
import BlogDetailPage from "./components/store/BlogDetailPage";
import CommentsCRUD from "./components/CommentsCRUD";
import RoleManagement from "./components/RoleManagement";


export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/checkout/summary" element={<CheckoutSummary />} />
        <Route path="/checkout/finalize" element={<CheckoutFinalize />} />

        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountSettings />
            </ProtectedRoute>
          }
        />
        <Route path="/blog/:id" element={<BlogDetailPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="categories" element={<Product />} />
          <Route path="products" element={<ProductCRUD />} /> 
          <Route path="orders" element={<Orders />} />
          <Route path="suppliers" element={<Supplier />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="roles" element={<RoleManagement />} />
          <Route path="flashsales" element={<FlashsaleCRUD />} />
          <Route path="blogs" element={<BlogCRUD />} />
          <Route path="comments" element={<CommentsCRUD />} /> 

        </Route>
      </Routes>
    </Router>
  );
}
