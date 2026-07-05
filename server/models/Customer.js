import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      index: true
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 24
    },
    address: {
      type: String,
      trim: true,
      maxlength: 300
    },
    totalDue: {
      type: Number,
      default: 0,
      min: 0
    },
    totalPaid: {
      type: Number,
      default: 0,
      min: 0
    },
    creditLimit: {
      type: Number,
      default: 0,
      min: 0
    },
    paymentTermsDays: {
      type: Number,
      default: 7,
      min: 0,
      max: 365
    },
    lastPaymentDate: Date,
    nextFollowUpDate: {
      type: Date,
      index: true
    },
    lastReplyIntent: String,
    notes: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true
    }
  },
  { timestamps: true }
);

customerSchema.index({ ownerId: 1, phone: 1 }, { unique: true, sparse: true });
customerSchema.index({ ownerId: 1, totalDue: -1 });
customerSchema.index({ ownerId: 1, nextFollowUpDate: 1 });
customerSchema.index({ ownerId: 1, status: 1, name: 1 });

export default mongoose.model("Customer", customerSchema);
