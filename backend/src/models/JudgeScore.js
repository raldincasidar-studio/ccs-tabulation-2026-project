import mongoose from "mongoose";

const rubricScoreSchema = new mongoose.Schema(
  {
    rubricId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    score: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: true },
);

const judgeScoreSchema = new mongoose.Schema(
  {
    judgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    contestantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contestant",
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    rubricsScore: [rubricScoreSchema],
    rubricsScore: {
      type: [rubricScoreSchema],
      required: true,
      validate: {
        validator: (scores) => scores.length > 0,
        message: "At least one rubric score is required",
      },
    },
  },
  { timestamps: true },
);

judgeScoreSchema.index(
  { judgeId: 1, categoryId: 1, contestantId: 1 },
  { unique: true },
);

export const JudgeScore = mongoose.model("JudgeScore", judgeScoreSchema);
