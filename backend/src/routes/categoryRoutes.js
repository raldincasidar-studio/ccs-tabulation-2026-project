import express from 'express';
import { authenticateToken } from './authRoutes.js';
import { sendError, sendSuccess } from '../utils/response.js';

const router = express.Router();

const mockCategories = [
  {
    _id: '65f8a123b0a9c12345678910',
    name: 'Playsuit',
    description: 'Evaluates physique, poise, and presentation in swimwear.',
    weight: 10,
    isActive: true,
    rubrics: [
      { _id: '65f8a123b0a9c12345678911', name: 'Fitness & Form', maxPoints: 40 },
      { _id: '65f8a123b0a9c12345678912', name: 'Stage Presence', maxPoints: 40 },
      { _id: '65f8a123b0a9c12345678913', name: 'Poise & Bearing', maxPoints: 20 },
    ],
  },
  {
    _id: '65f8a123b0a9c12345678920',
    name: 'Production Number',
    description: 'Measures energy, choreography, and overall performance quality.',
    weight: 15,
    isActive: true,
    rubrics: [
      { _id: '65f8a123b0a9c12345678921', name: 'Choreography', maxPoints: 35 },
      { _id: '65f8a123b0a9c12345678922', name: 'Confidence', maxPoints: 35 },
      { _id: '65f8a123b0a9c12345678923', name: 'Stage Impact', maxPoints: 30 },
    ],
  },
];

const mockContestantGroups = [
  {
    _id: '70f8a123b0a9c12345678901',
    name: 'Pageant Male',
    categoriesIncluded: ['65f8a123b0a9c12345678910'],
  },
  {
    _id: '70f8a123b0a9c12345678902',
    name: 'Pageant Female',
    categoriesIncluded: ['65f8a123b0a9c12345678920'],
  },
];

const createRubricId = (index) => `65f8a123b0a9c123456789${String(index).padStart(2, '0')}`;

const buildValidationDetails = (field, issue) => [{ field, issue }];

router.get('/categories', authenticateToken, (req, res) => {
  try {
    return sendSuccess(res, mockCategories, 'Categories retrieved successfully', 200);
  } catch (error) {
    return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch categories list', []);
  }
});

router.post('/categories', authenticateToken, (req, res) => {
  try {
    const { name, description = '', weight, isActive = true, rubrics = [] } = req.body || {};

    if (!name || !String(name).trim()) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Category name is required', buildValidationDetails('name', 'Name cannot be empty'));
    }

    if (weight === undefined || weight === null || Number(weight) < 0 || Number(weight) > 100) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'Category weight must be between 0 and 100',
        buildValidationDetails('weight', `Value ${weight} exceeds maximum limit of 100`),
      );
    }

    if (!Array.isArray(rubrics)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Rubrics must be an array', buildValidationDetails('rubrics', 'Expected an array of rubric entries'));
    }

    const invalidRubric = rubrics.find((rubric) => !rubric || !rubric.name || Number(rubric.maxPoints) <= 0);
    if (invalidRubric) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'Each rubric must include a valid name and maxPoints greater than 0',
        buildValidationDetails('rubrics', 'At least one rubric is invalid'),
      );
    }

    const freshRubrics = rubrics.map((rubric, index) => ({
      _id: createRubricId(100 + index + 1),
      name: rubric.name,
      maxPoints: Number(rubric.maxPoints),
    }));

    const newCategory = {
      _id: `65f8a123b0a9c123456789${String(mockCategories.length + 10).padStart(2, '0')}`,
      name: String(name).trim(),
      description: String(description).trim(),
      weight: Number(weight),
      isActive: Boolean(isActive),
      rubrics: freshRubrics,
    };

    mockCategories.push(newCategory);
    return sendSuccess(res, newCategory, 'Category created successfully', 201);
  } catch (error) {
    return sendError(res, 400, 'VALIDATION_ERROR', error.message || 'Failed to create category', []);
  }
});

router.put('/categories/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const category = mockCategories.find((item) => item._id === id);

    if (!category) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', `Category ID '${id}' not found`, []);
    }

    const { name, description, weight, isActive, rubrics } = req.body || {};

    if (weight !== undefined && (Number(weight) < 0 || Number(weight) > 100)) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'Category weight must be between 0 and 100',
        buildValidationDetails('weight', `Value ${weight} exceeds maximum limit of 100`),
      );
    }

    if (name !== undefined && (!String(name).trim())) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Category name cannot be empty', buildValidationDetails('name', 'Name cannot be empty'));
    }

    if (rubrics !== undefined && !Array.isArray(rubrics)) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Rubrics must be an array', buildValidationDetails('rubrics', 'Expected an array of rubric entries'));
    }

    if (rubrics !== undefined) {
      const invalidRubric = rubrics.find((rubric) => !rubric || !rubric.name || Number(rubric.maxPoints) <= 0);
      if (invalidRubric) {
        return sendError(
          res,
          400,
          'VALIDATION_ERROR',
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
      category.rubrics = rubrics.map((rubric, index) => ({
        _id: rubric._id || createRubricId(200 + index + 1),
        name: rubric.name,
        maxPoints: Number(rubric.maxPoints),
      }));
    }

    return sendSuccess(res, category, 'Category updated successfully', 200);
  } catch (error) {
    return sendError(res, 400, 'VALIDATION_ERROR', error.message || 'Failed to update category', []);
  }
});

router.delete('/categories/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const linkedToGroup = mockContestantGroups.some((group) => group.categoriesIncluded.includes(id));

    if (linkedToGroup) {
      return sendError(
        res,
        400,
        'VALIDATION_ERROR',
        'Cannot delete category linked to active contestant groups',
        [],
      );
    }

    const index = mockCategories.findIndex((item) => item._id === id);
    if (index === -1) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', `Category ID '${id}' not found`, []);
    }

    mockCategories.splice(index, 1);
    return sendSuccess(res, null, 'Category deleted successfully', 200);
  } catch (error) {
    return sendError(res, 400, 'VALIDATION_ERROR', error.message || 'Failed to delete category', []);
  }
});

export default router;
