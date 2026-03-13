const express = require("express");
const router = express.Router();
const AiMessage = require("../models/AiMessage");
const ChatSession = require("../models/ChatSession");

const systemPrompt = [
  "Your name is Thozhi.",
  "You are a caring, feminine pregnancy companion and supportive friend.",
  "Be warm, gentle, and medically responsible.",
  "Do not diagnose or replace a clinician.",
  "Avoid repeating the exact same reply; tailor to the user's message.",
].join("\n");

let cachedModelName = null;

const candidateModels = () =>
  [
    process.env.GEMINI_MODEL,
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash-8b",
    "gemini-1.0-pro",
  ].filter(Boolean);

const listModels = async (apiKey) => {
  const url =
    "https://generativelanguage.googleapis.com/v1/models?key=" + apiKey;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "ListModels failed");
  }
  const models = data?.models || [];
  return models
    .filter((m) =>
      (m.supportedGenerationMethods || []).includes("generateContent")
    )
    .map((m) => m.name.replace(/^models\//, ""));
};

const pickModelName = async (apiKey) => {
  if (cachedModelName) return cachedModelName;
  const available = new Set(await listModels(apiKey));
  for (const name of candidateModels()) {
    if (available.has(name)) {
      cachedModelName = name;
      return cachedModelName;
    }
  }
  cachedModelName = [...available][0];
  return cachedModelName;
};

const callGemini = async (modelName, message, apiKey) => {
  const url =
    "https://generativelanguage.googleapis.com/v1/models/" +
    modelName +
    ":generateContent?key=" +
    apiKey;
  const prompt = `${systemPrompt}\n\nUser message:\n${message}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 512,
      },
    }),
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
};

router.post("/chat", async (req, res) => {
  try {
    const { message, userId, sessionId } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });
    if (!userId) return res.status(400).json({ error: "User ID required" });
    if (!sessionId) return res.status(400).json({ error: "Session ID required" });
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY not set" });
    }

    await AiMessage.create({
      userId,
      sessionId,
      role: "user",
      content: message,
    });
    await ChatSession.findByIdAndUpdate(
      sessionId,
      { lastMessage: message, lastAt: new Date() },
      { upsert: true }
    );

    const modelName = await pickModelName(process.env.GEMINI_API_KEY);
    const result = await callGemini(
      modelName,
      message,
      process.env.GEMINI_API_KEY
    );

    if (!result.ok) {
      console.error("Gemini API error:", result.data);
      return res.status(500).json({ error: "AI failed" });
    }

    const reply =
      result?.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I am here with you. Please tell me more.";

    await AiMessage.create({
      userId,
      sessionId,
      role: "assistant",
      content: reply,
    });
    await ChatSession.findByIdAndUpdate(
      sessionId,
      { lastMessage: reply, lastAt: new Date() },
      { upsert: true }
    );

    res.set("X-Gemini-Model", modelName);
    return res.json({ reply });
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ error: "AI failed" });
  }
});

router.get("/history", async (req, res) => {
  try {
    const { userId, sessionId, limit } = req.query;
    if (!userId) return res.status(400).json({ error: "User ID required" });
    if (!sessionId) return res.status(400).json({ error: "Session ID required" });

    const safeLimit = Math.min(Number(limit) || 50, 200);
    const messages = await AiMessage.find({ userId, sessionId })
      .sort({ createdAt: 1 })
      .limit(safeLimit)
      .lean();

    res.json({ messages });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ error: "History failed" });
  }
});

router.post("/sessions", async (req, res) => {
  try {
    const { userId, title } = req.body;
    if (!userId) return res.status(400).json({ error: "User ID required" });
    const session = await ChatSession.create({
      userId,
      title: title || "",
      lastMessage: "",
      lastAt: new Date(),
    });
    res.json({ session });
  } catch (err) {
    console.error("Create session error:", err);
    res.status(500).json({ error: "Create session failed" });
  }
});

router.get("/sessions", async (req, res) => {
  try {
    const { userId, limit } = req.query;
    if (!userId) return res.status(400).json({ error: "User ID required" });
    const safeLimit = Math.min(Number(limit) || 50, 200);

    const sessions = await ChatSession.find({ userId })
      .sort({ lastAt: -1 })
      .limit(safeLimit)
      .lean();

    res.json({ sessions });
  } catch (err) {
    console.error("Sessions error:", err);
    res.status(500).json({ error: "Sessions failed" });
  }
});

router.delete("/sessions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await ChatSession.deleteOne({ _id: id });
    await AiMessage.deleteMany({ sessionId: id });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete session error:", err);
    res.status(500).json({ error: "Delete session failed" });
  }
});

router.patch("/sessions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "Title required" });
    const session = await ChatSession.findByIdAndUpdate(
      id,
      { title },
      { new: true }
    );
    res.json({ session });
  } catch (err) {
    console.error("Rename session error:", err);
    res.status(500).json({ error: "Rename session failed" });
  }
});

module.exports = router;
