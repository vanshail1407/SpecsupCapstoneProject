const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    frame: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Frame',
      required: true,
      index: true,
    },
    reservation_date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.customer_id = ret.customer ? (ret.customer._id || ret.customer).toString() : undefined;
        ret.frame_id = ret.frame ? (ret.frame._id || ret.frame).toString() : undefined;
        ret.reservation_date = ret.reservation_date ? ret.reservation_date.toISOString().replace('T', ' ').substring(0, 19) : undefined;
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
        ret.frame_id = ret.frame ? (ret.frame._id || ret.frame).toString() : undefined;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Reservation = mongoose.model('Reservation', reservationSchema);
module.exports = Reservation;
