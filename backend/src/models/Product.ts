import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  seller: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0.01, 'Price must be at least 0.01'],
    },
    images: {
      type: [String],
      required: [true, 'At least one image is required'],
      validate: {
        validator: (v: string[]) => v.length >= 1 && v.length <= 5,
        message: 'Must have between 1 and 5 images',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [50, 'Category cannot exceed 50 characters'],
    },
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: {
        values: ['New', 'Like New', 'Good', 'Fair'],
        message: 'Condition must be one of: New, Like New, Good, Fair',
      },
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
    },
  },
  {
    timestamps: true,
  },
);

productSchema.index({ createdAt: -1 });
productSchema.index({ category: 1, createdAt: -1 });

export const Product = mongoose.model<IProduct>('Product', productSchema);
