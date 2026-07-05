import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["credit", "payment"],
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300
    },
    date: {
      type: Date,
      default: Date.now,
      index: true
    },
    paymentMethod: {
      type: String,
      trim: true,
      maxlength: 80
    },
    referenceNumber: {
      type: String,
      trim: true,
      maxlength: 120
    }
  },
  { timestamps: true }
);

transactionSchema.index({ ownerId: 1, customerId: 1, date: 1 });
transactionSchema.index({ ownerId: 1, type: 1, date: -1 });

export default mongoose.model("Transaction", transactionSchema);
