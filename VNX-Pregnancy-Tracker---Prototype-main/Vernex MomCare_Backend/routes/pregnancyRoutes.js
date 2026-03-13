const express = require("express");
const router = express.Router();

const developmentByRange = [
  {
    min: 1,
    max: 4,
    summary:
      "Your baby is beginning to form foundational structures. Early cells are organizing rapidly.",
    highlights: [
      "Implantation and early placental support are underway",
      "Major growth signals start in the embryo",
      "Focus on folic acid, rest, and hydration",
    ],
  },
  {
    min: 5,
    max: 8,
    summary:
      "Core organs begin forming quickly. This is a high-growth stage for early development.",
    highlights: [
      "Heart activity starts and strengthens",
      "Neural tube and brain structures keep developing",
      "Regular prenatal vitamins are especially important",
    ],
  },
  {
    min: 9,
    max: 13,
    summary:
      "Your baby transitions into the fetal stage with clearer body features and steady growth.",
    highlights: [
      "Face and limb features become more defined",
      "Movement begins, though usually not felt yet",
      "First trimester care and nutrition remain key",
    ],
  },
  {
    min: 14,
    max: 20,
    summary:
      "Growth accelerates and your baby becomes more active. Senses start maturing.",
    highlights: [
      "Bones and muscles are strengthening",
      "Hearing pathways begin developing",
      "Some mothers start feeling baby movements",
    ],
  },
  {
    min: 21,
    max: 27,
    summary:
      "Your baby continues steady growth and development every day.",
    highlights: [
      "Sleep and wake cycles become more defined",
      "Lungs and brain continue to mature",
      "Maintain hydration, rest, and regular checkups",
    ],
  },
  {
    min: 28,
    max: 34,
    summary:
      "Your baby is gaining weight and preparing for life outside the womb.",
    highlights: [
      "Body fat increases to help temperature control",
      "Brain connections grow rapidly",
      "Practice movement tracking and attend scheduled visits",
    ],
  },
  {
    min: 35,
    max: 40,
    summary:
      "Final growth and maturation phase. Your baby is preparing for delivery.",
    highlights: [
      "Lungs reach near-full readiness",
      "Positioning for birth typically occurs",
      "Stay alert for labor signs and keep hospital plan ready",
    ],
  },
];

router.get("/development/:week", (req, res) => {
  try {
    const weekNum = Number(req.params.week);
    const week = Number.isFinite(weekNum) ? Math.max(1, Math.min(40, weekNum)) : 1;

    const block =
      developmentByRange.find((x) => week >= x.min && week <= x.max) || developmentByRange[0];

    res.status(200).json({
      success: true,
      week,
      summary: block.summary,
      highlights: block.highlights,
    });
  } catch (error) {
    console.error("Pregnancy development error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load baby development content",
    });
  }
});

module.exports = router;
