const express = require("express");
const router = express.Router();

const Patient = require("../models/Patient");

const DAY_MS = 24 * 60 * 60 * 1000;

const computeGestationalWeek = (pregnancyStartDate) => {
  const start = pregnancyStartDate ? new Date(pregnancyStartDate) : null;
  if (!start || Number.isNaN(start.getTime())) return 1;
  const elapsedDays = Math.max(0, Math.floor((Date.now() - start.getTime()) / DAY_MS));
  return Math.min(40, Math.max(1, Math.floor(elapsedDays / 7) + 1));
};

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

const tipsByRange = [
  {
    min: 1,
    max: 4,
    tips: [
      {
        label: "ANC",
        title: "Start antenatal care early",
        desc: "Register early and plan regular antenatal contacts for checkups, supplements and counseling.",
        source: "WHO",
        referenceLink:
          "https://wkc.who.int/resources/publications/i/item/9789241549912",
      },
      {
        label: "FOLATE",
        title: "Take iron-folic acid as advised",
        desc: "Daily iron and folic acid supplementation is recommended during pregnancy to support maternal health and reduce anemia risk.",
        source: "WHO",
        referenceLink:
          "https://www.who.int/tools/elena/interventions/iron-folic-acid-pregnancy",
      },
      {
        label: "ALCOHOL",
        title: "Avoid alcohol",
        desc: "Alcohol use during pregnancy increases the risk of fetal alcohol spectrum disorders and other complications.",
        source: "WHO",
        referenceLink: "https://www.who.int/news-room/fact-sheets/detail/alcohol",
      },
      {
        label: "TOBACCO",
        title: "Avoid tobacco and smoke exposure",
        desc: "Smoking while pregnant can harm the baby, and there is no safe level of exposure to tobacco.",
        source: "WHO",
        referenceLink: "https://www.who.int/en/news-room/fact-sheets/detail/tobacco",
      },
    ],
  },
  {
    min: 5,
    max: 8,
    tips: [
      {
        label: "NUTRITION",
        title: "Eat a diverse, safe diet",
        desc: "Focus on regular meals with fruits/vegetables, pulses, eggs/milk (if used), and safe water to support pregnancy nutrition.",
        source: "MOHFW",
        referenceLink:
          "https://www.nhm.gov.in/New_Updates_2018/NHM_Components/Immunization/Guildelines_for_immunization/MCP_Card_English_version.pdf",
      },
      {
        label: "IFA",
        title: "Take iron-folic acid as advised",
        desc: "WHO recommends daily iron and folic acid supplementation in pregnancy to support maternal health and reduce anemia risk.",
        source: "WHO",
        referenceLink: "https://www.who.int/tools/elena/interventions/iron-folic-acid-pregnancy",
      },
      {
        label: "ANC",
        title: "Keep scheduled checkups",
        desc: "Use antenatal contacts to monitor blood pressure, anemia and wellbeing, and to receive counseling.",
        source: "WHO",
        referenceLink:
          "https://wkc.who.int/resources/publications/i/item/9789241549912",
      },
      {
        label: "TOBACCO",
        title: "Avoid tobacco and smoke exposure",
        desc: "Smoking while pregnant can harm the baby, and there is no safe level of exposure to tobacco.",
        source: "WHO",
        referenceLink: "https://www.who.int/en/news-room/fact-sheets/detail/tobacco",
      },
    ],
  },
  {
    min: 9,
    max: 13,
    tips: [
      {
        label: "IFA",
        title: "Continue iron-folic acid",
        desc: "Follow your provider’s advice on iron-folic acid supplementation to help prevent anemia.",
        source: "MOHFW",
        referenceLink:
          "https://nhm.gov.in/images/pdf/Anemia-Mukt-Bharat/AnemiaMuktBharatOperationalGuidelines.pdf",
      },
      {
        label: "MOVEMENT",
        title: "Move safely if you can",
        desc: "Regular activity is encouraged for most pregnant women, with health-worker guidance if there are risks.",
        source: "WHO",
        referenceLink:
          "https://wkc.who.int/resources/publications/i/item/9789240014886",
      },
      {
        label: "CHECKUP",
        title: "Don’t miss essential tests",
        desc: "Antenatal contacts include screening and counseling; follow your clinician’s plan for tests and follow-ups.",
        source: "WHO",
        referenceLink:
          "https://wkc.who.int/resources/publications/i/item/9789241549912",
      },
      {
        label: "WARNING",
        title: "Know warning signs",
        desc: "Seek care urgently for bleeding, severe headache, blurred vision, swelling, fever, or reduced fetal movement later in pregnancy.",
        source: "MOHFW",
        referenceLink:
          "https://nhm.gov.in/images/pdf/programmes/maternal-health/guidelines/my_safe_motherhood_booklet_english.pdf",
      },
    ],
  },
  {
    min: 14,
    max: 20,
    tips: [
      {
        label: "IFA",
        title: "Prevent anemia proactively",
        desc: "Continue iron-folic acid and nutrition counseling during the second trimester to reduce anemia risk.",
        source: "MOHFW",
        referenceLink:
          "https://nhm.gov.in/images/pdf/Anemia-Mukt-Bharat/AnemiaMuktBharatOperationalGuidelines.pdf",
      },
      {
        label: "CALCIUM",
        title: "Ask about calcium",
        desc: "In settings with low dietary calcium, WHO recommends calcium supplementation in pregnancy to reduce pre-eclampsia risk.",
        source: "WHO",
        referenceLink:
          "https://www.who.int/tools/elena/interventions/calcium-pregnancy",
      },
      {
        label: "MOVE",
        title: "Aim for regular activity",
        desc: "If healthy, aim for moderate activity through the week, with clinical advice on contraindications.",
        source: "WHO",
        referenceLink:
          "https://wkc.who.int/resources/publications/i/item/9789240014886",
      },
      {
        label: "VISITS",
        title: "Keep ANC appointments",
        desc: "Routine antenatal visits help monitor blood pressure, weight gain, fetal growth and overall wellbeing.",
        source: "WHO",
        referenceLink:
          "https://wkc.who.int/resources/publications/i/item/9789241549912",
      },
    ],
  },
  {
    min: 21,
    max: 27,
    tips: [
      {
        label: "TD",
        title: "Stay up to date on Td/TT",
        desc: "Follow the national schedule for tetanus/diphtheria immunization as advised by your provider.",
        source: "MOHFW",
        referenceLink:
          "https://nhm.gov.in/New_Updates_2018/NHM_Components/Immunization/Guildelines_for_immunization/Immunization_Handbook_for_Health_Workers-English.pdf",
      },
      {
        label: "ANEMIA",
        title: "Keep anemia checks on track",
        desc: "Regular hemoglobin checks and iron supplementation help detect and manage anemia early.",
        source: "MOHFW",
        referenceLink:
          "https://nhm.gov.in/images/pdf/Anemia-Mukt-Bharat/AnemiaMuktBharatOperationalGuidelines.pdf",
      },
      {
        label: "MOVE",
        title: "Stay active if safe",
        desc: "Replace sedentary time with activity; get guidance if you have medical conditions or warning signs.",
        source: "WHO",
        referenceLink:
          "https://wkc.who.int/resources/publications/i/item/9789240014886",
      },
      {
        label: "DANGER",
        title: "Seek care for danger signs",
        desc: "Go to a health facility urgently for bleeding, severe headache, convulsions, fever, severe abdominal pain, or swelling.",
        source: "MOHFW",
        referenceLink:
          "https://nhm.gov.in/images/pdf/programmes/maternal-health/guidelines/my_safe_motherhood_booklet_english.pdf",
      },
    ],
  },
  {
    min: 28,
    max: 34,
    tips: [
      {
        label: "BIRTH",
        title: "Plan for delivery",
        desc: "Discuss birth preparedness: facility, transport, documents, and emergency contacts.",
        source: "MOHFW",
        referenceLink:
          "https://nhm.gov.in/images/pdf/programmes/maternal-health/guidelines/my_safe_motherhood_booklet_english.pdf",
      },
      {
        label: "ANC",
        title: "Keep late-pregnancy checkups",
        desc: "More frequent ANC helps monitor blood pressure, fetal growth and risk conditions in the third trimester.",
        source: "WHO",
        referenceLink:
          "https://wkc.who.int/resources/publications/i/item/9789241549912",
      },
      {
        label: "REST",
        title: "Rest and manage discomfort",
        desc: "Use sleep and comfort strategies; ask your clinician about safe sleep positions and symptom management.",
        source: "WHO",
        referenceLink:
          "https://wkc.who.int/resources/publications/i/item/9789241549912",
      },
      {
        label: "ALERT",
        title: "Know when to seek urgent care",
        desc: "Seek urgent care for reduced fetal movements, bleeding, leaking fluid, severe headache, or high fever.",
        source: "MOHFW",
        referenceLink:
          "https://nhm.gov.in/images/pdf/programmes/maternal-health/guidelines/my_safe_motherhood_booklet_english.pdf",
      },
    ],
  },
  {
    min: 35,
    max: 40,
    tips: [
      {
        label: "SIGNS",
        title: "Watch for labor signs",
        desc: "Know when to go to the facility: regular painful contractions, bleeding, or leaking fluid.",
        source: "MOHFW",
        referenceLink:
          "https://nhm.gov.in/images/pdf/programmes/maternal-health/guidelines/my_safe_motherhood_booklet_english.pdf",
      },
      {
        label: "BAG",
        title: "Keep essentials ready",
        desc: "Prepare documents, medicines, clothes and newborn items in advance to reduce last-minute stress.",
        source: "MOHFW",
        referenceLink:
          "https://nhm.gov.in/images/pdf/programmes/maternal-health/guidelines/my_safe_motherhood_booklet_english.pdf",
      },
      {
        label: "VISIT",
        title: "Attend final checkups",
        desc: "Late ANC visits help detect complications early and support birth planning.",
        source: "WHO",
        referenceLink:
          "https://wkc.who.int/resources/publications/i/item/9789241549912",
      },
      {
        label: "HELP",
        title: "Seek help early",
        desc: "If you have any danger signs or feel something is wrong, seek medical attention immediately.",
        source: "MOHFW",
        referenceLink:
          "https://nhm.gov.in/images/pdf/programmes/maternal-health/guidelines/my_safe_motherhood_booklet_english.pdf",
      },
    ],
  },
];

