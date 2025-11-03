import { Request, Response } from 'express';
import { z } from 'zod';
import { Category } from '../models/Category';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middlewares/auth';

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  iconUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  sort: z.number().int().default(0),
  isActive: z.boolean().default(true)
});

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').trim().optional(),
  iconUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  sort: z.number().int().optional(),
  isActive: z.boolean().optional()
});

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await Category.find()
      .sort({ sort: 1, name: 1 });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
};

export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    logger.error('Get category by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category'
    });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const data = createCategorySchema.parse(req.body);

    // Check if category with same name exists
    const existingCategory = await Category.findOne({ name: data.name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'Category with this name already exists'
      });
    }

    const category = await Category.create(data);

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    logger.error('Create category error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create category'
    });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateCategorySchema.parse(req.body);

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Check if name is being updated and already exists
    if (data.name && data.name !== category.name) {
      const existingCategory = await Category.findOne({ name: data.name });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          error: 'Category with this name already exists'
        });
      }
    }

    Object.assign(category, data);
    await category.save();

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    logger.error('Update category error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update category'
    });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    await Category.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    logger.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete category'
    });
  }
};

