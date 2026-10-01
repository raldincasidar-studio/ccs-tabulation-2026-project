import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { authenticateToken } from './authRoutes.js';
import { Contestant } from '../models/Contestant.js';
import { deleteCloudinaryAsset, processUploadedImage } from '../services/imageUploadService.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Unsupported file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
    return cb(null, true);
  },
});

const resolveContestantId = (req) => {
  if (req.body?.contestantId) return req.body.contestantId;
  if (req.body?.contestant_id) return req.body.contestant_id;
  if (req.params?.id) return req.params.id;
  return null;
};

const handleSaveAfterUpload = async (contestantId, imageUrl, cloudinaryPublicId) => {
  if (!contestantId) return null;

  if (!mongoose.Types.ObjectId.isValid(contestantId)) {
    throw new Error('Invalid contestant ID format.');
  }

  const contestant = await Contestant.findById(contestantId);
  if (!contestant) {
    throw new Error('Contestant not found.');
  }

  const previousPublicId = contestant.cloudinaryPublicId || '';
  contestant.image = imageUrl || contestant.image || '';
  contestant.cloudinaryPublicId = cloudinaryPublicId || previousPublicId || '';

  await contestant.save();

  if (previousPublicId && previousPublicId !== cloudinaryPublicId) {
    await deleteCloudinaryAsset(previousPublicId);
  }

  return contestant;
};

const uploadContestantImage = async (req, res) => {
  try {
    const contestantId = resolveContestantId(req);

    if (!req.file) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'An image file is required.', [
        { field: 'image', issue: 'No file uploaded' },
      ]);
    }

    const uploadResult = await processUploadedImage(req.file, {
      folder: 'ccs-tabulation/contestants',
      publicId: `contestant-${Date.now()}`,
    });

    try {
      if (contestantId) {
        await handleSaveAfterUpload(contestantId, uploadResult.secureUrl, uploadResult.publicId);
      }
    } catch (databaseError) {
      await deleteCloudinaryAsset(uploadResult.publicId);
      throw databaseError;
    }

    return sendSuccess(
      res,
      {
        imageUrl: uploadResult.secureUrl,
        cloudinaryPublicId: uploadResult.publicId,
        sizeBytes: uploadResult.bytes,
      },
      'Contestant image uploaded successfully',
      200,
    );
  } catch (error) {
    if (error?.message?.includes('Unsupported file type') || error?.message?.includes('not a valid image') || error?.message?.includes('No image file')) {
      return sendError(res, 400, 'VALIDATION_ERROR', error.message, []);
    }

    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', error.message || 'Image upload failed', []);
  }
};

router.post('/uploads/contestant-image', authenticateToken, upload.single('image'), uploadContestantImage);

router.post('/contestants/:id/image', authenticateToken, upload.single('image'), async (req, res) => {
  req.body = { ...req.body, contestantId: req.params.id };
  return uploadContestantImage(req, res);
});

export default router;
