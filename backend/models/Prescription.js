const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    checkup_date: {
      type: String,
      required: [true, 'Please provide checkup date'],
    },
    right_sph: {
      type: Number,
      required: true,
    },
    right_cyl: {
      type: Number,
      required: true,
    },
    right_axis: {
      type: Number,
      required: true,
      min: 0,
      max: 180,
    },
    right_pd: {
      type: Number,
      required: true,
    },
    left_sph: {
      type: Number,
      required: true,
    },
    left_cyl: {
      type: Number,
      required: true,
    },
    left_axis: {
      type: Number,
      required: true,
      min: 0,
      max: 180,
    },
    left_pd: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.customer_id = ret.customer ? (ret.customer._id || ret.customer).toString() : undefined;
        ret.created_at = ret.createdAt;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.customer_id = ret.customer ? (ret.customer._id || ret.customer).toString() : undefined;
        ret.created_at = ret.createdAt;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Prescription = mongoose.model('Prescription', prescriptionSchema);
module.exports = Prescription;
