import mongoose from "mongoose";

const contestantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContestantGroup",
      required: true,
    },
  },
  { timestamps: true },
);

export const Contestant = mongoose.model("Contestant", contestantSchema);
