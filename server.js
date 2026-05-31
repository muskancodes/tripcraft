import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

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
app.get('/api/state', (_req, res) => {
  res.json(readState());
});

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

// ── Claude AI ──────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are TripCraft AI, an expert international travel planning assistant for Indian travellers.
Help users plan trips, suggest attractions, recommend hotels, optimise itineraries, advise on budgets in INR,
and provide practical travel tips. Give concise, actionable advice. Use markdown — bullet points, bold headers.
Keep responses focused. When quoting prices, use INR (₹) where possible.`;

app.post('/api/ai/chat', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_claude_api_key_here') {
    return res.status(400).json({ error: 'ANTHROPIC_API_KEY not set in .env file' });
  }

  const { messages } = req.body;

  // Set SSE headers for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const client = new Anthropic({ apiKey });
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

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ── Start ──────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ TripCraft backend running on http://0.0.0.0:${PORT}`);
  console.log(`   State stored at: ${STATE_FILE}`);
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === 'your_claude_api_key_here') {
    console.log(`\n⚠️  Add your Claude API key to .env:\n   ANTHROPIC_API_KEY=sk-ant-...`);
  } else {
    console.log(`   Claude AI: ✅ API key loaded`);
  }
});
