const mongoose = require("mongoose");

const diaryEntrySchema = new mongoose.Schema(
  {
    // Legacy-compatible fields (existing DB index may rely on these names).
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    entryDate: { type: String, required: true },

    // Current app fields.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    date: { type: String, required: true }, // yyyy-mm-dd (local date)
    text: { type: String, default: "" },
    mood: { type: String, enum: ["happy", "calm", "tired", "sad"], default: undefined },
    imageData: { type: String, default: "" }, // base64 data URL
  },
  { timestamps: true }
);

// Keep both naming styles in sync for reads/writes across older and newer code.
diaryEntrySchema.pre("validate", function (next) {
  if (!this.userId && this.patientId) this.userId = this.patientId;
  if (!this.patientId && this.userId) this.patientId = this.userId;
  if (!this.date && this.entryDate) this.date = this.entryDate;
  if (!this.entryDate && this.date) this.entryDate = this.date;
  next();
});

diaryEntrySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DiaryEntry", diaryEntrySchema);
