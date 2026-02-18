import { IProduct } from '../models/Product';

export interface ProductResponse {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  images: string[];
  seller: {
    _id: string;
    id: string;
    name: string;
    username: string;
    email: string;
    phone?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export const mapProductToResponse = (product: IProduct): ProductResponse => {
  // Type assertion: seller is populated with user data
  const seller = product.seller as any;

  return {
    id: product._id.toString(),
    title: product.title,
    description: product.description,
    price: product.price,
    condition: product.condition,
    category: product.category,
    images: product.images,
    seller: {
      _id: seller._id,
      id: seller._id.toString(),
      name: seller.name,
      username: seller.username,
      email: seller.email,
      phone: seller.phone,
    },
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};
