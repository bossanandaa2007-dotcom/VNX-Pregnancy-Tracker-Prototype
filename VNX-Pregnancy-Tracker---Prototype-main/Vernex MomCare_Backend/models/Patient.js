const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    age: Number,
    pregnancyStartDate: { type: Date, required: true },
    gestationalWeek: Number,

    contactPhone: String,
    husbandName: String,
    husbandPhone: String,
    medicalNotes: String,

    riskStatus: {
      type: String,
      enum: ["normal", "attention", "high-risk"],
      default: "normal",
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);
