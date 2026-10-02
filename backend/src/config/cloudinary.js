import { v2 as cloudinary } from 'cloudinary';

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
}

export const isCloudinaryConfigured = () => Boolean(process.env.CLOUDINARY_URL);
export default cloudinary;
