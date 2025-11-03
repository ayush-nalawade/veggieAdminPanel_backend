import { Request, Response } from 'express';
import { z } from 'zod';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middlewares/auth';

// Validation schemas
const unitPriceSchema = z.object({
  unit: z.enum(['kg', 'g', 'pcs', 'bundle']),
  step: z.number().positive(),
  baseQty: z.number().positive(),
  price: z.number().positive(),
  compareAt: z.number().positive().optional(),
  stock: z.number().min(0)
});

const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
  images: z.array(z.string().url('Invalid image URL')).min(1, 'At least one image is required'),
  description: z.string().optional(),
  unitPrices: z.array(unitPriceSchema).min(1, 'At least one unit price is required'),
  rating: z.number().min(0).max(5).optional(),
  isActive: z.boolean().default(true)
});

const updateProductSchema = z.object({
  name: z.string().min(1, 'Name is required').trim().optional(),
  categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID').optional(),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  description: z.string().optional(),
  unitPrices: z.array(unitPriceSchema).optional(),
  rating: z.number().min(0).max(5).optional(),
  isActive: z.boolean().optional()
});

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, q, limit = '50', page = '1', isActive } = req.query;
    
    const query: any = {};
    
    if (category) {
      query.categoryId = category;
    }
    
    if (q) {
      const searchRegex = new RegExp(q as string, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const limitNum = parseInt(limit as string);
    const pageNum = parseInt(page as string);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(query)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id)
      .populate('categoryId', 'name');

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const data = createProductSchema.parse(req.body);

    // Verify category exists
    const category = await Category.findById(data.categoryId);
    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Check if product with same name exists
    const existingProduct = await Product.findOne({ name: data.name });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        error: 'Product with this name already exists'
      });
    }

    const product = await Product.create(data);

    const populatedProduct = await Product.findById(product._id)
      .populate('categoryId', 'name');

    res.status(201).json({
      success: true,
      data: populatedProduct
    });
  } catch (error) {
    logger.error('Create product error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create product'
    });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateProductSchema.parse(req.body);

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Verify category exists if being updated
    if (data.categoryId) {
      const category = await Category.findById(data.categoryId);
      if (!category) {
        return res.status(400).json({
          success: false,
          error: 'Category not found'
        });
      }
    }

    // Check if name is being updated and already exists
    if (data.name && data.name !== product.name) {
      const existingProduct = await Product.findOne({ name: data.name });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          error: 'Product with this name already exists'
        });
      }
    }

    Object.assign(product, data);
    await product.save();

    const updatedProduct = await Product.findById(product._id)
      .populate('categoryId', 'name');

    res.json({
      success: true,
      data: updatedProduct
    });
  } catch (error) {
    logger.error('Update product error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update product'
    });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    await Product.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    logger.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    });
  }
};

