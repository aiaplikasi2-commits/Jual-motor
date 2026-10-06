import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '20mb' }));

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper with retry and fallback model for 503 / high demand spikes
async function callGeminiWithRetry(contents: string, systemInstruction: string): Promise<string> {
  // Use gemini-3.1-flash-lite as fast reliable primary to avoid 503 high demand spikes on 3.8-flash
  const models = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
  let lastError: any = null;

  for (const model of models) {
    try {
      const config: any = {
        systemInstruction,
        temperature: 0.2,
      };

      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });
      const text = response.text?.trim();
      if (text) return text;
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed, trying next model:`, err?.message || err);
    }
  }

  throw lastError || new Error('Model AI sedang mengalami lonjakan trafik tinggi. Silakan coba sesaat lagi.');
}

// AI Polish endpoint for motor ad description
app.post('/api/polish', async (req, res) => {
  try {
    const { text, storeName } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Teks keterangan motor tidak boleh kosong.' });
    }

    const currentStoreName = (typeof storeName === 'string' && storeName.trim()) ? storeName.trim() : 'Jamhur Motor';

    const systemInstruction = `Anda adalah asisten perapi teks iklan jual beli sepeda motor untuk "${currentStoreName}".
Tugas Anda adalah merapikan catatan ringkas / coretan teks motor dari penjual menjadi format iklan yang rapi, menarik, enak dibaca, dan siap posting ke WhatsApp, Facebook Marketplace, dan media sosial.

ATURAN KETAT:
1. TIDAK BOLEH MENGARANG INFORMASI APAPUN.
2. TIDAK BOLEH MENAMBAHKAN SPESIFIKASI yang tidak ada di teks pengguna (misal jangan asal sebut kilometer, warna, ban, atau tahun jika tidak tertulis).
3. Harga, status pajak, kelengkapan surat, dan kondisi yang ditulis pengguna HARUS TETAP SAMA PERSIS.
4. Format output:
   - Baris pertama: Judul motor yang tegas dan jelas (misal: "🏍️ Honda Vario 125 Tahun 2021" atau sesuai yang disebutkan).
   - Paragraf/poin kondisi yang rapi, jujur, dan mudah dipahami pembeli.
   - Info harga dan nego (misal: "💰 Harga Rp17.000.000 (Nego)").
   - Kalimat penutup yang sopan dan ramah untuk calon pembeli.
5. Gunakan bahasa Indonesia santai tapi profesional dan rapi.
6. Berikan HANYA teks iklannya saja secara langsung tanpa kata pengantar, tanpa tanda kutip pembuka/penutup, dan tanpa penjelasan tambahan.`;

    const polishedText = await callGeminiWithRetry(
      `Teks keterangan awal:\n"${text.trim()}"\n\nRapikan teks di atas menjadi format iklan motor yang bagus dan rapi sesuai aturan:`,
      systemInstruction
    );

    return res.json({ result: polishedText });
  } catch (err: any) {
    console.error('Error in /api/polish:', err);
    const message = err?.message || '';
    const userFriendlyMsg = (message.includes('503') || message.includes('UNAVAILABLE') || message.includes('high demand'))
      ? 'Server AI sedang sangat sibuk karena lonjakan trafik. Silakan sentuh tombol coba lagi dalam beberapa detik.'
      : (message || 'Gagal merapikan teks dengan AI. Silakan coba lagi.');

    return res.status(500).json({
      error: userFriendlyMsg,
    });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Jamhur Motor' });
});

// Dev or Production Vite handling
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
        hmr: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`🏍️ Jamhur Motor server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
