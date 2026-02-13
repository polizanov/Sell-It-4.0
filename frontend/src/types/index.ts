export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  isVerified?: boolean;
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
  createdAt: string;
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
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
}
