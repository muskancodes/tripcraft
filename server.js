import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const IS_HOSTED = process.env.HOSTED === 'true';   // set in Railway env vars
const APP_PASSWORD = process.env.APP_PASSWORD || '';  // set in Railway env vars

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ── Simple password protection (hosted mode only) ──────────────────
// All /api routes require ?token=PASSWORD or Authorization: Bearer PASSWORD
// The frontend sends the token stored in localStorage.
if (IS_HOSTED && APP_PASSWORD) {
  app.use('/api', (req, res, next) => {
    const token =
      req.query.token ||
      (req.headers.authorization || '').replace('Bearer ', '');
    if (token === APP_PASSWORD) return next();
    res.status(401).json({ error: 'Unauthorized' });
  });
}

// ── Serve built frontend (always if dist/ exists) ─────────────────
const DIST = path.join(__dirname, 'dist');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  console.log(`   Serving frontend from: ${DIST}`);
}

// ── State persistence ──────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const readState = () => {
  if (!fs.existsSync(STATE_FILE)) return { trips: [], updatedAt: 0 };
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
  catch { return { trips: [], updatedAt: 0 }; }
};

const writeState = (data) => {
  fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2));
};

// GET full state
app.get('/api/state', (_req, res) => res.json(readState()));

// PUT full state
app.put('/api/state', (req, res) => {
  const payload = { ...req.body, updatedAt: Date.now() };
  writeState(payload);
  res.json({ ok: true, updatedAt: payload.updatedAt });
});

// GET state timestamp only (lightweight poll)
app.get('/api/state/ts', (_req, res) => {
  const { updatedAt } = readState();
  res.json({ updatedAt });
});

// ── AI helpers ────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are TripCraft AI, an expert international travel planning assistant for Indian travellers.
Help users plan trips, suggest attractions, recommend hotels, optimise itineraries, advise on budgets in INR,
and provide practical travel tips. Give concise, actionable advice. Use markdown — bullet points, bold headers.
Keep responses focused. When quoting prices, use INR (₹) where possible.`;

const getProvider = () => {
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_claude_api_key_here')
    return 'claude';
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here')
    return 'gemini';
  return 'none';
};

// GET current AI provider (so frontend can label itself correctly)
app.get('/api/ai/provider', (_req, res) => res.json({ provider: getProvider() }));

// POST chat — auto-selects Claude or Gemini based on which key is set
app.post('/api/ai/chat', async (req, res) => {
  const provider = getProvider();
  if (provider === 'none') {
    return res.status(400).json({ error: 'No AI key configured. Add ANTHROPIC_API_KEY or GEMINI_API_KEY.' });
  }

  const { messages } = req.body;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    if (provider === 'claude') {
      // ── Claude (Anthropic) ──────────────────────────────────────
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const stream = await client.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      });
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          res.write(`data: ${JSON.stringify({ delta: event.delta.text })}\n\n`);
        }
      }

    } else {
      // ── Gemini (Google) — free tier ─────────────────────────────
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: messages.map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }],
            })),
            generationConfig: { maxOutputTokens: 1024 },
          }),
        }
      );

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        throw new Error(`Gemini error: ${errText}`);
      }

      const reader = geminiRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';  // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload);
            const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) res.write(`data: ${JSON.stringify({ delta: text })}\n\n`);
          } catch { /* skip malformed */ }
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ── SPA fallback (always if dist/ exists) ─────────────────────────
if (fs.existsSync(DIST)) {
  app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

// ── Start ──────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ TripCraft running on http://0.0.0.0:${PORT}`);
  if (IS_HOSTED) {
    console.log(`   Mode: HOSTED (serving built frontend)`);
    console.log(`   Password protection: ${APP_PASSWORD ? '✅ enabled' : '⚠️  disabled (set APP_PASSWORD)'}`);
  }
  const key = process.env.ANTHROPIC_API_KEY;
  console.log(`   Claude AI: ${key && key !== 'your_claude_api_key_here' ? '✅ enabled' : '⚠️  disabled (no API key)'}`);
});
