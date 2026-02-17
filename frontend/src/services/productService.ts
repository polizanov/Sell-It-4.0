import api from './api';
import type { Product, PaginationInfo, ProductListParams, UserProfileInfo } from '../types';

interface CreateProductData {
  title: string;
  description: string;
  price: string;
  category: string;
  condition: string;
  images: File[];
}

interface UpdateProductData {
  title: string;
  description: string;
  price: string;
  category: string;
  condition: string;
  existingImages: string[];
  newImages: File[];
}

interface ProductResponseData {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  condition: string;
  seller: { _id: string; name: string; username: string };
  createdAt: string;
}

interface ProductResponse {
  success: boolean;
  message: string;
  data?: ProductResponseData;
}

interface ProductListResponseData {
  products: ProductResponseData[];
  pagination: PaginationInfo;
  conditionCounts: Record<string, number>;
}

interface ProductListResponse {
  success: boolean;
  message: string;
  data: ProductListResponseData;
}

interface CategoriesResponse {
  success: boolean;
  message: string;
  data: string[];
}

interface UserProductsResponseData {
  user: UserProfileInfo;
  products: ProductResponseData[];
  pagination: PaginationInfo;
}

interface UserProductsResponse {
  success: boolean;
  message: string;
  data: UserProductsResponseData;
}

/** Map backend seller object to flat frontend Product type */
function mapProductResponse(data: ProductResponseData): Product {
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    price: data.price,
    images: data.images,
    category: data.category,
    condition: data.condition as Product['condition'],
    sellerId: data.seller._id,
    sellerName: data.seller.name,
    sellerUsername: data.seller.username,
    createdAt: data.createdAt,
  };
}

export const productService = {
  getAll: async (
    params: ProductListParams = {},
  ): Promise<{ products: Product[]; pagination: PaginationInfo; conditionCounts: Record<string, number> }> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.category) searchParams.set('category', params.category);
    if (params.search) searchParams.set('search', params.search);
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.condition && params.condition.length > 0) {
      searchParams.set('condition', params.condition.join(','));
    }

    const query = searchParams.toString();
    const url = `/products${query ? `?${query}` : ''}`;
    const res = await api.get<ProductListResponse>(url);
    return {
      products: res.data.data.products.map(mapProductResponse),
      pagination: res.data.data.pagination,
      conditionCounts: res.data.data.conditionCounts,
    };
  },

  create: (data: CreateProductData) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('price', data.price);
    formData.append('category', data.category);
    formData.append('condition', data.condition);
    data.images.forEach((image) => formData.append('images', image));
    return api.post<ProductResponse>('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getById: async (id: string): Promise<Product> => {
    const res = await api.get<ProductResponse>(`/products/${id}`);
    return mapProductResponse(res.data.data!);
  },

  getCategories: () => api.get<CategoriesResponse>('/products/categories'),

  update: (id: string, data: UpdateProductData) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('price', data.price);
    formData.append('category', data.category);
    formData.append('condition', data.condition);
    formData.append('existingImages', JSON.stringify(data.existingImages));
    data.newImages.forEach((image) => formData.append('images', image));
    return api.put<ProductResponse>(`/products/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  delete: (id: string) => api.delete<ProductResponse>(`/products/${id}`),

  getByUsername: async (
    username: string,
    params: { page?: number; limit?: number } = {},
  ): Promise<{ user: UserProfileInfo; products: Product[]; pagination: PaginationInfo }> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));

    const query = searchParams.toString();
    const url = `/products/user/${username}${query ? `?${query}` : ''}`;
    const res = await api.get<UserProductsResponse>(url);
    return {
      user: res.data.data.user,
      products: res.data.data.products.map(mapProductResponse),
      pagination: res.data.data.pagination,
    };
  },
};
