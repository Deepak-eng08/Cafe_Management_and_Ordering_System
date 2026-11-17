import express from "express";
import Loyalty from "../models/Loyalty.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";
import Customer from "../models/Customer.js";
import RewardClaim from "../models/RewardClaim.js";
import RewardHistory from "../models/RewardHistory.js";
import RewardRedemption from "../models/RewardRedemption.js";
import adminAuth from "../middleware/adminAuth.js";
import { getSocketIO } from "../socketServer.js";

const router = express.Router();

const REWARD_TIERS = [
  { name: "Free Coffee ☕", pointsCost: 5 },
  { name: "Free Dessert 🍰", pointsCost: 10 },
  { name: "Free Pizza 🍕", pointsCost: 20 },
];

// Deletes a customer and every piece of data tied to them:
// loyalty record, orders, reward claims/history/redemptions, customer record.
async function deleteCustomersByPhones(phones) {
  if (!phones || phones.length === 0) return { deleted: 0 };
  const unique = [...new Set(phones)];

  const members = await Loyalty.find({ phone: { $in: unique } });
  const memberIds = members.map((m) => m._id);

  await Promise.all([
    Loyalty.deleteMany({ phone: { $in: unique } }),
    Order.deleteMany({ phoneNumber: { $in: unique } }),
    Customer.deleteMany({ phone: { $in: unique } }),
    RewardClaim.deleteMany({ phone: { $in: unique } }),
    RewardHistory.deleteMany({ phone: { $in: unique } }),
    RewardRedemption.deleteMany({ customerId: { $in: memberIds } }),
  ]);

  return { deleted: members.length };
}

