import express from 'express';
import { authenticateToken } from './authRoutes.js';
import { requireAdmin } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validation.js';
import { Category, Configuration, Contestant, ContestantGroup, JudgeScore, User } from '../models/index.js';
import { buildScoringDashboard } from '../services/dashboardService.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();
router.use('/dashboard', authenticateToken, requireAdmin);

// A single authenticated, non-cacheable snapshot. Bulk queries avoid a query
// per judge/contestant/rubric, and work across serverless instances as well.
router.get('/dashboard/scoring', async (req, res) => {
  res.set('Cache-Control', 'private, no-store');
  try {
    const [configuration, categories, groups, contestants, judges] = await Promise.all([
      Configuration.findOne().select('eventTitle isConfigurationMode liveStatus').lean(),
      Category.find().select('name description weight isActive rubrics assignedJudges').sort({ createdAt: 1, _id: 1 }).lean(),
      ContestantGroup.find().select('name categoriesIncluded').sort({ name: 1, _id: 1 }).lean(),
      Contestant.find({ isActive: { $ne: false } }).select('name label image group isActive').sort({ label: 1, name: 1, _id: 1 }).lean(),
      User.find({ userType: 'Judge', isActive: true }).select('username firstName lastName userType isActive').sort({ firstName: 1, lastName: 1, _id: 1 }).lean(),
    ]);

    const scores = await JudgeScore.find({
      categoryId: { $in: categories.map((category) => category._id) },
      contestantId: { $in: contestants.map((contestant) => contestant._id) },
      judgeId: { $in: judges.map((judge) => judge._id) },
    }).select('judgeId categoryId contestantId rubricsScore createdAt updatedAt').lean();

    return sendSuccess(res, buildScoringDashboard({ configuration, categories, groups, contestants, judges, scores }),
      'Live scoring dashboard retrieved successfully');
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to retrieve live scoring dashboard', []);
  }
});

router.patch('/dashboard/categories/:categoryId/judges', validateObjectId('categoryId'), async (req, res) => {
  try {
    if (!Object.hasOwn(req.body ?? {}, 'assignedJudges')) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'assignedJudges is required; use null for all active judges or an array of judge IDs', []);
    }
    const { assignedJudges } = req.body;
    if (assignedJudges !== null && (!Array.isArray(assignedJudges) ||
      assignedJudges.some((id) => typeof id !== 'string' || !/^[a-fA-F0-9]{24}$/.test(id)))) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'assignedJudges must be null or an array of valid judge IDs', []);
    }

    const normalizedIds = assignedJudges?.map((id) => id.toLowerCase()) ?? null;
    if (normalizedIds && new Set(normalizedIds).size !== normalizedIds.length) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'assignedJudges cannot contain duplicate IDs', []);
    }

    const category = await Category.findById(req.params.categoryId);
    if (!category) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Category not found', []);
    }
    if (normalizedIds?.length) {
      const validCount = await User.countDocuments({ _id: { $in: normalizedIds }, userType: 'Judge', isActive: true });
      if (validCount !== normalizedIds.length) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'Every assigned judge must be an existing active Judge', []);
      }
    }

    category.assignedJudges = normalizedIds;
    await category.save();
    return sendSuccess(res, {
      categoryId: category._id,
      assignedJudges: category.assignedJudges,
      assignmentMode: category.assignedJudges == null ? 'all_active' : 'specific',
    }, 'Category judge assignments updated successfully');
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to update category judge assignments', []);
  }
});

export default router;
