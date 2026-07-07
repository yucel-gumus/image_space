# 🌌 Resim Uzayı (3D Semantic Photo Space Explorer)

Resim Uzayı; onlarca etiketli fotoğrafı 3 boyutlu bir uzayda küresel (spherical) veya ızgara (grid) düzeninde listeleyen, Google Gemini yapay zeka modelinin gücüyle doğal dilde aramalar yapıp aranan kelimeyle semantik olarak en çok uyuşan görselleri 3D alanda canlı olarak vurgulayan modern bir **React 19 + Three.js + React Three Fiber (R3F)** web uygulamasıdır.

---

## 🌟 Öne Çıkan Özellikler

### 1. 3 Boyutlu İnteraktif Görselleştirme (Three.js & R3F)
* **Küresel Düzen (Spherical Layout):** Tüm fotoğraflar 3D küre koordinatları (enlem/boylam benzeri theta-phi hesaplamaları) kullanılarak üç boyutlu bir küre etrafına dizilir.
* **Izgara Düzeni (Grid Layout):** Fotoğraflar 2 boyutlu düzlemsel bir matris yapısında konumlandırılır.
* **Fly-To ve Kamera Odaklanması:** Herhangi bir görsele tıklandığında kamera o görsele doğru pürüzsüzce yaklaşır (OrbitControls entegrasyonu).
* **Otomatik Yavaş Dönme:** Küre, kullanıcı harita ile etkileşime girmediğinde kendi ekseni etrafında yavaşça döner. Etkileşim algılandığında (drag/scroll) otomatik olarak duraklar.

### 2. Semantik AI Arama & Vurgulama
* **Doğal Dil Arama Sorguları:** Kullanıcılar *"Kış mevsimi"*, *"Uzay ve teknoloji"* gibi kavramsal aramalar yapabilir.
* **Akıllı Eşleşme:** Gemini AI, sorgu terimini analiz eder ve görsellerin etiketleriyle semantik olarak eşleşenleri seçer.
* **Dinamik 3D Vurgulama:** Eşleşen görsel panelleri 3D uzayda büyür (scale-up), parlaklıkları artar ve öne doğru çıkar. Eşleşmeyenler ise soluklaşır.

### 3. İleri Seviye 3D Performans Optimizasyonları
* **Frustum Culling:** Kameranın görüş açısı (frustum) dışında kalan 3D paneller render edilmez. Bu sayede yüzlerce yüksek çözünürlüklü görsel olsa dahi 60 FPS performans korunur.
* **Akıllı Doku Önbelleği (Texture Cache):** Aynı dokular (textures) tekrar tekrar ekran kartı belleğine (GPU VRAM) yüklenmez, RAM ve VRAM üzerinde cache'lenir.
* **Suspense & Lazy Loading:** Görseller arka planda asenkron olarak yüklenir, böylece uygulamanın ilk açılış hızı (LCP) 2.5 saniyenin altında tutulur.

---

## 🏗️ Mimarî Akış ve Güvenlik Gücü

API anahtarlarını korumak için tarayıcı doğrudan Gemini sunucuları yerine **Vercel Serverless Function Proxy** üzerinden sorgulama yapar:

```
[ Tarayıcı (React Three Fiber) ] ──(POST /api/generate)──► [ Vercel Serverless (api/generate.ts) ]
                                                                       │
                                                             (X-API-Key Yetkilendirme)
                                                                       ▼
[ Gemini 3.5 Flash ] ◄──(Semantik Analiz & Etiketler)─── [ Python Backend (api.yucelgumus.dev) ]
```

---

## 📂 Proje Klasör Yapısı

```
image_space/
├── src/
│   ├── components/
│   │   ├── PhotoNode.tsx    # R3F Mesh bileşeni (Fotoğrafın 3D paneli, Hover ve Scale animasyonları)
│   │   ├── PhotoViz.tsx     # Three.js Canvas, Kamera (OrbitControls), Işıklandırma ve Layout kontrolleri
│   │   └── Sidebar.tsx      # Arama paneli ve kategori geçişleri
│   ├── actions.js           # Zustand + Immer durum yönetim eylemleri
│   ├── app.jsx              # Ana React arayüz katmanı
│   └── main.jsx
├── api/
│   └── generate.ts          # Vercel Serverless Gateway Proxy
├── vite.config.ts           # Terser minifier ve dev proxy yapılandırması
├── vercel.json              # Endpoint yönlendirmeleri
└── package.json
```

---

## 🚀 Kurulum ve Yerel Çalıştırma

### 1. Bağımlılıkları Yükleyin
```bash
git clone https://github.com/yucel-gumus/image_space.git
cd image_space
npm install --legacy-peer-deps
```

### 2. Ortam Değişkenleri (`.env`)
Proje kök dizininde `.env` oluşturun:

```env
# Yerel Gateway Bağlantısı
VITE_API_URL=https://api.yucelgumus.dev
GATEWAY_CLIENT_API_KEY=your_client_api_key

# Üretim (Production) API Bağlantısı
AI_API_URL=https://python-backend-270384591051.europe-west3.run.app
```

### 3. Geliştirme Sunucusunu Başlatma
```bash
npm run dev
```
Uygulama `http://localhost:5173` adresinde başlayacaktır.

---

## 🔗 Canlı Bağlantılar
* **Canlı Demo:** [https://image-space-ten.vercel.app](https://image-space-ten.vercel.app)
* **Geliştirici LinkedIn:** [https://linkedin.com/in/yucel-gumus](https://linkedin.com/in/yucel-gumus)
