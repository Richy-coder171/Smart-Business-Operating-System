import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 24
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    preferredLanguage: {
      type: String,
      enum: ["en", "hi"],
      default: "en"
    }
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model("User", userSchema);
