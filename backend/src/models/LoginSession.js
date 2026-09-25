import mongoose from "mongoose";

const loginSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  generatedToken: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  date_added: {
    type: Date,
    required: true,
    default: Date.now,
  },
  date_expire: {
    type: Date,
    required: true,
  },
});

loginSessionSchema.index({ date_expire: 1 }, { expireAfterSeconds: 0 });

export const LoginSession = mongoose.model("LoginSession", loginSessionSchema);
