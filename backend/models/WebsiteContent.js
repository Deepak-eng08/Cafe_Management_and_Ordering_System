import mongoose from "mongoose";

const websiteContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, default: "" },
  },
  { timestamps: true }
);

const WebsiteContent = mongoose.model("WebsiteContent", websiteContentSchema);

export default WebsiteContent;
