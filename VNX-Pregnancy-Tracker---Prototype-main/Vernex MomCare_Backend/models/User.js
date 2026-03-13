const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["doctor", "admin"],
      required: true,
    },
    specialty: String,
    phone: String,
    qualification: String,
    experience: String,
    hospital: String,
    location: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
