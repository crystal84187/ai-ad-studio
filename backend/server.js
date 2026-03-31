const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const Anthropic = require("@anthropic-ai/sdk");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

// ── Database ──
const db = new Database(path.join(__dirname, "ads.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product TEXT NOT NULL,
    audience TEXT,
    tone TEXT,
    format TEXT,
    avatar_style TEXT,
    result TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ── Anthropic ──
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Routes ──

// Health check
app.get("/", (req, res) => res.json({ status: "AI Ad Studio backend running" }));

// Generate ad
app.post("/generate", async (req, res) => {
  const { product, audience, tone, format, avatarStyle } = req.body;

  if (!product) return res.status(400).json({ error: "Product is required" });

  const prompt = `You are an expert ad creative director. Create a complete ad package for this product.

Product: ${product}
Audience: ${audience || "general consumers"}
Tone: ${tone || "Energetic"}
Format: ${format || "TikTok / Reels (15-30s)"}
Avatar style: ${avatarStyle || "influencer"}

Respond with ONLY this JSON. No explanation. No markdown. No code fences. Start with { end with }:

{"concept":{"hook":"punchy one-liner opening","idea":"core concept 2-3 sentences","emotion":"primary emotion","cta":"call to action","why":"why it works"},"script":{"duration":"30s","scenes":[{"time":"0-8s","visual":"what camera shows","vo":"spoken words","text":"overlay text"},{"time":"8-18s","visual":"what camera shows","vo":"spoken words","text":"overlay text"},{"time":"18-25s","visual":"what camera shows","vo":"spoken words","text":"overlay text"},{"time":"25-30s","visual":"what camera shows","vo":"spoken words","text":"overlay text"}]},"avatar":{"look":"physical appearance","wear":"wardrobe","place":"setting","voice":"voice style","move":"gestures","vibe":"energy"},"board":{"frames":[{"n":1,"ts":"0-8s","shot":"wide","desc":"visual description","text":"overlay","cut":"cut"},{"n":2,"ts":"8-18s","shot":"medium","desc":"visual description","text":"overlay","cut":"cut"},{"n":3,"ts":"18-25s","shot":"close-up","desc":"visual description","text":"overlay","cut":"fade"},{"n":4,"ts":"25-30s","shot":"wide","desc":"visual description","text":"overlay","cut":"fade"}]}}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }]
    });

    const text = message.content[0].text;

    // Extract JSON
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON found in response");
    const result = JSON.parse(text.slice(start, end + 1));

    // Save to database
    const stmt = db.prepare(
      "INSERT INTO ads (product, audience, tone, format, avatar_style, result) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const info = stmt.run(product, audience, tone, format, avatarStyle, JSON.stringify(result));

    res.json({ id: info.lastInsertRowid, result });

  } catch (e) {
    console.error("Generate error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// Get all saved ads
app.get("/ads", (req, res) => {
  try {
    const ads = db.prepare("SELECT id, product, tone, format, created_at FROM ads ORDER BY created_at DESC").all();
    res.json(ads);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get single ad
app.get("/ads/:id", (req, res) => {
  try {
    const ad = db.prepare("SELECT * FROM ads WHERE id = ?").get(req.params.id);
    if (!ad) return res.status(404).json({ error: "Ad not found" });
    ad.result = JSON.parse(ad.result);
    res.json(ad);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete ad
app.delete("/ads/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM ads WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Chat / refine
app.post("/chat", async (req, res) => {
  const { product, concept, message } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });

  try {
    const reply = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `Product: ${product}. Ad concept: ${concept || ""}. User says: "${message}". Reply helpfully in under 120 words.`
      }]
    });
    res.json({ reply: reply.content[0].text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
