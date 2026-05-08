import mongoose from "mongoose";

const designSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

const Design = mongoose.model("Design", designSchema);

export default Design;