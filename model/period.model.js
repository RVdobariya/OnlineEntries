import mongoose from "mongoose";

const periodSchema = mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
      min: 1900,
      max: 2100,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index to ensure unique year-month combinations
periodSchema.index({ year: 1, month: 1 }, { unique: true });

const Period = mongoose.model("Period", periodSchema);

export default Period;