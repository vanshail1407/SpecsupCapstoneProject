const mongoose = require('mongoose');

const frameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide frame name'],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    brand: {
      type: String,
      required: [true, 'Please provide frame brand'],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    price: {
      type: Number,
      required: [true, 'Please provide frame price'],
      min: [0, 'Price must be non-negative'],
    },
    image_url: {
      type: String,
      required: [true, 'Please provide image URL'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Quantity cannot be negative'],
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    lens_width_mm: {
      type: Number,
      default: null,
    },
    lens_height_mm: {
      type: Number,
      default: null,
    },
    bridge_width_mm: {
      type: Number,
      default: null,
    },
    frame_shape: {
      type: String,
      default: null,
      trim: true,
    },
    frame_material: {
      type: String,
      default: null,
      trim: true,
    },
    frame_status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.created_at = ret.createdAt;
        ret.updated_at = ret.updatedAt;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.created_at = ret.createdAt;
        ret.updated_at = ret.updatedAt;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Frame = mongoose.model('Frame', frameSchema);
module.exports = Frame;
