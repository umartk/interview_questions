const User = require('../models/User');

class UserService {
  async createUser(userData) {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async getUserById(userId) {
    try {
      return await User.findById(userId);
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  async updateUser(userId, updateData) {
    try {
      return await User.findByIdAndUpdate(
        userId,
        { ...updateData, updatedAt: Date.now() },
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  async getUserStats() {
    try {
      return await User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            averageAge: { $avg: '$age' },
            preferenceDistribution: {
              $push: '$preferences'
            }
          }
        },
        {
          $project: {
            _id: 0,
            totalUsers: 1,
            activeUsers: 1,
            averageAge: { $round: ['$averageAge', 1] },
            preferenceDistribution: {
              $reduce: {
                input: '$preferenceDistribution',
                initialValue: [],
                in: { $concatArrays: ['$$value', '$$this'] }
              }
            }
          }
        }
      ]);
    } catch (error) {
      throw new Error(`Failed to get user stats: ${error.message}`);
    }
  }

  async getUsersByPreference(preference) {
    try {
      return await User.findByPreference(preference);
    } catch (error) {
      throw new Error(`Failed to get users by preference: ${error.message}`);
    }
  }

  async getUsersWithMostOrders() {
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
            totalSpent: { $sum: '$orders.total' }
          }
        },
        {
          $match: {
            orderCount: { $gt: 0 }
          }
        },
        {
          $sort: { orderCount: -1, totalSpent: -1 }
        },
        {
          $limit: 10
        },
        {
          $project: {
            name: 1,
            email: 1,
            orderCount: 1,
            totalSpent: { $round: ['$totalSpent', 2] },
            averageOrderValue: {
              $round: [{ $divide: ['$totalSpent', '$orderCount'] }, 2]
            }
          }
        }
      ]);
    } catch (error) {
      throw new Error(`Failed to get users with most orders: ${error.message}`);
    }
  }

  async getUserDemographics() {
    try {
      return await User.aggregate([
        {
          $group: {
            _id: {
              ageGroup: {
                $switch: {
                  branches: [
                    { case: { $lt: ['$age', 25] }, then: '18-24' },
                    { case: { $lt: ['$age', 35] }, then: '25-34' },
                    { case: { $lt: ['$age', 45] }, then: '35-44' },
                    { case: { $lt: ['$age', 55] }, then: '45-54' },
                    { case: { $gte: ['$age', 55] }, then: '55+' }
                  ],
                  default: 'Unknown'
                }
              }
            },
            count: { $sum: 1 },
            averageAge: { $avg: '$age' }
          }
        },
        {
          $sort: { '_id.ageGroup': 1 }
        }
      ]);
    } catch (error) {
      throw new Error(`Failed to get user demographics: ${error.message}`);
    }
  }

  async searchUsers(searchTerm, filters = {}) {
    try {
      const query = {};
      
      if (searchTerm) {
        query.$or = [
          { name: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ];
      }
      
      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }
      
      if (filters.preferences && filters.preferences.length > 0) {
        query.preferences = { $in: filters.preferences };
      }
      
      if (filters.minAge || filters.maxAge) {
        query.age = {};
        if (filters.minAge) query.age.$gte = filters.minAge;
        if (filters.maxAge) query.age.$lte = filters.maxAge;
      }
      
      return await User.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50);
    } catch (error) {
      throw new Error(`Failed to search users: ${error.message}`);
    }
  }
}

module.exports = UserService;