import mongoose from 'mongoose';

const contestantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ContestantGroup',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export const Contestant = mongoose.model('Contestant', contestantSchema);
