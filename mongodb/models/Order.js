const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  shipping: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery']
  },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'USA' }
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' }
  },
  tracking: {
    carrier: String,
    trackingNumber: String,
    estimatedDelivery: Date,
    actualDelivery: Date
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }]
});

// Indexes
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save middleware
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Generate order number if not exists
  if (!this.orderNumber) {
    this.orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  
  // Calculate totals
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity) - item.discount;
    }, 0);
    
    this.total = this.subtotal + this.tax + this.shipping - this.discount;
  }
  
  next();
});

// Pre-save middleware to track status changes
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
  }
  next();
});

// Static methods
orderSchema.statics.findByUser = function(userId) {
  return this.find({ userId }).populate('items.productId').sort({ createdAt: -1 });
};

orderSchema.statics.findByStatus = function(status) {
  return this.find({ status }).populate('userId', 'name email');
};

orderSchema.statics.getOrdersByDateRange = function(startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  });
};

orderSchema.statics.getRevenueByPeriod = function(startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        paymentStatus: 'paid'
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        totalOrders: { $sum: 1 },
        averageOrderValue: { $avg: '$total' }
      }
    }
  ]);
};

// Instance methods
orderSchema.methods.updateStatus = function(newStatus, note) {
  this.status = newStatus;
  if (note) {
    this.statusHistory.push({
      status: newStatus,
      timestamp: new Date(),
      note
    });
  }
  return this.save();
};

orderSchema.methods.addTracking = function(carrier, trackingNumber, estimatedDelivery) {
  this.tracking = {
    carrier,
    trackingNumber,
    estimatedDelivery
  };
  return this.save();
};

orderSchema.methods.calculateTax = function(taxRate = 0.08) {
  this.tax = this.subtotal * taxRate;
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema);