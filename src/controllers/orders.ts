import { Response } from 'express';
import { Order } from '../models/Order';
import { AuthRequest } from '../middlewares/auth';
import { logger } from '../utils/logger';
import { z } from 'zod';

const updateOrderStatusSchema = z.object({
  status: z.enum(['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'])
});

export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', status, userId } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: any = {};
    
    if (status) {
      query.status = status;
    }
    
    if (userId) {
      query.userId = userId;
    }

    const orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skip);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders'
    });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id)
      .populate('userId', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order'
    });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = updateOrderStatusSchema.parse(req.body);

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    order.status = status;
    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('userId', 'name email phone');

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    logger.error('Update order status error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update order status'
    });
  }
};

export const getOrderStats = async (req: AuthRequest, res: Response) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: { $in: ['placed', 'confirmed', 'preparing'] } });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    const cancelledOrders = await Order.countDocuments({ status: 'cancelled' });
    
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        deliveredOrders,
        cancelledOrders,
        revenue
      }
    });
  } catch (error) {
    logger.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order stats'
    });
  }
};

