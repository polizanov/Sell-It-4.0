import multer from 'multer';
import cloudinary from '../config/cloudinary';
import { AppError } from './errorHandler';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed', 400) as unknown as Error);
    }
  },
});

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: `sellit/${folder}` }, (error, result) => {
        if (error) {
          reject(new AppError('Image upload failed', 500));
        } else {
          resolve(result!.secure_url);
        }
      })
      .end(fileBuffer);
  });
};
