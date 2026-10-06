import { GoogleGenAI } from '@google/genai';

export async function polishMotorDescription(
  text: string,
  storeName = 'Jamhur Motor'
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Teks keterangan motor tidak boleh kosong.');
  }

  // 1. Try server-side endpoint first (/api/polish)
  try {
    const res = await fetch('/api/polish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed, storeName }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Gagal dari server AI (${res.status}).`);
      }
      if (data?.result) {
        return data.result;
      }
    } else {
      // Server returned HTML (e.g. GitHub Pages 404 or index.html fallback)
      const htmlText = await res.text();
      console.warn('Backend returned non-JSON response (likely static host):', htmlText.slice(0, 150));
    }
  } catch (err: any) {
    // If it's a specific error from our API (like high demand 503 from backend), rethrow
    if (err?.message && !err.message.includes('JSON.parse') && !err.message.includes('Unexpected token')) {
      console.warn('Backend /api/polish error:', err.message);
    }
  }

  // 2. Client-side fallback if user provided API key or baked into VITE_GEMINI_API_KEY
  let clientApiKey = '';
  try {
    clientApiKey = localStorage.getItem('jamhur_custom_gemini_key') || '';
  } catch {
    // ignore
  }
  if (!clientApiKey) {
    clientApiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  }

  if (clientApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: clientApiKey });
      const systemInstruction = `Anda adalah asisten perapi teks iklan jual beli sepeda motor untuk "${storeName}".
Tugas Anda adalah merapikan catatan ringkas / coretan teks motor dari penjual menjadi format iklan yang rapi, menarik, enak dibaca, dan siap posting ke WhatsApp, Facebook Marketplace, dan media sosial.

ATURAN KETAT:
1. TIDAK BOLEH MENGARANG INFORMASI APAPUN.
2. TIDAK BOLEH MENAMBAHKAN SPESIFIKASI yang tidak ada di teks pengguna (jangan asal sebut kilometer, warna, ban, atau tahun jika tidak tertulis).
3. Harga, status pajak, kelengkapan surat, dan kondisi yang ditulis pengguna HARUS TETAP SAMA PERSIS.
4. Format output:
   - Baris pertama: Judul motor yang tegas dan jelas.
   - Paragraf/poin kondisi yang rapi dan jujur.
   - Info harga dan nego.
   - Kalimat penutup yang ramah untuk calon pembeli.
5. Gunakan bahasa Indonesia santai tapi profesional.
6. Berikan HANYA teks iklannya saja secara langsung tanpa kata pengantar dan tanpa penjelasan tambahan.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: `Teks keterangan awal:\n"${trimmed}"\n\nRapikan teks di atas menjadi format iklan motor yang bagus dan rapi sesuai aturan:`,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      const result = response.text?.trim();
      if (result) return result;
    } catch (clientErr: any) {
      console.error('Client Gemini fallback failed:', clientErr);
    }
  }

  // 3. Clear, helpful explanation instead of cryptic JSON.parse error
  throw new Error(
    'Server backend AI belum aktif. Jika aplikasi di-hosting statis di GitHub Pages, jalankan di komputer/server dengan perintah "npm run dev" atau deploy ke layanan full-stack (Render, Railway, VPS).'
  );
}
