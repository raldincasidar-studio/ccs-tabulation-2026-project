import mongoose from 'mongoose';

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
      default: '',
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
    rubrics: [rubricSchema],
  },
  { timestamps: true },
);

export const Category = mongoose.model('Category', categorySchema);
