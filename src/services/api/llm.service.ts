import type { LlmQueryParams, LlmSearchResponse, ImageMetadata } from '../../types';
import { safeJsonParse } from '../../utils/text.utils';

// =============================================================================
// API Constants
// =============================================================================

const API_URL = (() => {
    const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
    return base ? `${base}/api/generate` : '/api/generate';
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
${JSON.stringify(corpus, null, 2)}

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
        throw new Error('LLM yanıtı parse edilemedi');
    }

    return {
        filenames: parsed.filenames ?? [],
        commentary: parsed.commentary ?? `"${query}" için sonuç bulunamadı`,
    };
};
