import "dotenv/config";
import mongoose from "mongoose";
import Category from "./models/Category.js";
import WebsiteContent from "./models/WebsiteContent.js";

// Default data.
// Seeding is SAFE to re-run any number of times:
//   - categories are upserted by their UNIQUE `name`
//   - website content is upserted by its UNIQUE `key`
// It uses $setOnInsert only, so it NEVER deletes, drops, or overwrites
// existing records, and it can never create duplicates like "Classic Maggie"
// appearing twice. Existing entries are always left untouched.
const DEFAULT_CATEGORIES = ["Starters", "Pizza", "Pasta", "Burgers", "Beverages", "Desserts"];

const DEFAULT_CONTENT = {
  cafeName: "Cinephile's Cafe",
  heroTitle: "Good Food. Great Movies.",
  heroSubtitle: "Where cinematic vibes meet cafe culture",
  heroDescription: "A cozy haven for movie lovers and food enthusiasts.",
  aboutUs: "Welcome to Cinephile's Cafe — a cozy haven for movie lovers and food enthusiasts.",
  openingHours: "10:00 AM - 10:00 PM",
  contactNumber: "",
  address: "",
};

// Seeding is a deliberate, manual operation (npm run seed). It is never run
// automatically by the server. Refuse to run if the connection string is missing
// instead of silently falling back to a local database.
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error(
    "MONGO_URI is not set. Add the MongoDB Atlas connection string to the MONGO_URI environment variable (see backend/.env.example) and run the seed again."
  );
  process.exit(1);
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  // Upsert default categories by their unique `name`. Existing categories
  // (including any the admin created) are left completely untouched.
  const catResults = await Promise.all(
    DEFAULT_CATEGORIES.map((name, order) =>
      Category.updateOne({ name }, { $setOnInsert: { name, order } }, { upsert: true })
    )
  );
  const catsCreated = catResults.filter((r) => r.upsertedCount > 0).length;
  console.log(
    `Categories: ${catsCreated} created, ${DEFAULT_CATEGORIES.length - catsCreated} already existed (left untouched)`
  );

  // Upsert default website content by its unique `key`. Runtime keys such as
  // kitchenStatus / kitchenLastUpdated are not default keys, so they are never
  // touched, and existing content values are never overwritten.
  const contentResults = await Promise.all(
    Object.entries(DEFAULT_CONTENT).map(([key, value]) =>
      WebsiteContent.updateOne({ key }, { $setOnInsert: { key, value } }, { upsert: true })
    )
  );
  const contentCreated = contentResults.filter((r) => r.upsertedCount > 0).length;
  console.log(
    `Website content: ${contentCreated} created, ${Object.keys(DEFAULT_CONTENT).length - contentCreated} already existed (left untouched)`
  );

  await mongoose.disconnect();
  console.log("Seed complete. No records were deleted or overwritten.");
}

seed().catch((err) => {
  console.error("Seed error:", err.message);
  process.exit(1);
});
