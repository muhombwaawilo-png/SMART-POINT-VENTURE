import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini AI client initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// AI Smart Business Assistant endpoint
app.post('/api/gemini/insights', async (req, res) => {
  try {
    const { prompt, storeContext, language = 'sw' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const systemInstruction = `
You are the dedicated Smart Business Assistant for SMART POINT VENTURE, a retail shop in Dar es Salaam, Tanzania (Kinyerezi - Kifuru - Mwanzo Mgumu) owned by AWILO SULEIMAN.
Currency: Tanzanian Shillings (TZS). Format money like: TZS 1,250,000.

IMPORTANT BUSINESS PRINCIPLES:
1. Clearly distinguish SALES (Mauzo) vs COST OF GOODS SOLD (Gharama za Bidhaa) vs EXPENSES (Matumizi) vs GROSS PROFIT (Faida Ghafi) vs NET PROFIT (Faida Halisi). Remember: SALES ≠ PROFIT (Mauzo siyo Faida)!
2. Answer based STRICTLY on the provided store context data. If some data is not available, state it clearly without inventing numbers.
3. Language: Default to Swahili (${language === 'sw' ? 'Swahili' : 'English'}). If the user asks in Swahili, respond in polite, clear business Swahili. If in English, respond in English.
4. Keep responses crisp, actionable, and encouraging for a retail store owner or manager.

Store Context Data:
${JSON.stringify(storeContext || {}, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    const reply = response.text || 'Samahani, sikuweza kupata jibu kwa sasa.';
    return res.json({ reply });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({
      error: 'Failed to generate insights',
      message: error?.message || 'Unknown server error',
    });
  }
});

// Vite middleware or static serving
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`SMART POINT VENTURE server running on http://0.0.0.0:${port}`);
  });
}

setupServer();
