const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

class AnalyticsService {
  async getOrderAnalytics(startDate, endDate) {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate || new Date();

      return await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $facet: {
            overview: [
              {
                $group: {
                  _id: null,
                  totalOrders: { $sum: 1 },
                  totalRevenue: { $sum: '$total' },
                  averageOrderValue: { $avg: '$total' },
                  paidOrders: {
                    $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
                  }
                }
              }
            ],
            statusBreakdown: [
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 },
                  revenue: { $sum: '$total' }
                }
              },
              { $sort: { count: -1 } }
            ],
            paymentMethodBreakdown: [
              {
                $group: {
                  _id: '$paymentMethod',
                  count: { $sum: 1 },
                  revenue: { $sum: '$total' }
                }
              },
              { $sort: { count: -1 } }
            ]
          }
        }
      ]);
    } catch (error) {
      throw new Error(`Failed to get order analytics: ${error.message}`);
    }
  }

  async getRevenueByCategory() {
    try {
      return await Order.aggregate([
        {
          $match: {
            paymentStatus: 'paid'
          }
        },
        {
          $unwind: '$items'
        },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        {
          $unwind: '$product'
        },
        {
          $group: {
            _id: '$product.category',
            totalRevenue: {
              $sum: { $multiply: ['$items.quantity', '$items.price'] }
            },
            totalQuantitySold: { $sum: '$items.quantity' },
            averagePrice: { $avg: '$items.price' },
            uniqueProducts: { $addToSet: '$product._id' }
          }
        },
        {
          $project: {
            category: '$_id',
            totalRevenue: { $round: ['$totalRevenue', 2] },
            totalQuantitySold: 1,
            averagePrice: { $round: ['$averagePrice', 2] },
            uniqueProductCount: { $size: '$uniqueProducts' },
            _id: 0
          }
        },
        {
          $sort: { totalRevenue: -1 }
        }
      ]);
    } catch (error) {
      throw new Error(`Failed to get revenue by category: ${error.message}`);
    }
  }

  async getUserBehaviorAnalysis() {
    try {
      return await User.aggregate([
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: 'userId',
            as: 'orders'
          }
        },
        {
          $addFields: {
            orderCount: { $size: '$orders' },
            totalSpent: { $sum: '$orders.total' },
            averageOrderValue: { $avg: '$orders.total' },
            daysSinceLastOrder: {
              $cond: {
                if: { $gt: [{ $size: '$orders' }, 0] },
                then: {
                  $divide: [
                    { $subtract: [new Date(), { $max: '$orders.createdAt' }] },
                    1000 * 60 * 60 * 24
                  ]
                },
                else: null
              }
            }
          }
        },
        {
          $addFields: {
            customerSegment: {
              $switch: {
                branches: [
                  {
                    case: { $and: [{ $gte: ['$totalSpent', 1000] }, { $gte: ['$orderCount', 5] }] },
                    then: 'VIP'
                  },
                  {
                    case: { $and: [{ $gte: ['$totalSpent', 500] }, { $gte: ['$orderCount', 3] }] },
                    then: 'Loyal'
                  },
                  {
                    case: { $gte: ['$orderCount', 1] },
                    then: 'Regular'
                  }
                ],
                default: 'New'
              }
            }
          }
        },
        {
          $group: {
            _id: '$customerSegment',
            count: { $sum: 1 },
            averageSpent: { $avg: '$totalSpent' },
            averageOrders: { $avg: '$orderCount' },
            averageOrderValue: { $avg: '$averageOrderValue' }
          }
        },
        {
          $project: {
            segment: '$_id',
            count: 1,
            averageSpent: { $round: ['$averageSpent', 2] },
            averageOrders: { $round: ['$averageOrders', 1] },
            averageOrderValue: { $round: ['$averageOrderValue', 2] },
            _id: 0
          }
        },
        {
          $sort: { averageSpent: -1 }
        }
      ]);
    } catch (error) {
      throw new Error(`Failed to get user behavior analysis: ${error.message}`);
    }
  }

  async getProductPerformance() {
    try {
      return await Product.aggregate([
        {
          $lookup: {
            from: 'orders',
            let: { productId: '$_id' },
            pipeline: [
              { $unwind: '$items' },
              {
                $match: {
                  $expr: { $eq: ['$items.productId', '$$productId'] },
                  paymentStatus: 'paid'
                }
              },
              {
                $group: {
                  _id: null,
                  totalSold: { $sum: '$items.quantity' },
                  totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
                }
              }
            ],
            as: 'sales'
          }
        },
        {
          $addFields: {
            totalSold: { $ifNull: [{ $arrayElemAt: ['$sales.totalSold', 0] }, 0] },
            totalRevenue: { $ifNull: [{ $arrayElemAt: ['$sales.totalRevenue', 0] }, 0] }
          }
        },
        {
          $project: {
            name: 1,
            category: 1,
            price: 1,
            averageRating: 1,
            totalReviews: 1,
            totalSold: 1,
            totalRevenue: { $round: ['$totalRevenue', 2] },
            inventoryTurnover: {
              $cond: {
                if: { $gt: ['$inventory.quantity', 0] },
                then: { $divide: ['$totalSold', '$inventory.quantity'] },
                else: 0
              }
            }
          }
        },
        {
          $sort: { totalRevenue: -1 }
        },
        {
          $limit: 20
        }
      ]);
    } catch (error) {
      throw new Error(`Failed to get product performance: ${error.message}`);
    }
  }

  async getCohortAnalysis(cohortType = 'monthly') {
    try {
      let dateFormat;
      switch (cohortType) {
        case 'weekly':
          dateFormat = { $dateToString: { format: '%Y-W%U', date: '$createdAt' } };
          break;
        case 'monthly':
          dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
          break;
        default:
          dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
      }

      return await User.aggregate([
        {
          $addFields: {
            registrationCohort: dateFormat
          }
        },
        {
          $lookup: {
            from: 'orders',
            localField: '_id',
            foreignField: 'userId',
            as: 'orders'
          }
        },
        {
          $unwind: {
            path: '$orders',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            orderCohort: {
              $cond: {
                if: '$orders',
                then: { $dateToString: { format: '%Y-%m', date: '$orders.createdAt' } },
                else: null
              }
            }
          }
        },
        {
          $group: {
            _id: {
              registrationCohort: '$registrationCohort',
              orderCohort: '$orderCohort'
            },
            users: { $addToSet: '$_id' }
          }
        },
        {
          $group: {
            _id: '$_id.registrationCohort',
            cohortData: {
              $push: {
                period: '$_id.orderCohort',
                userCount: { $size: '$users' }
              }
            },
            totalCohortSize: { $sum: { $size: '$users' } }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);
    } catch (error) {
      throw new Error(`Failed to get cohort analysis: ${error.message}`);
    }
  }

  async getInventoryAnalytics() {
    try {
      return await Product.aggregate([
        {
          $facet: {
            overview: [
              {
                $group: {
                  _id: null,
                  totalProducts: { $sum: 1 },
                  totalInventoryValue: {
                    $sum: { $multiply: ['$inventory.quantity', '$price'] }
                  },
                  averageInventoryValue: {
                    $avg: { $multiply: ['$inventory.quantity', '$price'] }
                  },
                  outOfStockProducts: {
                    $sum: { $cond: [{ $eq: ['$inventory.available', 0] }, 1, 0] }
                  },
                  lowStockProducts: {
                    $sum: {
                      $cond: [
                        { $and: [{ $gt: ['$inventory.available', 0] }, { $lte: ['$inventory.available', 10] }] },
                        1,
                        0
                      ]
                    }
                  }
                }
              }
            ],
            categoryBreakdown: [
              {
                $group: {
                  _id: '$category',
                  productCount: { $sum: 1 },
                  totalInventoryValue: {
                    $sum: { $multiply: ['$inventory.quantity', '$price'] }
                  },
                  averagePrice: { $avg: '$price' },
                  totalQuantity: { $sum: '$inventory.quantity' }
                }
              },
              { $sort: { totalInventoryValue: -1 } }
            ]
          }
        }
      ]);
    } catch (error) {
      throw new Error(`Failed to get inventory analytics: ${error.message}`);
    }
  }
}

module.exports = AnalyticsService;