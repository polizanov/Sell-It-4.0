import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { Navigation } from './components/layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { VerifiedRoute } from './components/auth/VerifiedRoute';
import { VerificationBanner } from './components/common/VerificationBanner';
import { useAuthStore } from './store/authStore';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import MyProfile from './pages/MyProfile';
import CreateProduct from './pages/CreateProduct';
import AllProducts from './pages/AllProducts';
import ProductDetail from './pages/ProductDetail';
import UserProfile from './pages/UserProfile';
import MyFavourites from './pages/MyFavourites';
import EditProduct from './pages/EditProduct';

function App() {
  useEffect(() => {
    useAuthStore.getState().initializeAuth();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark-bg text-white">
        <Navigation />
        <VerificationBanner />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/products" element={<AllProducts />} />
          <Route
            path="/products/:id/edit"
            element={
              <VerifiedRoute>
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
              <VerifiedRoute>
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
      </div>
    </BrowserRouter>
  );
}

export default App;
