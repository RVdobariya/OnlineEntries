import mongoose from "mongoose";

const colorSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    hexCode: {
      type: String,
      required: true,
      match: /^#[0-9A-F]{6}$/i, // Hex color validation
    },
  },
  {
    timestamps: true,
  },
);

const Color = mongoose.model("Color", colorSchema);

export default Color;