// DELETE /api/loyalty/all
// Permanently deletes every customer (loyalty member) and all their data.
router.delete("/all", adminAuth, async (req, res) => {
  try {
    const members = await Loyalty.find({});
    const phones = members.map((m) => m.phone);
    const memberIds = members.map((m) => m._id);

    await Promise.all([
      Loyalty.deleteMany({}),
      Order.deleteMany({}),
      Customer.deleteMany({}),
      RewardClaim.deleteMany({}),
      RewardHistory.deleteMany({}),
      RewardRedemption.deleteMany({ customerId: { $in: memberIds } }),
    ]);

    res.json({ message: `Deleted ${phones.length} customers.`, deletedCount: phones.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/loyalty
// Body: { ids: ["...", "..."] } — permanently deletes the selected customers
// and all their related data.
router.delete("/", adminAuth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids must be a non-empty array" });
    }

    const members = await Loyalty.find({ _id: { $in: ids } });
    const phones = members.map((m) => m.phone);

    await deleteCustomersByPhones(phones);

    res.json({ message: `Deleted ${members.length} customers.`, deletedCount: members.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", adminAuth, async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const query = {};
    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { name: { $regex: term, $options: "i" } },
        { phone: { $regex: term, $options: "i" } },
      ];
    }

    const total = await Loyalty.countDocuments(query);
    const members = await Loyalty.find(query)
      .sort({ loyaltyPoints: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      members,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Reward Claims: Admin gets all claims ────────────────────
router.get("/claims/pending", adminAuth, async (req, res) => {
  try {
    const claims = await RewardClaim.find({ status: "pending" }).sort({ createdAt: -1 });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Reward Claims: Admin gets all claims (for full list) ────
router.get("/claims/all", adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const total = await RewardClaim.countDocuments();
    const claims = await RewardClaim.find({})
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);
    res.json({ claims, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Reward Claims: Pending count (for sidebar badge) ────────
router.get("/claims/pending-count", adminAuth, async (req, res) => {
  try {
    const count = await RewardClaim.countDocuments({ status: "pending" });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Reward Claims: Admin approves a claim ───────────────────
router.put("/claims/:id/approve", adminAuth, async (req, res) => {
  try {
    const claim = await RewardClaim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });
    if (claim.status !== "pending") {
      return res.status(400).json({ message: "This claim is no longer pending." });
    }

    const member = await Loyalty.findOne({ phone: claim.phone });
    if (!member) return res.status(404).json({ message: "Customer not found" });

    if (member.loyaltyPoints < claim.pointsRequired) {
      return res.status(400).json({ message: "Customer no longer has enough loyalty points." });
    }

    const updatedMember = await Loyalty.findOneAndUpdate(
      { phone: claim.phone, loyaltyPoints: { $gte: claim.pointsRequired } },
      { $inc: { loyaltyPoints: -claim.pointsRequired } },
      { new: true }
    );
    if (!updatedMember) {
      return res.status(400).json({ message: "Insufficient loyalty points at time of approval." });
    }

    claim.status = "approved";
    claim.approvedAt = new Date();
    claim.approvedBy = "Admin";
    await claim.save();

    await RewardRedemption.create({
      customerId: updatedMember._id,
      rewardName: claim.rewardName,
      pointsSpent: claim.pointsRequired,
      redeemedAt: new Date(),
    });

    await RewardHistory.create({
      customerName: claim.customerName,
      phone: claim.phone,
      rewardName: claim.rewardName,
      approvedBy: "Admin",
    });

    try {
      await Notification.create({
        type: "loyalty_redeemed",
        title: "Reward Redeemed Successfully",
        message: `${claim.customerName}'s "${claim.rewardName}" has been approved. ${claim.pointsRequired} points deducted. Remaining: ${updatedMember.loyaltyPoints} points.`,
        data: { phone: claim.phone, rewardName: claim.rewardName },
      });
    } catch { /* non-critical */ }

    const io = getSocketIO();
    if (io) {
      io.to(`phone-${claim.phone}`).emit("rewardApproved", {
        claimId: claim._id.toString(),
        phone: claim.phone,
        customerName: claim.customerName,
        rewardName: claim.rewardName,
        approvedAt: claim.approvedAt,
      });
    }

    res.json({ message: "Reward approved and points deducted", claim, member: updatedMember });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Reward Claims: Admin rejects a claim ────────────────────
router.put("/claims/:id/reject", adminAuth, async (req, res) => {
  try {
    const claim = await RewardClaim.findById(req.params.id);
    if (!claim) return res.status(404).json({ message: "Claim not found" });
    if (claim.status !== "pending") {
      return res.status(400).json({ message: "This claim is no longer pending." });
    }

    claim.status = "rejected";
    await claim.save();

    res.json({ message: "Claim rejected. Customer keeps all their points.", claim });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Reward History: Admin gets all redemption history ───────
router.get("/history", adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const total = await RewardHistory.countDocuments();
    const history = await RewardHistory.find({})
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      history,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:phone", async (req, res) => {
  try {
    const { phone } = req.params;
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Phone must be exactly 10 digits" });
    }
    const member = await Loyalty.findOne({ phone });
    if (!member) return res.status(404).json({ message: "Member not found" });

    const orders = await Order.find({ phoneNumber: phone })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ member, orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Customer: Check pending claim status ────────────────────
router.get("/:phone/claim-status", async (req, res) => {
  try {
    const { phone } = req.params;
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Phone must be exactly 10 digits" });
    }
    const pendingClaim = await RewardClaim.findOne({ phone, status: "pending" });
    const latestClaim = await RewardClaim.findOne({ phone }).sort({ createdAt: -1 });
    res.json({ pendingClaim: pendingClaim || null, latestClaim: latestClaim || null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:phone/points", adminAuth, async (req, res) => {
  try {
    const { phone } = req.params;
    const { points } = req.body;
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Phone must be exactly 10 digits" });
    }
    if (points === undefined || typeof points !== "number" || points < 0) {
      return res.status(400).json({ message: "points must be a non-negative number" });
    }
    const member = await Loyalty.findOneAndUpdate(
      { phone },
      { loyaltyPoints: points },
      { new: true }
    );
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:phone/redeem", adminAuth, async (req, res) => {
  try {
    const { phone } = req.params;
    const { reward, pointsCost } = req.body;
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Phone must be exactly 10 digits" });
    }
    if (!reward) {
      return res.status(400).json({ message: "reward name is required" });
    }
    const member = await Loyalty.findOne({ phone });
    if (!member) return res.status(404).json({ message: "Member not found" });

    const cost = pointsCost || 0;
    if (member.loyaltyPoints < cost) {
      return res.status(400).json({ message: "Insufficient loyalty points" });
    }

    member.loyaltyPoints -= cost;
    member.rewardStatus = reward;
    await member.save();

    try {
      await Notification.create({
        type: "loyalty_redeemed",
        title: "Loyalty Reward Redeemed",
        message: `${member.name} (${phone}) redeemed "${reward}" for ${cost} points`,
        data: { phone, reward },
      });
    } catch { /* non-critical */ }

    res.json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Reward Claim: Customer submits a claim request ──────────
router.post("/:phone/claim", async (req, res) => {
  try {
    const { phone } = req.params;
    const { rewardName } = req.body;
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Phone must be exactly 10 digits" });
    }
    if (!rewardName) {
      return res.status(400).json({ message: "rewardName is required" });
    }

    const tier = REWARD_TIERS.find((t) => t.name === rewardName);
    if (!tier) {
      return res.status(400).json({ message: "Invalid reward name" });
    }

    const member = await Loyalty.findOne({ phone });
    if (!member) return res.status(404).json({ message: "Member not found" });

    if (member.loyaltyPoints < tier.pointsCost) {
      return res.status(400).json({ message: "Insufficient loyalty points" });
    }

    const existingPending = await RewardClaim.findOne({ phone, status: "pending" });
    if (existingPending) {
      return res.status(400).json({ message: "You already have a pending reward request. Please wait for admin approval." });
    }

    const claim = await RewardClaim.create({
      customerName: member.name,
      phone,
      rewardName,
      pointsRequired: tier.pointsCost,
      currentLoyaltyPoints: member.loyaltyPoints,
      status: "pending",
    });

    try {
      await Notification.create({
        type: "reward_claim",
        title: "New Reward Claim",
        message: `${member.name} requested "${rewardName}" (${tier.pointsCost} points). Phone: ${phone}`,
        data: { phone, rewardName, claimId: claim._id },
      });
    } catch { /* non-critical */ }

    res.status(201).json({
      message: "Your reward request has been sent to the cafe. Please collect your reward after admin approval.",
      claim,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
