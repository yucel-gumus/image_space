# 🌌 Resim Uzayı)

Modern 3D görsel keşif ve AI destekli arama uygulaması. Görselleri 3D uzayda görüntüleyin, akıllı aramalar yapın ve interaktif deneyim yaşayın.

## ✨ Özellikler

- 🔍 **AI Destekli Arama**: Gemini AI ile doğal dil kullanarak görsel arama
- 🌐 **3D Görselleştirme**: Küre ve ızgara modlarında 3D görsel düzenleme
- 🎯 **Interaktif Keşif**: Görsellere odaklanma ve detaylı inceleme
- 🎨 **Modern UI**: React Three Fiber ile geliştirilmiş modern arayüz
- 🚀 **Hızlı Performans**: Vite ile optimize edilmiş geliştirme ortamı

## 🛠️ Teknolojiler

- **Frontend**: React 19, TypeScript
- **3D Grafik**: Three.js, React Three Fiber, React Three Drei
- **Animasyon**: Framer Motion 3D, Motion
- **State Yönetimi**: Zustand
- **AI**: Google Gemini API
- **Build Tool**: Vite
- **Styling**: CSS3

## 📋 Gereksinimler

- **Node.js** (v18 veya üzeri)
- **npm** veya **yarn**
- **Gemini API Anahtarı** (Google AI Studio'dan alınabilir)

## 🚀 Kurulum

### 1. Projeyi İndirin
```bash
git clone <repository-url>
cd thinking-space
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install --legacy-peer-deps
```
> **Not**: `--legacy-peer-deps` bayrağı peer dependency uyumsuzlukları için gereklidir.

### 3. Ortam Değişkenlerini Ayarlayın
Proje kök dizininde `.env.local` dosyası oluşturun ve aşağıdaki içeriği ekleyin:
```bash
# .env.local dosyası
GEMINI_API_KEY=your_gemini_api_key_here
```

**API Anahtarı Alma:**
1. [Google AI Studio](https://aistudio.google.com/) adresine gidin
2. "Get API Key" butonuna tıklayın
3. Yeni bir API anahtarı oluşturun
4. Anahtarı kopyalayıp `.env.local` dosyasına yapıştırın

### 4. Uygulamayı Başlatın
```bash
npm run dev
```

Uygulama `http://localhost:5173` adresinde çalışacaktır.

## 🎮 Kullanım

### Temel Kullanım
1. **Arama**: Üst kısımdaki arama çubuğuna istediğiniz görsel türünü yazın
   - Örnek: "kış", "matematiksel kavramlar", "sualtı hayvanları"
2. **Görünüm Değiştirme**: Alt kısımdaki "küre" veya "ızgara" butonlarını kullanın
3. **Görsel İnceleme**: Herhangi bir görsele tıklayarak odaklanın

### Klavye Kısayolları
- **Enter**: Arama yap
- **Escape**: Aramayı temizle
- **Mouse Wheel**: Yakınlaştır/Uzaklaştır
- **Mouse Drag**: Kamerayı hareket ettir

## 📁 Proje Yapısı

```
thinking-space/
├── public/                 # Statik dosyalar
├── src/
│   ├── App.jsx            # Ana uygulama bileşeni
│   ├── PhotoViz.jsx       # 3D görselleştirme bileşeni
│   ├── PhotoNode.jsx      # Tekil görsel bileşeni
│   ├── actions.js         # State aksiyonları
│   ├── store.js           # Zustand state yönetimi
│   ├── llm.js             # AI API entegrasyonu
│   ├── prompts.js         # AI prompt şablonları
│   └── index.css          # Stil dosyası
├── package.json
├── vite.config.ts
└── README.md
```

## 🔧 Geliştirme

### Mevcut Komutlar
```bash
npm run dev      # Geliştirme sunucusunu başlat
npm run build    # Üretim için derle
npm run preview  # Üretim derlemesini önizle
```

### Kod Yapısı
- **React Functional Components**: Modern React hooks kullanımı
- **TypeScript**: Tip güvenliği için
- **Zustand**: Basit ve etkili state yönetimi
- **Three.js**: 3D grafik işlemleri
- **Immer**: Immutable state güncellemeleri

## 🌐 API Entegrasyonu

Uygulama Google Gemini API kullanarak akıllı görsel arama yapar:
- Doğal dil işleme ile arama sorguları
- Görsel açıklamalarına dayalı eşleştirme
- Türkçe dil desteği

## 🎨 Özelleştirme

### Yeni Görsel Ekleme
1. Görselleri `public/` klasörüne ekleyin
2. `meta.json` dosyasını güncelleyin
3. Pozisyon verilerini `sphere.json` ve `umap-grid.json` dosyalarında ayarlayın

### Stil Değişiklikleri
`index.css` dosyasını düzenleyerek arayüzü özelleştirebilirsiniz.

## 🐛 Sorun Giderme

### Yaygın Sorunlar

**Dependency Çakışması**
```bash
npm install --legacy-peer-deps
```

**API Anahtarı Hatası**
- `.env.local` dosyasının doğru konumda olduğundan emin olun
- API anahtarının geçerli olduğunu kontrol edin

**Port Çakışması**
Vite otomatik olarak boş port bulacaktır (5173, 5174, vb.)

## 📄 Lisans

Bu proje Apache 2.0 lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 İletişim

Sorularınız için issue açabilir veya pull request gönderebilirsiniz.

---

**Resim Uzayı** ile 3D görsel keşfin tadını çıkarın! 🚀
