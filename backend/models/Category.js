import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

categorySchema.index({ order: 1 });

const Category = mongoose.model("Category", categorySchema);

export default Category;
