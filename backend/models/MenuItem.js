import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    available: { type: Boolean, default: true },
    bestseller: { type: Boolean, default: false },
    recommended: { type: Boolean, default: false },
    newArrival: { type: Boolean, default: false },
    chefsSpecial: { type: Boolean, default: false },
    cinephilesPick: { type: Boolean, default: false },
    customersFavourite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

menuItemSchema.index({ category: 1 });
menuItemSchema.index({ available: 1 });
menuItemSchema.index({ name: "text", description: "text" });

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

export default MenuItem;
