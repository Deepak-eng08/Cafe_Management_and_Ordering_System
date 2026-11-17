import mongoose from "mongoose";

const rewardClaimSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    phone: { type: String, required: true, match: /^\d{10}$/ },
    rewardName: { type: String, required: true },
    pointsRequired: { type: Number, required: true },
    currentLoyaltyPoints: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: String, default: null },
  },
  { timestamps: true }
);

rewardClaimSchema.index({ status: 1, createdAt: -1 });
rewardClaimSchema.index({ phone: 1, status: 1 });

const RewardClaim = mongoose.model("RewardClaim", rewardClaimSchema);

export default RewardClaim;
