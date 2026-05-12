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
      type: String,
      required: true,
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
      // Singer should be a user (filter by role or type)
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
      required: true,
      // Singer should be a user (filter by role or type)
    },
    rate15: {
      type: Number,
      required: true,
      min: 0,
      // Rate for machine/dhaga
    },
    dhaga: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      // Dhaga should be a user (filter by dhaga type)
    },
    note: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

const Entry = mongoose.model("Entry", entrySchema);

export default Entry;