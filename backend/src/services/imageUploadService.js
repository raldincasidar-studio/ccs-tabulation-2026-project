import sharp from 'sharp';
import cloudinary from '../config/cloudinary.js';

const MAX_IMAGE_BYTES = 1024 * 1024;
const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const validateImageUpload = async (file) => {
  if (!file) {
    throw new Error('No image file was uploaded.');
  }

  if (!file.buffer || file.buffer.length === 0) {
    throw new Error('The uploaded file is empty.');
  }

  const mimeType = file.mimetype || '';
  if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
    throw new Error('Unsupported file type. Only JPEG, PNG, and WebP images are allowed.');
  }

  try {
    const metadata = await sharp(file.buffer).metadata();
    if (!metadata.width || !metadata.height || !metadata.format) {
      throw new Error('The uploaded file is not a valid image.');
    }

    if (!['jpeg', 'png', 'webp'].includes(metadata.format)) {
      throw new Error('Unsupported image format. Only JPEG, PNG, and WebP files are accepted.');
    }

    return metadata;
  } catch (error) {
    throw new Error('The uploaded file is corrupted or not a valid image.');
  }
};

export const compressImageForCloudinary = async (buffer, originalName = 'upload') => {
  let currentBuffer = buffer;
  let quality = 88;
  let width = null;
  let currentSize = currentBuffer.length;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const image = sharp(currentBuffer, { failOn: 'error' });
    const metadata = await image.metadata();

    if (metadata.width && metadata.width > 1600) {
      width = 1600;
    }

    const transform = sharp(currentBuffer, { failOn: 'error' }).rotate();
    if (width) {
      transform.resize({ width, fit: 'inside', withoutEnlargement: true });
    }

    const optimized = await transform
      .jpeg({ quality, mozjpeg: true, progressive: true })
      .toBuffer();

    currentBuffer = optimized;
    currentSize = optimized.length;

    if (currentSize <= MAX_IMAGE_BYTES) {
      return {
        buffer: optimized,
        sizeBytes: currentSize,
        filename: originalName,
      };
    }

    quality = Math.max(30, quality - 12);
    width = width ? Math.max(900, Math.floor(width * 0.85)) : null;
  }

  throw new Error('The image could not be reduced to 1 MB or less while preserving valid image data.');
};

export const uploadImageToCloudinary = async (buffer, options = {}) => {
  const { folder = 'ccs-tabulation', publicId, resourceType = 'image' } = options;

  if (!process.env.CLOUDINARY_URL) {
    throw new Error('Cloudinary is not configured. Add CLOUDINARY_URL to the backend .env file.');
  }

  const result = await cloudinary.uploader.upload(buffer, {
    folder,
    resource_type: resourceType,
    public_id: publicId,
    transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
  });

  return {
    secureUrl: result.secure_url,
    publicId: result.public_id,
    bytes: result.bytes,
  };
};

export const deleteCloudinaryAsset = async (publicId) => {
  if (!publicId) return null;

  if (!process.env.CLOUDINARY_URL) {
    return null;
  }

  const result = await cloudinary.uploader.destroy(publicId);
  return result;
};

export const processUploadedImage = async (file, options = {}) => {
  const { folder = 'ccs-tabulation', publicId } = options;

  await validateImageUpload(file);

  const compressed = await compressImageForCloudinary(file.buffer, file.originalname || 'upload');
  if (compressed.sizeBytes > MAX_IMAGE_BYTES) {
    throw new Error('Final compressed image size is still above 1 MB and cannot be uploaded.');
  }

  return uploadImageToCloudinary(compressed.buffer, {
    folder,
    publicId,
    resourceType: 'image',
  });
};
