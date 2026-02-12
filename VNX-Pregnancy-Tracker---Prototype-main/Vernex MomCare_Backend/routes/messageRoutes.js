const express = require("express");
const mongoose = require("mongoose");
const Message = require("../models/Message");
const Patient = require("../models/Patient");
const User = require("../models/User");

const router = express.Router();

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id || ""));

const asObjectId = (id) => new mongoose.Types.ObjectId(String(id));

const toMapById = (arr) =>
  new Map(arr.map((item) => [String(item._id), item]));

const resolveIdentity = async (id) => {
  const [patient, doctor] = await Promise.all([
    Patient.findById(id).select("name email"),
    User.findById(id).select("name email role specialty"),
  ]);

  if (patient) {
    return {
      id: String(patient._id),
      name: patient.name,
      email: patient.email,
      role: "patient",
    };
  }

  if (doctor) {
    return {
      id: String(doctor._id),
      name: doctor.name,
      email: doctor.email,
      role: doctor.role,
      specialty: doctor.specialty,
    };
  }

  return null;
};

// Send a doctor-patient message
router.post("/send", async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;

    if (!isValidObjectId(senderId) || !isValidObjectId(receiverId)) {
      return res.status(400).json({ success: false, message: "Invalid sender/receiver id" });
    }

    const cleanContent = String(content || "").trim();
    if (!cleanContent) {
      return res.status(400).json({ success: false, message: "Message content is required" });
    }

    const [sender, receiver] = await Promise.all([
      resolveIdentity(senderId),
      resolveIdentity(receiverId),
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ success: false, message: "Sender or receiver not found" });
    }

    const message = await Message.create({
      senderId: asObjectId(senderId),
      receiverId: asObjectId(receiverId),
      content: cleanContent,
      readAt: null,
    });

    return res.status(201).json({
      success: true,
      message: {
        _id: message._id,
        senderId: String(message.senderId),
        receiverId: String(message.receiverId),
        content: message.content,
        createdAt: message.createdAt,
        readAt: message.readAt,
      },
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
});

// Fetch thread between two users
router.get("/thread", async (req, res) => {
  try {
    const { userId, peerId } = req.query;
    if (!isValidObjectId(userId) || !isValidObjectId(peerId)) {
      return res.status(400).json({ success: false, message: "Invalid user/peer id" });
    }

    // Mark incoming messages as read when this thread is opened/refreshed.
    await Message.updateMany(
      {
        senderId: asObjectId(peerId),
        receiverId: asObjectId(userId),
        readAt: null,
      },
      { $set: { readAt: new Date() } }
    );

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: peerId },
        { senderId: peerId, receiverId: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      success: true,
      messages: messages.map((m) => ({
        _id: m._id,
        senderId: String(m.senderId),
        receiverId: String(m.receiverId),
        content: m.content,
        createdAt: m.createdAt,
        readAt: m.readAt,
      })),
    });
  } catch (error) {
    console.error("Fetch thread error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch thread" });
  }
});

// Fetch conversation list for one user (latest message per peer)
router.get("/conversations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }

    const userObjectId = asObjectId(userId);
    const allMessages = await Message.find({
      $or: [{ senderId: userObjectId }, { receiverId: userObjectId }],
    })
      .sort({ createdAt: -1 })
      .lean();

    const latestByPeer = new Map();

    for (const m of allMessages) {
      const sender = String(m.senderId);
      const receiver = String(m.receiverId);
      const peerId = sender === String(userId) ? receiver : sender;
      if (!latestByPeer.has(peerId)) {
        latestByPeer.set(peerId, m);
      }
    }

    const peerIds = [...latestByPeer.keys()];

    const unreadRows = await Message.aggregate([
      {
        $match: {
          receiverId: userObjectId,
          readAt: null,
        },
      },
      {
        $group: {
          _id: "$senderId",
          count: { $sum: 1 },
        },
      },
    ]);
    const unreadMap = new Map(unreadRows.map((r) => [String(r._id), r.count]));
    const [patients, doctors] = await Promise.all([
      Patient.find({ _id: { $in: peerIds } }).select("name email").lean(),
      User.find({ _id: { $in: peerIds } }).select("name email role specialty").lean(),
    ]);
    const patientMap = toMapById(patients);
    const doctorMap = toMapById(doctors);

    const conversations = peerIds.map((peerId) => {
      const msg = latestByPeer.get(peerId);
      const patient = patientMap.get(peerId);
      const doctor = doctorMap.get(peerId);
      const profile = patient || doctor;

      return {
        peerId,
        peerName: profile?.name || "Unknown",
        peerRole: patient ? "patient" : doctor?.role || "unknown",
        peerEmail: profile?.email || "",
        lastMessage: msg.content,
        lastAt: msg.createdAt,
        unreadCount: unreadMap.get(peerId) || 0,
      };
    });

    res.json({ success: true, conversations });
  } catch (error) {
    console.error("Fetch conversations error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch conversations" });
  }
});

// Total unread messages for one user
router.get("/unread/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: "Invalid user id" });
    }

    const totalUnread = await Message.countDocuments({
      receiverId: asObjectId(userId),
      readAt: null,
    });

    res.json({ success: true, totalUnread });
  } catch (error) {
    console.error("Unread count error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch unread count" });
  }
});

module.exports = router;
