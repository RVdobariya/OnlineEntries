import mongoose from "mongoose";

const lotNoSchema = mongoose.Schema(
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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const LotNo = mongoose.model("LotNo", lotNoSchema);

export default LotNo;
