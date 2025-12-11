const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 2000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Books', 'Clothing', 'Home', 'Sports', 'Beauty']
  },
  subcategory: String,
  brand: String,
  tags: [String],
  specifications: {
    type: Map,
    of: String
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  inventory: {
    quantity: { type: Number, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    available: { type: Number, default: 0, min: 0 }
  },
  pricing: {
    cost: Number,
    markup: { type: Number, default: 1.5 },
    discount: { type: Number, default: 0, min: 0, max: 100 }
  },
  reviews: [reviewSchema],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ price: 1 });
productSchema.index({ averageRating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'inventory.available': 1 });

// Virtual for discounted price
productSchema.virtual('discountedPrice').get(function() {
  if (this.pricing && this.pricing.discount > 0) {
    return this.price * (1 - this.pricing.discount / 100);
  }
  return this.price;
});

// Virtual for availability status
productSchema.virtual('availabilityStatus').get(function() {
  if (this.inventory.available > 10) return 'In Stock';
  if (this.inventory.available > 0) return 'Low Stock';
  return 'Out of Stock';
});

// Pre-save middleware
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate available inventory
  if (this.inventory) {
    this.inventory.available = this.inventory.quantity - this.inventory.reserved;
  }
  
  // Calculate average rating
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = totalRating / this.reviews.length;
    this.totalReviews = this.reviews.length;
  }
  
  next();
});

// Static methods
productSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true });
};

productSchema.statics.findInPriceRange = function(minPrice, maxPrice) {
  return this.find({ 
    price: { $gte: minPrice, $lte: maxPrice },
    isActive: true 
  });
};

productSchema.statics.searchProducts = function(searchTerm, filters = {}) {
  const query = { isActive: true };
  
  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }
  
  if (filters.category) {
    query.category = filters.category;
  }
  
  if (filters.minPrice || filters.maxPrice) {
    query.price = {};
    if (filters.minPrice) query.price.$gte = filters.minPrice;
    if (filters.maxPrice) query.price.$lte = filters.maxPrice;
  }
  
  if (filters.minRating) {
    query.averageRating = { $gte: filters.minRating };
  }
  
  return this.find(query);
};

// Instance methods
productSchema.methods.addReview = function(userId, rating, comment) {
  this.reviews.push({ userId, rating, comment });
  return this.save();
};

productSchema.methods.updateInventory = function(quantity) {
  this.inventory.quantity = quantity;
  return this.save();
};

productSchema.methods.reserveInventory = function(quantity) {
  if (this.inventory.available >= quantity) {
    this.inventory.reserved += quantity;
    return this.save();
  }
  throw new Error('Insufficient inventory');
};

module.exports = mongoose.model('Product', productSchema);