import mongoose from "mongoose";

const rewardHistorySchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    phone: { type: String, required: true, match: /^\d{10}$/ },
    rewardName: { type: String, required: true },
    approvedBy: { type: String, default: "Admin" },
  },
  { timestamps: true }
);

rewardHistorySchema.index({ phone: 1, createdAt: -1 });

const RewardHistory = mongoose.model("RewardHistory", rewardHistorySchema);

export default RewardHistory;
