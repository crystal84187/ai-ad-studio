const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const Anthropic = require("@anthropic-ai/sdk");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

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

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.get("/", (req, res) => res.json({ status: "AI Ad Studio backend running" }));

app.post("/generate", async (req, res) => {
  const { product, audience, tone, format, avatarStyle } = req.body;
  if (!product) return res.status(400).json({ error: "Product is required" });

  const prompt = `Create an ad package for this product.
Product: ${product}
Audience: ${audience || "general consumers"}
Tone: ${tone || "Energetic"}
Format: ${format || "TikTok"}
Avatar: ${avatarStyle || "influencer"}

Return ONLY valid JSON. Use simple words with no apostrophes, quotes, or special characters inside the values. Use plain English only.

{"concept":{"hook":"hook line here","idea":"concept here","emotion":"emotion here","cta":"cta here","why":"reason here"},"script":{"duration":"30s","scenes":[{"time":"0-8s","visual":"visual here","vo":"voiceover here","text":"text here"},{"time":"8-18s","visual":"visual here","vo":"voiceover here","text":"text here"},{"time":"18-25s","visual":"visual here","vo":"voiceover here","text":"text here"},{"time":"25-30s","visual":"visual here","vo":"voiceover here","text":"text here"}]},"avatar":{"look":"look here","wear":"wear here","place":"place here","voice":"voice here","move":"move here","vibe":"vibe here"},"board":{"frames":[{"n":1,"ts":"0-8s","shot":"wide","desc":"desc here","text":"text here","cut":"cut"},{"n":2,"ts":"8-18s","shot":"medium","desc":"desc here","text":"text here","cut":"cut"},{"n":3,"ts":"18-25s","shot":"close-up","desc":"desc here","text":"text here","cut":"fade"},{"n":4,"ts":"25-30s","shot":"wide","desc":"desc here","text":"text here","cut":"fade"}]}}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }]
    });

    let text = message.content[0].text;

    // Strip anything before first { and after last }
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON in response: " + text.slice(0, 200));
    
    text = text.slice(start, end + 1);
    
    // Clean up common JSON-breaking characters
    text = text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .replace(/\n/g, " ")
      .replace(/\r/g, " ")
      .replace(/\t/g, " ");

    const result = JSON.parse(text);

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

app.get("/ads", (req, res) => {
  try {
    const ads = db.prepare("SELECT id, product, tone, format, created_at FROM ads ORDER BY created_at DESC").all();
    res.json(ads);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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

app.delete("/ads/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM ads WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/chat", async (req, res) => {
  const { product, concept, message } = req.body;
  if (!message) return res.status(400).json({ error: "Message required" });
  try {
    const reply = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `Product: ${product}. Concept: ${concept || ""}. User says: ${message}. Reply in under 100 words.`
      }]
    });
    res.json({ reply: reply.content[0].text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
