import mongoose from 'mongoose';

const configurationSchema = new mongoose.Schema(
  {
    eventTitle: {
      type: String,
      required: true,
      trim: true,
    },
    eventDescription: {
      type: String,
      default: '',
      trim: true,
    },
    isConfigurationMode: {
      type: Boolean,
      default: true,
    },
    stats: {
      totalJudges: { type: Number, default: 0 },
      totalContestants: { type: Number, default: 0 },
    },
    liveStatus: {
      categoryActive: {
        _id: { type: String, default: '' },
        name: { type: String, default: '' },
      },
      contestantActive: {
        _id: { type: String, default: '' },
        name: { type: String, default: '' },
        image: { type: String, default: '' },
        label: { type: String, default: '' },
        group: { type: String, default: '' },
      },
    },
  },
  { timestamps: true },
);

export const Configuration = mongoose.model('Configuration', configurationSchema);
