import mongoose, { Document, Schema } from 'mongoose';

export interface IFavourite extends Document {
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const favouriteSchema = new Schema<IFavourite>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

favouriteSchema.index({ user: 1, product: 1 }, { unique: true });
favouriteSchema.index({ user: 1, createdAt: -1 });

export const Favourite = mongoose.model<IFavourite>('Favourite', favouriteSchema);
