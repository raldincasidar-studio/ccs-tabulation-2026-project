import mongoose from "mongoose";

const rubricSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    maxPoints: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: true, timestamps: false },
);

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // null = all active judges (legacy behavior); [] = no assigned judges.
    assignedJudges: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: null,
    },
    rubrics: [rubricSchema],
  },
  { timestamps: true },
);

export const Category = mongoose.model("Category", categorySchema);
