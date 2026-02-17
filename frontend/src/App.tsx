import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Navigation, Footer } from './components/layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { VerifiedRoute } from './components/auth/VerifiedRoute';
import { VerificationBanner } from './components/common/VerificationBanner';
import { CreateProductFAB } from './components/common/CreateProductFAB';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { useAuthStore } from './store/authStore';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import MyProfile from './pages/MyProfile';
import ProductDetail from './pages/ProductDetail';
import UserProfile from './pages/UserProfile';
import MyFavourites from './pages/MyFavourites';
import EditProduct from './pages/EditProduct';
import CreateProduct from './pages/CreateProduct';

function App() {
  useEffect(() => {
    useAuthStore.getState().initializeAuth();
  }, []);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <div className="min-h-screen flex flex-col bg-dark-bg text-white">
          <Navigation />
          <VerificationBanner />
          <main className="flex-1">
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/products" element={<Navigate to="/" replace />} />
            <Route
              path="/products/:id/edit"
              element={
                <VerifiedRoute requirePhone>
                  <EditProduct />
                </VerifiedRoute>
              }
            />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/profile/:username" element={<UserProfile />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <MyProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-product"
              element={
                <VerifiedRoute requirePhone>
                  <CreateProduct />
                </VerifiedRoute>
              }
            />
            <Route
              path="/favourites"
              element={
                <VerifiedRoute>
                  <MyFavourites />
                </VerifiedRoute>
              }
            />
            </Routes>
          </main>
          <Footer />
          <CreateProductFAB />
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
