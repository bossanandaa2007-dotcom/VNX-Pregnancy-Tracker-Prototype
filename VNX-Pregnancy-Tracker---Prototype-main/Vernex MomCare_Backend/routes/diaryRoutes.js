const express = require("express");
const DiaryEntry = require("../models/DiaryEntry");

const router = express.Router();

const normalizeDate = (raw) => {
  if (!raw) return "";
  const asString = String(raw).trim();
  // expected format from frontend input[type=date]: yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(asString)) return asString;
  const parsed = new Date(asString);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

// Get entry for a date
router.get("/", async (req, res) => {
  try {
    const { userId, date } = req.query;
    if (!userId) return res.status(400).json({ error: "User ID required" });
    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) return res.status(400).json({ error: "Valid date required" });

    const entry = await DiaryEntry.findOne({
      $or: [
        { userId, date: normalizedDate },
        { patientId: userId, entryDate: normalizedDate },
      ],
    }).lean();
    res.json({ entry: entry || null });
  } catch (err) {
    console.error("Diary fetch error:", err);
    res.status(500).json({ error: "Failed to fetch diary entry" });
  }
});

// Create or update entry
router.post("/upsert", async (req, res) => {
  try {
    const { userId, date, text, mood, imageData } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });
    const normalizedDate = normalizeDate(date);
    if (!normalizedDate) return res.status(400).json({ error: "Valid date required" });

    const update = {
      text: text || "",
      mood: mood || undefined,
      imageData: imageData || "",
    };

    const entry = await DiaryEntry.findOneAndUpdate(
      {
        $or: [
          { userId, date: normalizedDate },
          { patientId: userId, entryDate: normalizedDate },
        ],
      },
      {
        $set: {
          ...update,
          userId,
          date: normalizedDate,
          patientId: userId,
          entryDate: normalizedDate,
        },
      },
      { new: true, upsert: true }
    );

    res.json({ entry });
  } catch (err) {
    console.error("Diary upsert error:", err);
    res.status(500).json({ error: "Failed to save diary entry" });
  }
});

module.exports = router;