// Returns the current gestational week for a patient.
// Accepts either:
// - `patientId` query (preferred), or
// - `email` query, or
// - `pregnancyStartDate` query (ISO string) for stateless calculation.
router.get("/", async (req, res) => {
  try {
    const { patientId, email, pregnancyStartDate } = req.query || {};

    if (pregnancyStartDate) {
      const gestationalWeek = computeGestationalWeek(pregnancyStartDate);
      return res.status(200).json({
        success: true,
        gestationalWeek,
        pregnancyStartDate,
      });
    }

    if (!patientId && !email) {
      return res.status(200).json({
        success: true,
        gestationalWeek: 1,
      });
    }

    const patient = patientId
      ? await Patient.findById(patientId).select("pregnancyStartDate gestationalWeek email")
      : await Patient.findOne({ email }).select("pregnancyStartDate gestationalWeek email");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const gestationalWeek = computeGestationalWeek(patient.pregnancyStartDate);

    // Keep DB in sync if it drifted, but avoid failing the request on save.
    if (patient.gestationalWeek !== gestationalWeek) {
      patient.gestationalWeek = gestationalWeek;
      patient.save().catch(() => {});
    }

    return res.status(200).json({
      success: true,
      gestationalWeek,
      pregnancyStartDate: patient.pregnancyStartDate,
      email: patient.email,
    });
  } catch (error) {
    console.error("Pregnancy week error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load pregnancy week",
    });
  }
});

router.get("/tips/:week", (req, res) => {
  try {
    const weekNum = Number(req.params.week);
    const week = Number.isFinite(weekNum) ? Math.max(1, Math.min(40, Math.trunc(weekNum))) : 1;

    const block = tipsByRange.find((x) => week >= x.min && week <= x.max) || tipsByRange[0];
    const tips = Array.isArray(block?.tips) ? block.tips.slice(0, 4) : [];

    return res.status(200).json({
      success: true,
      week,
      tips,
    });
  } catch (error) {
    console.error("Pregnancy tips error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load weekly tips",
    });
  }
});

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
