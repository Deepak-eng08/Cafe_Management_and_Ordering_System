import mongoose from "mongoose";

// One customer = identified by phone number
// totalOrders counts only completed orders with total >= ₹200
const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: {
      type: String,
      required: true,
      unique: true,
      match: /^\d{10}$/,
    },
    totalOrders: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
