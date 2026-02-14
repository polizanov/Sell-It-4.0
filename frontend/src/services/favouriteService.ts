import api from './api';
import type { Product, PaginationInfo } from '../types';

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

interface FavouritesListResponse {
  success: boolean;
  message: string;
  data: {
    products: ProductResponseData[];
    pagination: PaginationInfo;
  };
}

interface FavouriteIdsResponse {
  success: boolean;
  message: string;
  data: string[];
}

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

export const favouriteService = {
  getAll: async (
    params: { page?: number; limit?: number } = {},
  ): Promise<{ products: Product[]; pagination: PaginationInfo }> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));

    const query = searchParams.toString();
    const url = `/favourites${query ? `?${query}` : ''}`;
    const res = await api.get<FavouritesListResponse>(url);
    return {
      products: res.data.data.products.map(mapProductResponse),
      pagination: res.data.data.pagination,
    };
  },

  getIds: async (): Promise<string[]> => {
    const res = await api.get<FavouriteIdsResponse>('/favourites/ids');
    return res.data.data;
  },

  add: (productId: string) => api.post(`/favourites/${productId}`),

  remove: (productId: string) => api.delete(`/favourites/${productId}`),
};
