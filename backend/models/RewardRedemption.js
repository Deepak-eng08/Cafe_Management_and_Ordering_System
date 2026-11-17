import mongoose from "mongoose";

const rewardRedemptionSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Loyalty", required: true },
    rewardName: { type: String, required: true },
    pointsSpent: { type: Number, required: true, min: 0 },
    redeemedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

rewardRedemptionSchema.index({ customerId: 1, redeemedAt: -1 });

const RewardRedemption = mongoose.model("RewardRedemption", rewardRedemptionSchema);

export default RewardRedemption;
