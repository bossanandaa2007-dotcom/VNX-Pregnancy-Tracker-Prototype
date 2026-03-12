const express = require("express");

const ApprovalRequest = require("../models/ApprovalRequest");
const Patient = require("../models/Patient");
const Guide = require("../models/Guide");

const router = express.Router();

const ADMIN_EMAIL = "admin@vnx.com";
const ADMIN_PASSWORD = "admin123";

const sanitizePayload = (requestType, payload) => {
  if (!payload || typeof payload !== "object") return payload;
  if (requestType !== "patient_create") return payload;
  const next = { ...payload };
  if (next.password) next.password = "[REDACTED]";
  return next;
};

const applyApproval = async (requestDoc) => {
  const { requestType, payload } = requestDoc;

  if (requestType === "patient_create") {
    const existing = await Patient.findOne({ email: payload.email });
    if (existing) throw new Error("Patient already exists");

    await Patient.create({
      name: payload.name,
      email: payload.email,
      password: payload.password,
      age: payload.age,
      pregnancyStartDate: payload.pregnancyStartDate,
      contactPhone: payload.contactPhone,
      medicalNotes: payload.medicalNotes,
      doctorId: payload.doctorId,
      riskStatus: payload.riskStatus || "normal",
      gestationalWeek: payload.gestationalWeek || 1,
    });
    return;
  }

  if (requestType === "guide_update") {
    const { guideId, updateData } = payload || {};
    const saved = await Guide.findByIdAndUpdate(guideId, updateData, {
      new: true,
      runValidators: true,
    });
    if (!saved) throw new Error("Guide not found");
    return;
  }

  if (requestType === "guide_delete") {
    const { guideId } = payload || {};
    const deleted = await Guide.findByIdAndDelete(guideId);
    if (!deleted) throw new Error("Guide not found");
    return;
  }

  throw new Error("Unsupported request type");
};

router.get("/", async (req, res) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : "pending";
    const docs = await ApprovalRequest.find({ status })
      .populate("requestedBy", "name email role")
      .sort({ createdAt: -1 });

    const requests = docs.map((doc) => {
      const obj = doc.toObject();
      return {
        ...obj,
        payload: sanitizePayload(obj.requestType, obj.payload),
      };
    });

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("List approvals error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch approval requests",
    });
  }
});

router.get("/doctor/:doctorId", async (req, res) => {
  try {
    const { doctorId } = req.params;
    const docs = await ApprovalRequest.find({
      $or: [
        { requestedBy: doctorId },
        { targetKey: doctorId }, // backward compatibility if older data used a different keying scheme
        { "payload.doctorId": doctorId }, // patient_create payload fallback
      ],
    })
      .populate("requestedBy", "name email role")
      .sort({ createdAt: -1 });

    const requests = docs.map((doc) => {
      const obj = doc.toObject();
      return {
        ...obj,
        payload: sanitizePayload(obj.requestType, obj.payload),
      };
    });

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Doctor approvals error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor approval history",
    });
  }
});

router.post("/:id/decision", async (req, res) => {
  try {
    const { id } = req.params;
    const { action, adminEmail, adminPassword, adminNote } = req.body || {};

    if (adminEmail !== ADMIN_EMAIL || adminPassword !== ADMIN_PASSWORD) {
      return res.status(403).json({
        success: false,
        message: "Only admin can process requests",
      });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action",
      });
    }

    const doc = await ApprovalRequest.findById(id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    if (doc.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Request already processed",
      });
    }

    if (action === "approve") {
      await applyApproval(doc);
      doc.status = "approved";
    } else {
      doc.status = "rejected";
    }

    doc.adminNote = typeof adminNote === "string" ? adminNote.trim() : "";
    doc.decisionBy = adminEmail;
    doc.decisionAt = new Date();
    await doc.save();

    return res.status(200).json({
      success: true,
      message: action === "approve" ? "Request approved" : "Request rejected",
    });
  } catch (error) {
    console.error("Process approval error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to process request",
    });
  }
});

module.exports = router;
