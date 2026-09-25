import mongoose from "mongoose";

const liveStatusSchema = new mongoose.Schema(
  {
    categoryActive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    contestantActive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contestant",
      default: null,
    },
  },
  { _id: false },
);

const configurationSchema = new mongoose.Schema(
  {
    eventTitle: {
      type: String,
      required: true,
      trim: true,
    },
    eventDescription: {
      type: String,
      default: "",
      trim: true,
    },
    isConfigurationMode: {
      type: Boolean,
      default: true,
    },
    liveStatus: {
      type: liveStatusSchema,
      default: {
        categoryActive: null,
        contestantActive: null,
      },
    },
  },
  { timestamps: true },
);

export const Configuration = mongoose.model(
  "Configuration",
  configurationSchema,
);
