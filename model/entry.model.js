import mongoose from "mongoose";

const entrySchema = mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    period: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Period",
      required: true,
    },
    lotNo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LotNo",
      default: null,
    },
    pcs: {
      type: Number,
      required: true,
      min: 0,
    },
    design: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Design",
      required: true,
    },
    color: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color",
      required: true,
    },
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Type",
      required: true,
    },
    singer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    machineNo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Machine",
      required: true,
    },
    overlockPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rate15: {
      type: Number,
      required: true,
      min: 0,
    },
    dhaga: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    note: {
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

const Entry = mongoose.model("Entry", entrySchema);

export default Entry;