import mongoose from 'mongoose';

const rubricScoreSchema = new mongoose.Schema(
  {
    rubricId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
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
      ref: 'User',
      required: true,
    },
    contestantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contestant',
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    rubricsScore: [rubricScoreSchema],
  },
  { timestamps: true },
);

export const JudgeScore = mongoose.model('JudgeScore', judgeScoreSchema);
