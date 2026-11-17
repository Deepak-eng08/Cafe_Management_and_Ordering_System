import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    duration: {
      type: String,
      enum: ["custom", "today", "tomorrow", "7days", "30days", "year"],
      default: "custom",
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true }
);

offerSchema.index({ startDate: 1, endDate: 1 });
offerSchema.index({ duration: 1 });

const Offer = mongoose.model("Offer", offerSchema);

export default Offer;
