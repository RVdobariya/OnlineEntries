import mongoose from "mongoose";

const typeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

const Type = mongoose.model("Type", typeSchema);

export default Type;