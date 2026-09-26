import express from 'express';
import { authenticateToken } from './authRoutes.js';
import { Category } from '../models/Category.js';
import { ContestantGroup } from '../models/ContestantGroup.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

const buildValidationDetails = (field, issue) => [{ field, issue }];

// ─── 4.1 GET /categories ───
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await Category.find();
    return sendSuccess(res, categories, 'Categories retrieved successfully', 200);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch categories list', []);
  }
});

// ─── 4.2 POST /categories ───
router.post('/categories', authenticateToken, async (req, res) => {
  try {
    const { name, description = '', weight, isActive = true, rubrics = [] } = req.body || {};

    if (!name || !String(name).trim()) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Category name is required', buildValidationDetails('name', 'Name cannot be empty'));
    }

    if (weight === undefined || weight === null || Number(weight) < 0 || Number(weight) > 100) {
      return sendError(
        res, 400, 'VALIDATION_ERROR',
        'Category weight must be between 0 and 100',
        buildValidationDetails('weight', `Value ${weight} exceeds maximum limit of 100`),
      );
    }

    if (!Array.isArray(rubrics)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Rubrics must be an array', buildValidationDetails('rubrics', 'Expected an array of rubric entries'));
    }

    const invalidRubric = rubrics.find((r) => !r || !r.name || Number(r.maxPoints) <= 0);
    if (invalidRubric) {
      return sendError(
        res, 400, 'VALIDATION_ERROR',
        'Each rubric must include a valid name and maxPoints greater than 0',
        buildValidationDetails('rubrics', 'At least one rubric is invalid'),
      );
    }

    const newCategory = await Category.create({
      name: String(name).trim(),
      description: String(description).trim(),
      weight: Number(weight),
      isActive: Boolean(isActive),
      rubrics: rubrics.map((r) => ({ name: r.name, maxPoints: Number(r.maxPoints) })),
    });

    return sendSuccess(res, newCategory, 'Category created successfully', 201);
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, 'DUPLICATE_KEY', 'Category name already exists', []);
    }
    return sendError(res, 400, 'VALIDATION_ERROR', error.message || 'Failed to create category', []);
  }
});

// ─── 4.3 PUT /categories/:id ───
router.put('/categories/:id', authenticateToken, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', `Category ID '${req.params.id}' not found`, []);
    }

    const { name, description, weight, isActive, rubrics } = req.body || {};

    if (weight !== undefined && (Number(weight) < 0 || Number(weight) > 100)) {
      return sendError(
        res, 400, 'VALIDATION_ERROR',
        'Category weight must be between 0 and 100',
        buildValidationDetails('weight', `Value ${weight} exceeds maximum limit of 100`),
      );
    }

    if (name !== undefined && !String(name).trim()) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Category name cannot be empty', buildValidationDetails('name', 'Name cannot be empty'));
    }

    if (rubrics !== undefined && !Array.isArray(rubrics)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Rubrics must be an array', buildValidationDetails('rubrics', 'Expected an array of rubric entries'));
    }

    if (rubrics !== undefined) {
      const invalidRubric = rubrics.find((r) => !r || !r.name || Number(r.maxPoints) <= 0);
      if (invalidRubric) {
        return sendError(
          res, 400, 'VALIDATION_ERROR',
          'Each rubric must include a valid name and maxPoints greater than 0',
          buildValidationDetails('rubrics', 'At least one rubric is invalid'),
        );
      }
    }

    if (name !== undefined) category.name = String(name).trim();
    if (description !== undefined) category.description = String(description).trim();
    if (weight !== undefined) category.weight = Number(weight);
    if (isActive !== undefined) category.isActive = Boolean(isActive);
    if (rubrics !== undefined) {
      category.rubrics = rubrics.map((r) => ({
        _id: r._id || undefined, // preserve existing IDs, let Mongoose generate new ones
        name: r.name,
        maxPoints: Number(r.maxPoints),
      }));
    }

    await category.save();
    return sendSuccess(res, category, 'Category updated successfully', 200);
  } catch (error) {
    if (error.name === 'CastError') {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid ObjectId format', []);
    }
    return sendError(res, 400, 'VALIDATION_ERROR', error.message || 'Failed to update category', []);
  }
});

// ─── 4.4 DELETE /categories/:id ───
router.delete('/categories/:id', authenticateToken, async (req, res) => {
  try {
    const linkedToGroup = await ContestantGroup.findOne({
      categoriesIncluded: req.params.id,
    });

    if (linkedToGroup) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Cannot delete category linked to active contestant groups', []);
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', `Category ID '${req.params.id}' not found`, []);
    }

    return sendSuccess(res, null, 'Category deleted successfully', 200);
  } catch (error) {
    if (error.name === 'CastError') {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Invalid ObjectId format', []);
    }
    return sendError(res, 400, 'VALIDATION_ERROR', error.message || 'Failed to delete category', []);
  }
});

export default router;
