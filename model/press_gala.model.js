import mongoose from "mongoose";

const pressGalaSchema = mongoose.Schema(
  {
    
    date: {
      type: Date,
      required: true,
    },
    name: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pcs: {
      type: Number,
      required: true,
      min: 0,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    period: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Period",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const PressGalaEntry = mongoose.model("PressGala", pressGalaSchema);

export default PressGalaEntry;