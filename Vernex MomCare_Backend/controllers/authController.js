const User = require("../models/User");
const Patient = require("../models/Patient");
const ApprovalRequest = require("../models/ApprovalRequest");
const bcrypt = require("bcryptjs");

// ADMIN credentials (temporary hardcoded)
const ADMIN_EMAIL = "admin@vnx.com";
const ADMIN_PASSWORD = "admin123";

// Handle plain-text legacy passwords and migrate to bcrypt
const verifyPasswordAndMigrate = async (inputPassword, userDoc) => {
  if (!userDoc || !userDoc.password) return false;

  const stored = userDoc.password;
  const isBcrypt = typeof stored === "string" && stored.startsWith("$2");

  if (isBcrypt) {
    return bcrypt.compare(inputPassword, stored);
  }

  // Legacy plain-text match, migrate to bcrypt on success
  if (inputPassword === stored) {
    const hashed = await bcrypt.hash(inputPassword, 10);
    userDoc.password = hashed;
    await userDoc.save();
    return true;
  }

  return false;
};

/* ========================= LOGIN ========================= */
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // ADMIN LOGIN
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return res.status(200).json({
        success: true,
        role: "admin",
        user: {
          id: "admin",
          email: ADMIN_EMAIL,
          name: "Admin",
        },
        message: "Admin login successful",
      });
    }

    // DOCTOR LOGIN
    if (role === "doctor") {
      const doctor = await User.findOne({ email, role: "doctor" });

      const isMatch = await verifyPasswordAndMigrate(password, doctor);
      if (!doctor || !isMatch) {
        return res.status(401).json({ success: false, message: "Invalid doctor credentials" });
      }

      return res.status(200).json({
        success: true,
        role: "doctor",
        user: {
          id: doctor._id,
          name: doctor.name,
          email: doctor.email,
          role: doctor.role,
          specialty: doctor.specialty,
          phone: doctor.phone,
          qualification: doctor.qualification,
          experience: doctor.experience,
          hospital: doctor.hospital,
          location: doctor.location,
        },
      });
    }

    // PATIENT LOGIN
    if (role === "patient") {
      const patient = await Patient.findOne({ email });

      const isMatch = await verifyPasswordAndMigrate(password, patient);
      if (!patient || !isMatch) {
        return res.status(401).json({ success: false, message: "Invalid patient credentials" });
      }

      return res.status(200).json({
        success: true,
        role: "patient",
        user: {
          id: patient._id,
          name: patient.name,
          email: patient.email,
          role: "patient",
          age: patient.age,
          pregnancyStartDate: patient.pregnancyStartDate,
          gestationalWeek: patient.gestationalWeek,
          contactPhone: patient.contactPhone,
          husbandName: patient.husbandName,
          husbandPhone: patient.husbandPhone,
          riskStatus: patient.riskStatus,
          doctorId: patient.doctorId,
        },
      });
    }

    return res.status(400).json({ success: false, message: "Invalid role selected" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ========================= ADMIN CREATE DOCTOR ========================= */
const createDoctorByAdmin = async (req, res) => {
  try {
    const { adminEmail, adminPassword, name, email, password, specialty, phone } = req.body;

    // Verify admin
    if (adminEmail !== ADMIN_EMAIL || adminPassword !== ADMIN_PASSWORD) {
      return res.status(403).json({ success: false, message: "Only admin can create doctors" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Doctor already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const doctor = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "doctor",
      specialty,
      phone,
    });

    return res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      doctor,
    });
  } catch (error) {
    console.error("Admin create doctor error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ========================= DOCTOR CREATE PATIENT (REQUEST) ========================= */
const createPatientByDoctor = async (req, res) => {
  try {
    const { doctorId, name, email, password, age, pregnancyStartDate, phone, notes } = req.body;

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(403).json({ success: false, message: "Only doctors can create patients" });
    }

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const existing = await Patient.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: "Patient already exists" });
    }

    const pendingRequest = await ApprovalRequest.findOne({
      requestType: "patient_create",
      status: "pending",
      targetKey: normalizedEmail,
    });
    if (pendingRequest) {
      return res.status(400).json({
        success: false,
        message: "A patient creation request for this email is already pending admin approval",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await ApprovalRequest.create({
      requestType: "patient_create",
      requestedBy: doctor._id,
      targetKey: normalizedEmail,
      requestNote: typeof notes === "string" ? notes.trim() : "",
      payload: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        age,
        pregnancyStartDate,
        contactPhone: phone,
        medicalNotes: notes,
        doctorId: doctor._id,
        riskStatus: "normal",
        gestationalWeek: 1,
      },
    });

    return res.status(202).json({
      success: true,
      message: "Patient registration request sent to admin for approval",
    });
  } catch (error) {
    console.error("Doctor create patient error:", error);
    return res.status(500).json({ success: false, message: "Server error while creating patient" });
  }
};

module.exports = {
  login,
  createDoctorByAdmin,
  createPatientByDoctor,
};
