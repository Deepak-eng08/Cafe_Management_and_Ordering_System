import mongoose from "mongoose";

const loyaltySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: {
      type: String,
      required: true,
      unique: true,
      match: /^\d{10}$/,
    },
    totalOrders: { type: Number, default: 0, min: 0 },
    totalAmountSpent: { type: Number, default: 0, min: 0 },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
    rewardStatus: { type: String, default: "none" },
    currentRewardStatus: { type: String, default: "locked" },
    rewardStates: {
      type: Map,
      of: {
        type: String,
        enum: ["locked", "ready_to_claim", "pending_approval", "redeemed"],
      },
      default: {},
    },
    lastOrderDate: { type: Date, default: null },
  },
  { timestamps: true }
);

const Loyalty = mongoose.model("Loyalty", loyaltySchema);

export default Loyalty;
