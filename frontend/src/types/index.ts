export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  isVerified?: boolean;
  phone?: string;
  isPhoneVerified?: boolean;
  profilePhoto?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    name: string;
    username: string;
    email: string;
    isVerified?: boolean;
    phone?: string;
    isPhoneVerified?: boolean;
    profilePhoto?: string;
    token?: string;
  };
}

export interface ApiError {
  success: false;
  message: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  sellerId: string;
  sellerName: string;
  sellerUsername: string;
  sellerPhone?: string;
  createdAt: string;
}

export interface UserProfileInfo {
  name: string;
  username: string;
  memberSince: string;
  profilePhoto?: string;
}

export interface NavLink {
  to: string;
  label: string;
  requiresAuth?: boolean;
  hideWhenAuth?: boolean;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  limit: number;
  hasMore: boolean;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: 'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'price_asc' | 'price_desc';
  condition?: string[];
}
