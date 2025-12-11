const Order = require('../models/Order');
const Product = require('../models/Product');

class OrderService {
  async createOrder(orderData) {
    try {
      // Validate and reserve inventory
      for (const item of orderData.items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
        
        if (product.inventory.available < item.quantity) {
          throw new Error(`Insufficient inventory for product ${product.name}`);
        }
        
        // Reserve inventory
        await product.reserveInventory(item.quantity);
      }

      const order = new Order(orderData);
      return await order.save();
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  async getOrderById(orderId) {
    try {
      return await Order.findById(orderId)
        .populate('userId', 'name email')
        .populate('items.productId', 'name price category');
    } catch (error) {
      throw new Error(`Failed to get order: ${error.message}`);
    }
  }

  async getOrdersByUser(userId) {
    try {
      return await Order.findByUser(userId);
    } catch (error) {
      throw new Error(`Failed to get user orders: ${error.message}`);
    }
  }

  async updateOrderStatus(orderId, status, note) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      return await order.updateStatus(status, note);
    } catch (error) {
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  }

  async getOrderAnalytics(startDate, endDate) {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const end = endDate || new Date();

      return await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$total' },
            averageOrderValue: { $avg: '$total' },
            ordersByStatus: {
              $push: '$status'
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalOrders: 1,
            totalRevenue: { $round: ['$totalRevenue', 2] },
            averageOrderValue: { $round: ['$averageOrderValue', 2] },
            statusDistribution: {
              $arrayToObject: {
                $map: {
                  input: {
                    $setUnion: ['$ordersByStatus', []]
                  },
                  as: 'status',
                  in: {
                    k: '$$status',
                    v: {
                      $size: {
                        $filter: {
                          input: '$ordersByStatus',
                          cond: { $eq: ['$$this', '$$status'] }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ]);
    } catch (error) {
      throw new Error(`Failed to get order analytics: ${error.message}`);
    }
  }

  async getRevenueByPeriod(period = 'daily', startDate, endDate) {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate || new Date();

      let groupBy;
      switch (period) {
        case 'hourly':
          groupBy = {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
            hour: { $hour: '$createdAt' }
          };
          break;
        case 'daily':
          groupBy = {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          };
          break;
        case 'monthly':
          groupBy = {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          };
          break;
        default:
          groupBy = {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          };
      }

      return await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end },
            paymentStatus: 'paid'
          }
        },
        {
          $group: {
            _id: groupBy,
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
            averageOrderValue: { $avg: '$total' }
          }
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1 }
        }
      ]);
    } catch (error) {
      throw new Error(`Failed to get revenue by period: ${error.message}`);
    }
  }

  async getTopCustomers(limit = 10) {
    try {
      return await Order.aggregate([
        {
          $match: {
            paymentStatus: 'paid'
          }
        },
        {
          $group: {
            _id: '$userId',
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$total' },
            averageOrderValue: { $avg: '$total' },
            lastOrderDate: { $max: '$createdAt' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            name: '$user.name',
            email: '$user.email',
            totalOrders: 1,
            totalSpent: { $round: ['$totalSpent', 2] },
            averageOrderValue: { $round: ['$averageOrderValue', 2] },
            lastOrderDate: 1
          }
        },
        {
          $sort: { totalSpent: -1 }
        },
        {
          $limit: limit
        }
      ]);
    } catch (error) {
      throw new Error(`Failed to get top customers: ${error.message}`);
    }
  }

  async getOrderTrends() {
    try {
      return await Order.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              week: { $week: '$createdAt' }
            },
            orders: { $sum: 1 },
            revenue: { $sum: '$total' }
          }
        },
        {
          $sort: { '_id.year': -1, '_id.month': -1, '_id.week': -1 }
        },
        {
          $limit: 12
        }
      ]);
    } catch (error) {
      throw new Error(`Failed to get order trends: ${error.message}`);
    }
  }

  async cancelOrder(orderId, reason) {
    try {
      const order = await Order.findById(orderId).populate('items.productId');
      if (!order) {
        throw new Error('Order not found');
      }

      if (['shipped', 'delivered'].includes(order.status)) {
        throw new Error('Cannot cancel shipped or delivered orders');
      }

      // Release reserved inventory
      for (const item of order.items) {
        const product = await Product.findById(item.productId._id);
        if (product) {
          product.inventory.reserved -= item.quantity;
          await product.save();
        }
      }

      return await order.updateStatus('cancelled', reason);
    } catch (error) {
      throw new Error(`Failed to cancel order: ${error.message}`);
    }
  }
}

module.exports = OrderService;