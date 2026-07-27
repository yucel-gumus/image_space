import type { LlmQueryParams, LlmSearchResponse, ImageMetadata } from '../../types';
import { safeJsonParse } from '../../utils/text.utils';

// =============================================================================
// API Constants
// =============================================================================

const API_URL = (() => {
    const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
    return base ? `${base}/api/generate` : '/api/generate';
})();

const ANALYZE_API_URL = (() => {
    const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
    return base ? `${base}/api/analyze-image` : '/api/analyze-image';
})();

// =============================================================================
// Prompt Templates
// =============================================================================

export const createSearchPrompt = (
    corpus: ImageMetadata[],
    query: string
): string => `\
Birlikte keşfettiğimiz görsellerin açıklamaları burada. Görevin, istediğim doğru görselleri bulmak. \
Bulduklarını, seçimlerinin nedenini kısaca açıklayan özlü bir yorum cümlesiyle tanıt, gerektiğinde fotoğraflardan detayları da dahil et. (örn. "Tamam, işte [x] ..." veya "Anladım. İşte [x] ...") Benimle konuşuyormuş gibi bir cümle kur, (görsel listesinden önce : ile bir önek değil). Yorum her zaman 25 kelime veya daha az olmalı. Özlü, konuşkan, rahat ol.\

Cevabını kesinlikle json formatında ver (kaçış karakterlerini unutma) : {filenames:[DOSYA_ADLARI_DİZİSİ], commentary:"YORUMUN"}
Sadece json'u döndür, başka hiçbir şey ekleme.

Korpus:
${JSON.stringify(corpus)}

Sorgu: ${query}
`;

// =============================================================================
// Public API
// =============================================================================

export const queryLlm = async ({ prompt }: LlmQueryParams): Promise<string> => {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
        throw new Error(`API hatası: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.response ?? data.text ?? '';
};

export const searchImages = async (
    images: ImageMetadata[],
    query: string
): Promise<LlmSearchResponse> => {
    const prompt = createSearchPrompt(images, query);
    const responseText = await queryLlm({ prompt });

    const parsed = safeJsonParse<LlmSearchResponse>(responseText);

    if (!parsed) {
        console.error('LLM yanıtı parse edilemedi. Ham yanıt:', responseText);
        throw new Error(`LLM yanıtı parse edilemedi. (Ham yanıt: ${responseText.slice(0, 100)}...)`);
    }

    const rawFilenames = Array.isArray(parsed.filenames) ? parsed.filenames : [];
    const matchedFilenames = rawFilenames
        .map((name) => {
            const exact = images.find((img) => img.id === name);
            if (exact) return exact.id;

            const partial = images.find(
                (img) => img.id.endsWith(name) || img.id.includes(name) || name.includes(img.id)
            );
            return partial ? partial.id : name;
        })
        .filter(Boolean);

    return {
        filenames: matchedFilenames,
        commentary: parsed.commentary ?? `"${query}" için sonuç bulunamadı`,
    };
};

export const analyzeImage = async (
    base64Image: string,
    mimeType: string = 'image/jpeg',
    prompt?: string
): Promise<string> => {
    const response = await fetch(ANALYZE_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            image: base64Image,
            mime_type: mimeType,
            prompt: prompt || 'Bu görseli Türkçe olarak 1-2 detaylı ama özlü cümle ile tanımla.',
        }),
    });

    if (!response.ok) {
        throw new Error(`Görsel analiz API hatası: ${response.status}`);
    }

    const data = await response.json();
    return data.text ?? data.response ?? '';
};
