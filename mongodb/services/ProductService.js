const Product = require('../models/Product');

class ProductService {
  async createProduct(productData) {
    try {
      const product = new Product(productData);
      return await product.save();
    } catch (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  async getProductById(productId) {
    try {
      return await Product.findById(productId).populate('reviews.userId', 'name');
    } catch (error) {
      throw new Error(`Failed to get product: ${error.message}`);
    }
  }

  async updateProduct(productId, updateData) {
    try {
      return await Product.findByIdAndUpdate(
        productId,
        { ...updateData, updatedAt: Date.now() },
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }

  async searchProducts(searchTerm, filters = {}) {
    try {
      return await Product.searchProducts(searchTerm, filters)
        .sort({ averageRating: -1, createdAt: -1 })
        .limit(filters.limit || 20);
    } catch (error) {
      throw new Error(`Failed to search products: ${error.message}`);
    }
  }

  async getProductsByCategory(category) {
    try {
      return await Product.findByCategory(category)
        .sort({ averageRating: -1 })
        .limit(50);
    } catch (error) {
      throw new Error(`Failed to get products by category: ${error.message}`);
    }
  }

  async getTopRatedProducts(limit = 10) {
    try {
      return await Product.find({ 
        isActive: true,
        totalReviews: { $gte: 5 }
      })
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(limit);
    } catch (error) {
      throw new Error(`Failed to get top rated products: ${error.message}`);
    }
  }

  async getProductAnalytics() {
    try {
      return await Product.aggregate([
        {
          $group: {
            _id: '$category',
            totalProducts: { $sum: 1 },
            averagePrice: { $avg: '$price' },
            averageRating: { $avg: '$averageRating' },
            totalInventory: { $sum: '$inventory.quantity' },
            activeProducts: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            category: '$_id',
            totalProducts: 1,
            averagePrice: { $round: ['$averagePrice', 2] },
            averageRating: { $round: ['$averageRating', 2] },
            totalInventory: 1,
            activeProducts: 1,
            _id: 0
          }
        },
        {
          $sort: { totalProducts: -1 }
        }
      ]);
    } catch (error) {
      throw new Error(`Failed to get product analytics: ${error.message}`);
    }
  }

  async getInventoryReport() {
    try {
      return await Product.aggregate([
        {
          $match: { isActive: true }
        },
        {
          $addFields: {
            inventoryStatus: {
              $switch: {
                branches: [
                  { case: { $eq: ['$inventory.available', 0] }, then: 'Out of Stock' },
                  { case: { $lte: ['$inventory.available', 10] }, then: 'Low Stock' },
                  { case: { $gt: ['$inventory.available', 10] }, then: 'In Stock' }
                ],
                default: 'Unknown'
              }
            }
          }
        },
        {
          $group: {
            _id: '$inventoryStatus',
            count: { $sum: 1 },
            products: {
              $push: {
                name: '$name',
                available: '$inventory.available',
                reserved: '$inventory.reserved'
              }
            }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);
    } catch (error) {
      throw new Error(`Failed to get inventory report: ${error.message}`);
    }
  }

  async getProductRecommendations(userId, limit = 5) {
    try {
      // Get user's order history to find preferences
      const userOrders = await Product.aggregate([
        {
          $lookup: {
            from: 'orders',
            let: { productId: '$_id' },
            pipeline: [
              {
                $match: {
                  userId: userId,
                  'items.productId': '$$productId'
                }
              }
            ],
            as: 'userOrders'
          }
        },
        {
          $match: {
            userOrders: { $ne: [] }
          }
        },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 3
        }
      ]);

      if (userOrders.length === 0) {
        // Return top-rated products if no order history
        return await this.getTopRatedProducts(limit);
      }

      const preferredCategories = userOrders.map(item => item._id);

      return await Product.find({
        category: { $in: preferredCategories },
        isActive: true,
        'inventory.available': { $gt: 0 }
      })
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(limit);
    } catch (error) {
      throw new Error(`Failed to get product recommendations: ${error.message}`);
    }
  }

  async addProductReview(productId, userId, rating, comment) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      return await product.addReview(userId, rating, comment);
    } catch (error) {
      throw new Error(`Failed to add review: ${error.message}`);
    }
  }

  async updateInventory(productId, quantity) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      return await product.updateInventory(quantity);
    } catch (error) {
      throw new Error(`Failed to update inventory: ${error.message}`);
    }
  }
}

module.exports = ProductService;