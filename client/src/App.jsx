import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// 20 Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import OrderDetailPage from './pages/OrderDetailPage';
import InvoicePage from './pages/InvoicePage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProductAdminPage from './pages/ProductAdminPage';
import CategoryAdminPage from './pages/CategoryAdminPage';
import InventoryAdminPage from './pages/InventoryAdminPage';
import OrderAdminPage from './pages/OrderAdminPage';
import UserAdminPage from './pages/UserAdminPage';
import AuditLogAdminPage from './pages/AuditLogAdminPage';
import ReportsAdminPage from './pages/ReportsAdminPage';
import NotFoundPage from './pages/NotFoundPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public & Browsing */}
                <Route path="/" element={<Navigate to="/catalog" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />

                {/* Customer Workflow */}
                <Route
                  path="/cart"
                  element={
                    <ProtectedRoute allowedRoles={['customer']}>
                      <CartPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute allowedRoles={['customer']}>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/order-confirmed"
                  element={
                    <ProtectedRoute allowedRoles={['customer']}>
                      <OrderConfirmationPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute allowedRoles={['customer', 'admin']}>
                      <OrderHistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:id"
                  element={
                    <ProtectedRoute allowedRoles={['customer', 'admin']}>
                      <OrderDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/invoices/:id"
                  element={
                    <ProtectedRoute allowedRoles={['customer', 'admin']}>
                      <InvoicePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute allowedRoles={['customer', 'admin']}>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />

                {/* Administrator Operations */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/products"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <ProductAdminPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/categories"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <CategoryAdminPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/inventory"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <InventoryAdminPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <OrderAdminPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <UserAdminPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/audit-logs"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AuditLogAdminPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <ReportsAdminPage />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Catch-All */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
