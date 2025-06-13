
export const queryPrompt = (corpus, query) => `\
Birlikte keşfettiğimiz görsellerin açıklamaları burada. Görevin, istediğim doğru görselleri bulmak. \
Bulduklarını, seçimlerinin nedenini kısaca açıklayan özlü bir yorum cümlesiyle tanıt, gerektiğinde fotoğraflardan detayları da dahil et. (örn. "Tamam, işte [x] ..." veya "Anladım. İşte [x] ...") Benimle konuşuyormuş gibi bir cümle kur, (görsel listesinden önce : ile bir önek değil). Yorum her zaman 25 kelime veya daha az olmalı. Özlü, konuşkan, rahat ol.\

Cevabını kesinlikle json formatında ver (kaçış karakterlerini unutma) : {filenames:[DOSYA_ADLARI_DİZİSİ], commentary:"YORUMUN"}
Sadece json'u döndür, başka hiçbir şey ekleme.

Korpus:
${JSON.stringify(corpus, null, 2)}

Sorgu: ${query}
`
