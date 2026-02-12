const mongoose = require("mongoose");

const healthEntrySchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    weight: Number,
    bloodPressure: String,
    sugarLevel: String,
    symptoms: String,
    notes: String,
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HealthEntry", healthEntrySchema);
