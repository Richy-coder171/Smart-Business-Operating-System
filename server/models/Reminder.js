import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
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
    message: {
      type: String,
      required: true,
      maxlength: 1000
    },
    language: {
      type: String,
      enum: ["en", "hi", "hinglish"],
      required: true
    },
    tone: {
      type: String,
      enum: ["polite", "friendly", "professional", "firm"],
      required: true
    },
    channel: {
      type: String,
      default: "whatsapp",
      trim: true
    },
    status: {
      type: String,
      enum: ["generated", "sent", "failed", "cancelled"],
      default: "generated",
      index: true
    },
    generatedBy: {
      type: String,
      enum: ["gemini", "template"],
      required: true
    }
  },
  { timestamps: true }
);

reminderSchema.index({ ownerId: 1, customerId: 1, createdAt: -1 });

export default mongoose.model("Reminder", reminderSchema);
