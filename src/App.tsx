import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { OnboardingPage } from '@/pages/auth/OnboardingPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import ProductsPage from '@/pages/dashboard/ProductsPage';
import { OrdersPage } from '@/pages/dashboard/OrdersPage';
import { SettingsPage } from '@/pages/dashboard/SettingsPage';
import { AddProductPage } from '@/pages/dashboard/AddProductPage';
import { AddArtifactPage } from '@/pages/dashboard/AddArtifactPage';
import { EditProductPage } from '@/pages/dashboard/EditProductPage';
import { AnalyticsPage } from '@/pages/dashboard/AnalyticsPage';
import { EarningsPage } from '@/pages/dashboard/EarningsPage';
import { SubscribeProPage } from '@/pages/dashboard/SubscribeProPage';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { CreatorProfilePage } from '@/pages/profile/CreatorProfilePage';
import { ProductCheckoutPage } from '@/pages/checkout/ProductCheckoutPage';
import { OrderSuccessPage } from '@/pages/checkout/OrderSuccessPage';
import { InvoicePage } from '@/pages/purchases/InvoicePage';
import { MyPurchasesPage } from '@/pages/purchases/MyPurchasesPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ButtonPreviewPage } from '@/pages/ButtonPreviewPage';
import { MembershipManagerPage } from '@/pages/dashboard/MembershipManagerPage';
import { DismissSupabasePopup } from '@/components/ui/dismiss-popup';

function App() {
  return (
    <Router>
      <DismissSupabasePopup />
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Public Routes */}
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="buttons" element={<ButtonPreviewPage />} />
          <Route path="u/:username" element={<CreatorProfilePage />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="onboarding" element={<OnboardingPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="dashboard/analytics" element={<AnalyticsPage />} />
            <Route path="dashboard/earnings" element={<EarningsPage />} />
            <Route path="dashboard/products" element={<ProductsPage />} />
            <Route path="dashboard/products/add" element={<AddProductPage />} />
            <Route path="dashboard/artifacts/add" element={<AddArtifactPage />} />
            <Route path="dashboard/products/:id" element={<EditProductPage />} />
            <Route path="dashboard/orders" element={<OrdersPage />} />
            <Route path="dashboard/settings" element={<SettingsPage />} />
            <Route path="dashboard/memberships" element={<MembershipManagerPage />} />
            <Route path="subscribe-pro" element={<SubscribeProPage />} />
            <Route path="invoice/:id" element={<InvoicePage />} />
            <Route path="purchases" element={<MyPurchasesPage />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="admin" element={<AdminDashboard />} />
          </Route>

          {/* Checkout Routes */}
          <Route path="checkout/:productId" element={<ProductCheckoutPage />} />
          <Route path="success" element={<OrderSuccessPage />} />

          {/* Fallback Routes */}
          <Route path="404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;