import mongoose from "mongoose";

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
      isStandby: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true },
);

export const Configuration = mongoose.model(
  "Configuration",
  configurationSchema,
);
