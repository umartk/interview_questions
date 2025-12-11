/**
 * =============================================================================
 * USER MODEL - Mongoose Schema Definition
 * =============================================================================
 * 
 * PURPOSE:
 * Defines the User schema with advanced Mongoose features:
 * - Field validation and constraints
 * - Indexes for query optimization
 * - Virtual properties (computed fields)
 * - Pre/post middleware (hooks)
 * - Static and instance methods
 * 
 * INTERVIEW TOPICS:
 * - Schema design best practices
 * - Mongoose middleware (hooks)
 * - Index strategies
 * - Virtual vs stored fields
 */

const mongoose = require('mongoose');

/**
 * USER SCHEMA DEFINITION
 * 
 * Each field can have:
 * - type: Data type (String, Number, Date, etc.)
 * - required: Whether field is mandatory
 * - unique: Creates unique index
 * - default: Default value if not provided
 * - validate: Custom validation function
 * - enum: Allowed values for the field
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,        // Removes whitespace from both ends
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,      // Creates unique index automatically
    lowercase: true,   // Converts to lowercase before saving
    // Custom validation with regex
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  age: {
    type: Number,
    min: 18,           // Minimum value validation
    max: 120           // Maximum value validation
  },
  /**
   * ENUM FIELD
   * 
   * Restricts values to predefined list
   * Throws validation error if value not in list
   */
  preferences: [{
    type: String,
    enum: ['electronics', 'books', 'clothing', 'home', 'sports', 'beauty']
  }],
  /**
   * NESTED OBJECT (Embedded Document)
   * 
   * Stores related data within the same document
   * Good for data that's always accessed together
   */
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'USA' }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});


/**
 * =============================================================================
 * INDEXES
 * =============================================================================
 * 
 * Indexes improve query performance but:
 * - Slow down writes (index must be updated)
 * - Use disk space
 * - Should be created for frequently queried fields
 * 
 * Index types:
 * - Single field: { email: 1 }
 * - Compound: { city: 1, state: 1 }
 * - Text: For full-text search
 * - Geospatial: For location queries
 */
userSchema.index({ email: 1 });
userSchema.index({ preferences: 1 });
userSchema.index({ createdAt: -1 });  // -1 for descending order
userSchema.index({ 'address.city': 1, 'address.state': 1 });  // Compound index

/**
 * =============================================================================
 * VIRTUAL PROPERTIES
 * =============================================================================
 * 
 * Virtuals are computed properties that:
 * - Are NOT stored in the database
 * - Are calculated on-the-fly when accessed
 * - Can have getters and setters
 * 
 * Use cases:
 * - Computed values (fullName from firstName + lastName)
 * - Formatted values (formatted address)
 * - Derived data (age from birthDate)
 */
userSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
});

/**
 * =============================================================================
 * MIDDLEWARE (HOOKS)
 * =============================================================================
 * 
 * Middleware functions run at specific points in the document lifecycle:
 * 
 * Pre hooks: Run BEFORE the operation
 * - pre('save'): Before document is saved
 * - pre('validate'): Before validation
 * - pre('remove'): Before document is removed
 * 
 * Post hooks: Run AFTER the operation
 * - post('save'): After document is saved
 * - post('find'): After query executes
 * 
 * Use cases:
 * - Update timestamps
 * - Hash passwords
 * - Log operations
 * - Cascade deletes
 */
userSchema.pre('save', function(next) {
  // 'this' refers to the document being saved
  this.updatedAt = Date.now();
  next();  // Must call next() to continue
});

/**
 * =============================================================================
 * STATIC METHODS
 * =============================================================================
 * 
 * Static methods are called on the Model itself (not instances)
 * 
 * Usage: User.findByPreference('electronics')
 * 
 * Good for:
 * - Custom query methods
 * - Aggregation helpers
 * - Utility functions
 */
userSchema.statics.findByPreference = function(preference) {
  // 'this' refers to the Model
  return this.find({ preferences: preference, isActive: true });
};

userSchema.statics.getActiveUsersCount = function() {
  return this.countDocuments({ isActive: true });
};

/**
 * =============================================================================
 * INSTANCE METHODS
 * =============================================================================
 * 
 * Instance methods are called on document instances
 * 
 * Usage: 
 * const user = await User.findById(id);
 * await user.addPreference('books');
 * 
 * Good for:
 * - Document-specific operations
 * - Methods that need document data
 */
userSchema.methods.addPreference = function(preference) {
  // 'this' refers to the document instance
  if (!this.preferences.includes(preference)) {
    this.preferences.push(preference);
    return this.save();
  }
  return Promise.resolve(this);
};

userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

/**
 * EXPORT MODEL
 * 
 * mongoose.model(name, schema) creates a Model from the schema
 * The model provides the interface for database operations
 */
module.exports = mongoose.model('User', userSchema);