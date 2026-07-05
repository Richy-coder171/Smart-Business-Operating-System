import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
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
    originalMessage: {
      type: String,
      required: true,
      maxlength: 1000
    },
    intent: {
      type: String,
      enum: [
        "promise_to_pay",
        "payment_completed",
        "request_extension",
        "dispute_amount",
        "unable_to_pay",
        "ask_for_details",
        "acknowledgement",
        "unknown"
      ],
      required: true,
      index: true
    },
    promisedPaymentDate: {
      type: Date,
      index: true
    },
    extractedAmount: Number,
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    },
    language: {
      type: String,
      default: "unknown"
    },
    summary: {
      type: String,
      maxlength: 500
    },
    suggestedAction: {
      type: String,
      maxlength: 500
    },
    rawAIResponse: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

replySchema.index({ ownerId: 1, customerId: 1, createdAt: -1 });
replySchema.index({ ownerId: 1, promisedPaymentDate: 1 });

export default mongoose.model("CustomerReply", replySchema);
