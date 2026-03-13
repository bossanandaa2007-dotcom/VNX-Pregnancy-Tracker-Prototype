const mongoose = require("mongoose");

const approvalRequestSchema = new mongoose.Schema(
  {
    requestType: {
      type: String,
      enum: ["patient_create", "guide_create", "guide_update", "guide_delete"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetKey: {
      type: String,
      index: true,
    },
    requestNote: {
      type: String,
      trim: true,
      default: "",
    },
    adminNote: {
      type: String,
      trim: true,
      default: "",
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    decisionAt: {
      type: Date,
      default: null,
    },
    decisionBy: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ApprovalRequest", approvalRequestSchema);
