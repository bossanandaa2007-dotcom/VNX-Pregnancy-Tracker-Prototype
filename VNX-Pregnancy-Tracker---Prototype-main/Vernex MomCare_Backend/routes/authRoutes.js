const express = require("express");
const router = express.Router();
const User = require('../models/User');
const Patient = require('../models/Patient');

const {
  login,
  createDoctorByAdmin,
  createPatientByDoctor,
} = require("../controllers/authController");

// ================= AUTH =================
router.post("/login", login);

// ================= ADMIN =================
router.post("/admin/create-doctor", createDoctorByAdmin);

// ✅ GET ALL DOCTORS WITH PATIENT COUNT (ADMIN)
router.get('/admin/doctors', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('-password');

    // 🔥 Attach patient count to each doctor
    const doctorsWithCounts = await Promise.all(
      doctors.map(async (doctor) => {
        const patientCount = await Patient.countDocuments({
          doctorId: doctor._id,
        });

        return {
          _id: doctor._id,
          name: doctor.name,
          email: doctor.email,
          specialty: doctor.specialty,
          phone: doctor.phone,
          patientCount,
        };
      })
    );

    res.status(200).json({
      success: true,
      doctors: doctorsWithCounts,
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors',
    });
  }
});

// ================= DOCTOR =================
router.post("/doctor/create-patient", createPatientByDoctor);

// Get a single patient by patient id
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findById(patientId)
      .select('-password')
      .populate('doctorId', 'name email specialty phone');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    res.status(200).json({
      success: true,
      patient,
    });
  } catch (error) {
    console.error('Fetch patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient',
    });
  }
});

// Update patient profile by patient id
router.put('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const {
      name,
      email,
      age,
      contactPhone,
      pregnancyStartDate,
      husbandName,
      husbandPhone,
    } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    if (typeof email === 'string' && email.trim() && email.trim() !== patient.email) {
      const existing = await Patient.findOne({ email: email.trim() });
      if (existing && String(existing._id) !== String(patient._id)) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }
      patient.email = email.trim();
    }

    if (typeof name === 'string' && name.trim()) {
      patient.name = name.trim();
    }

    if (age !== undefined && age !== null && age !== '') {
      const parsedAge = Number(age);
      if (!Number.isNaN(parsedAge)) patient.age = parsedAge;
    }

    if (typeof contactPhone === 'string') {
      patient.contactPhone = contactPhone.trim();
    }

    if (typeof husbandName === 'string') {
      patient.husbandName = husbandName.trim();
    }

    if (typeof husbandPhone === 'string') {
      patient.husbandPhone = husbandPhone.trim();
    }

    if (pregnancyStartDate) {
      const start = new Date(pregnancyStartDate);
      if (!Number.isNaN(start.getTime())) {
        patient.pregnancyStartDate = start;

        // Keep gestational week synced with pregnancy start date.
        const dayMs = 24 * 60 * 60 * 1000;
        const elapsedDays = Math.max(
          0,
          Math.floor((Date.now() - start.getTime()) / dayMs)
        );
        patient.gestationalWeek = Math.min(40, Math.max(1, Math.floor(elapsedDays / 7) + 1));
      }
    }

    await patient.save();

    await patient.populate('doctorId', 'name email specialty phone');
    const safePatient = patient.toObject();
    delete safePatient.password;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      patient: safePatient,
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update patient profile',
    });
  }
});

// Get a single patient by email (fallback lookup for frontend)
router.get('/patient/by-email/:email', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const patient = await Patient.findOne({ email })
      .select('-password')
      .populate('doctorId', 'name email specialty phone');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    res.status(200).json({
      success: true,
      patient,
    });
  } catch (error) {
    console.error('Fetch patient by email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient',
    });
  }
});

// Get all patients for a doctor
router.get('/doctor/patients/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;

    const patients = await Patient.find({ doctorId });

    res.status(200).json({
      success: true,
      patients,
    });
  } catch (error) {
    console.error('Fetch patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients',
    });
  }
});

// Update doctor profile by doctor id
router.put('/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const {
      name,
      email,
      specialty,
      phone,
      qualification,
      experience,
      hospital,
      location,
    } = req.body;

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    if (typeof email === 'string' && email.trim() && email.trim() !== doctor.email) {
      const existing = await User.findOne({ email: email.trim() });
      if (existing && String(existing._id) !== String(doctor._id)) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }
      doctor.email = email.trim();
    }

    if (typeof name === 'string' && name.trim()) doctor.name = name.trim();
    if (typeof specialty === 'string') doctor.specialty = specialty.trim();
    if (typeof phone === 'string') doctor.phone = phone.trim();
    if (typeof qualification === 'string') doctor.qualification = qualification.trim();
    if (typeof experience === 'string') doctor.experience = experience.trim();
    if (typeof hospital === 'string') doctor.hospital = hospital.trim();
    if (typeof location === 'string') doctor.location = location.trim();

    await doctor.save();

    const safeDoctor = doctor.toObject();
    delete safeDoctor.password;

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully',
      doctor: safeDoctor,
    });
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update doctor profile',
    });
  }
});

// Get doctor details by doctor id
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const doctor = await User.findById(doctorId).select('-password');

    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found',
      });
    }

    res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    console.error('Fetch doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor',
    });
  }
});

module.exports = router;
