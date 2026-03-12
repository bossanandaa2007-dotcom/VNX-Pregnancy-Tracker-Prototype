const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Guide = require("../models/Guide");
const User = require("../models/User");
const ApprovalRequest = require("../models/ApprovalRequest");
const guideDataset = require("../data/guideDataset");

const isAllowedReference = (source, referenceLink) => {
  if (!referenceLink) return true;
  try {
    const url = new URL(referenceLink);
    const host = (url.hostname || "").toLowerCase();

    const WHO_HOSTS = new Set(["who.int", "www.who.int", "wkc.who.int", "iris.who.int"]);
    const MOHFW_HOSTS = new Set([
      "mohfw.gov.in",
      "www.mohfw.gov.in",
      "rch.mohfw.gov.in",
      "nhm.gov.in",
      "www.nhm.gov.in",
    ]);

    if (source === "WHO") return WHO_HOSTS.has(host);
    if (source === "MOHFW") return MOHFW_HOSTS.has(host);
    return WHO_HOSTS.has(host) || MOHFW_HOSTS.has(host);
  } catch {
    return false;
  }
};

// GET guides for a specific pregnancy week
router.get("/week/:week", async (req, res) => {
  try {
    const weekNum = Number(req.params.week);
    const week = Number.isFinite(weekNum) ? Math.max(1, Math.min(40, Math.trunc(weekNum))) : 1;

    const guides = await Guide.find({
      weekStart: { $lte: week },
      weekEnd: { $gte: week },
    });

    const fallback = (Array.isArray(guideDataset) ? guideDataset : [])
      .filter((g) => week >= Number(g.weekStart) && week <= Number(g.weekEnd))
      .map((g, idx) => ({ ...g, _id: `seed-${week}-${idx}` }));

    if (Array.isArray(guides) && guides.length > 0) {
      // If DB already has some guides, top up from dataset to ensure richer content.
      const seen = new Set(
        guides
          .map((g) => (g?.title ? String(g.title).trim().toLowerCase() : ""))
          .filter(Boolean)
      );
      const extra = fallback.filter((g) => !seen.has(String(g.title).trim().toLowerCase()));
      return res.json([...guides, ...extra]);
    }

    // Fallback: return dataset content if DB is empty or seed hasn't been run.
    return res.json(fallback);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// UPDATE a guide
// - Doctor: creates pending admin approval request (note required)
// - Admin/system: updates directly
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorId, note, ...update } = req.body || {};

    if (update.referenceLink && !isAllowedReference(update.source, update.referenceLink)) {
      return res.status(400).json({
        message: "Invalid referenceLink. Only WHO / MOHFW official domains are allowed.",
      });
    }

    if (doctorId) {
      if (!mongoose.Types.ObjectId.isValid(String(doctorId))) {
        return res.status(400).json({ message: "Invalid doctor session. Please login again." });
      }

      const doctor = await User.findById(doctorId);
      if (!doctor || doctor.role !== "doctor") {
        return res.status(403).json({ message: "Only doctors can submit guide update requests" });
      }

      if (!String(note || "").trim()) {
        return res.status(400).json({ message: "A note is required to request guide edits" });
      }

      const targetGuide = await Guide.findById(id);
      if (!targetGuide) {
        return res.status(404).json({ message: "Guide not found" });
      }

      const pending = await ApprovalRequest.findOne({
        requestType: "guide_update",
        status: "pending",
        targetKey: String(id),
      });
      if (pending) {
        return res.status(400).json({ message: "A guide update request is already pending for this guide" });
      }

      await ApprovalRequest.create({
        requestType: "guide_update",
        requestedBy: doctor._id,
        targetKey: String(id),
        requestNote: String(note).trim(),
        payload: {
          guideId: id,
          updateData: update,
          guideTitle: targetGuide.title,
        },
      });

      return res.status(202).json({
        success: true,
        message: "Guide edit request sent to admin for approval",
      });
    }

    const saved = await Guide.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!saved) {
      return res.status(404).json({ message: "Guide not found" });
    }

    return res.json(saved);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error updating guide" });
  }
});

// DELETE a guide
// - Doctor: creates pending admin approval request (note required)
// - Admin/system: deletes directly
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorId, note } = req.body || {};

    if (doctorId) {
      if (!mongoose.Types.ObjectId.isValid(String(doctorId))) {
        return res.status(400).json({ message: "Invalid doctor session. Please login again." });
      }

      const doctor = await User.findById(doctorId);
      if (!doctor || doctor.role !== "doctor") {
        return res.status(403).json({ message: "Only doctors can submit guide delete requests" });
      }

      if (!String(note || "").trim()) {
        return res.status(400).json({ message: "A note is required to request guide deletion" });
      }

      const targetGuide = await Guide.findById(id);
      if (!targetGuide) {
        return res.status(404).json({ message: "Guide not found" });
      }

      const pending = await ApprovalRequest.findOne({
        requestType: "guide_delete",
        status: "pending",
        targetKey: String(id),
      });
      if (pending) {
        return res.status(400).json({ message: "A guide delete request is already pending for this guide" });
      }

      await ApprovalRequest.create({
        requestType: "guide_delete",
        requestedBy: doctor._id,
        targetKey: String(id),
        requestNote: String(note).trim(),
        payload: {
          guideId: id,
          guideTitle: targetGuide.title,
        },
      });

      return res.status(202).json({
        success: true,
        message: "Guide delete request sent to admin for approval",
      });
    }

    const deleted = await Guide.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Guide not found" });
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error deleting guide" });
  }
});

// CREATE new guide (Admin / Doctor)
router.post("/", async (req, res) => {
  try {
    if (req.body?.referenceLink && !isAllowedReference(req.body?.source, req.body?.referenceLink)) {
      return res.status(400).json({
        message: "Invalid referenceLink. Only WHO / MOHFW official domains are allowed.",
      });
    }

    const newGuide = new Guide(req.body);
    const savedGuide = await newGuide.save();

    return res.json(savedGuide);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error creating guide" });
  }
});

module.exports = router;
