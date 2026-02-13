import api from './api';

interface CreateProductData {
  title: string;
  description: string;
  price: string;
  category: string;
  condition: string;
  images: File[];
}

interface ProductResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    title: string;
    description: string;
    price: number;
    images: string[];
    category: string;
    condition: string;
    seller: { _id: string; name: string };
    createdAt: string;
  };
}

interface CategoriesResponse {
  success: boolean;
  message: string;
  data: string[];
}

export const productService = {
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

  getCategories: () => api.get<CategoriesResponse>('/products/categories'),
};
