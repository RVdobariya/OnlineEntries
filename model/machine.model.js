import mongoose from "mongoose";

const machineSchema = mongoose.Schema(
  {
    machineNo: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: false,
    },
    overlockPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

const Machine = mongoose.model("Machine", machineSchema);

export default Machine;