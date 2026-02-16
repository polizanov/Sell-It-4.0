import multer from 'multer';
import cloudinary from '../config/cloudinary';
import { AppError } from './errorHandler';

const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    const mimeTypeValid = ALLOWED_MIME_TYPES.includes(file.mimetype);
    const extensionValid = ALLOWED_EXTENSIONS.some(ext =>
      file.originalname.toLowerCase().endsWith(ext)
    );

    if (mimeTypeValid && extensionValid) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only JPEG, PNG, and WebP images are allowed', 400) as unknown as Error);
    }
  },
});

// Validate image file signature (magic numbers) for common image types
export const validateImageBuffer = (buffer: Buffer): boolean => {
  if (buffer.length < 12) return false;

  // JPEG signature: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return true;
  }

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
      buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A) {
    return true;
  }

  // WebP signature: 52 49 46 46 ... 57 45 42 50
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return true;
  }

  return false;
};

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string,
): Promise<string> => {
  // Validate file signature before uploading
  if (!validateImageBuffer(fileBuffer)) {
    const firstBytes = fileBuffer.slice(0, 12).toString('hex');
    console.error('Image validation failed. First 12 bytes:', firstBytes);
    throw new AppError('Invalid image file. File type does not match its content', 400);
  }

  // In test mode, return a placeholder URL instead of uploading to Cloudinary
  if (process.env.NODE_ENV === 'test') {
    return `https://res.cloudinary.com/test/image/upload/sellit/${folder}/test-image.jpg`;
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({
        folder: `sellit/${folder}`,
        transformation: [
          {
            width: 800,
            height: 800,
            crop: 'fill',
            quality: 'auto',
          }
        ]
      }, (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new AppError(`Image upload failed: ${error.message}`, 500));
        } else if (!result) {
          reject(new AppError('Image upload failed: No result returned', 500));
        } else {
          resolve(result.secure_url);
        }
      })
      .end(fileBuffer);
  });
};
