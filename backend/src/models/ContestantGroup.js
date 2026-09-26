import mongoose from "mongoose";

const contestantGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    categoriesIncluded: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
  },
  { timestamps: true },
);

export const ContestantGroup = mongoose.model(
  "ContestantGroup",
  contestantGroupSchema,
);
