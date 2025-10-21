# 🚀 Quick Start Guide

## Langkah Setup (5 menit)

### 1️⃣ Setup Otomatis (Recommended)

Jalankan script setup otomatis:

```powershell
.\setup.ps1
```

Script ini akan:

- ✅ Create `.env` file
- ✅ Setup Python virtual environment
- ✅ Install semua dependencies (backend + frontend)
- ✅ Bisa langsung start kedua servers

### 2️⃣ Setup Manual

**Backend:**

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# Edit .env, tambahkan API key
python app.py
```

**Frontend (terminal baru):**

```powershell
cd frontend
npm install
npm run dev
```

## 🔑 Dapatkan Gemini API Key

1. Buka: https://makersuite.google.com/app/apikey
2. Login dengan Google account
3. Click "Create API Key"
4. Copy key dan paste ke `backend\.env`

## 🌐 Akses Aplikasi

Setelah kedua servers running:

- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:5000

## ✨ Fitur yang Sudah Diimplementasi

### 1. Frontend (Next.js) ✅

- ✅ **Upload PDF** - Drag & drop atau click to upload
- ✅ **PDF URL** - Input link PDF dari internet
- ✅ **Max Token Slider** (256-8192) - Kontrol panjang summary
- ✅ **Temperature Slider** (0.0-1.0) - Kontrol kreativitas AI
- ✅ **Summary Style Selector**:
  - 📖 Comprehensive (Detail)
  - ⚡ Concise (Ringkas)
  - 📝 Bullet Points (Poin-poin)
- ✅ **Loading Indicator** - Spinner saat proses
- ✅ **Error Handling** - Error messages yang jelas
- ✅ **Summary Display** - Tampilan hasil yang rapih
- ✅ **Copy to Clipboard** - Copy summary dengan 1 click
- ✅ **Metadata Display** - Info jumlah karakter & tokens
- ✅ **Responsive Design** - Works di desktop & mobile

### 2. Backend (Flask) ✅

- ✅ **PDF Upload** - Accept file upload
- ✅ **PDF URL Download** - Download PDF dari URL
- ✅ **Token Limit Management** - Custom max_tokens (256-8192)
- ✅ **Optimized Prompts** - Prompt disesuaikan dengan style:
  - Comprehensive: Detail tapi tetap coherent
  - Concise: Brief tapi informative
  - Bullet: Organized key points
- ✅ **Temperature Control** - Adjustable creativity
- ✅ **CORS Enabled** - Frontend bisa communicate
- ✅ **Error Handling** - Proper error messages
- ✅ **Validation** - Input validation (file type, token range, dll)

## 📊 Cara Kerja Token Limit

Token limit **bukan cuma truncate** hasil! Backend sudah optimized:

### Prompt Engineering

```python
# Prompt disesuaikan untuk tetap coherent meski token dibatasi:
- Low tokens (256-1024): Fokus ke main points only
- Medium (1024-4096): Balanced detail & brevity
- High (4096-8192): Comprehensive coverage

# Style juga mempengaruhi prompt:
- Comprehensive: "thorough but avoid verbosity"
- Concise: "brief but informative, max 3-4 paragraphs"
- Bullet: "organized key points format"
```

### Hasilnya:

- ✅ Summary tetap **coherent** & **readable**
- ✅ Tidak random TL;DR
- ✅ Context dari PDF tetap terjaga
- ✅ Sesuai dengan summary style yang dipilih

## 🎯 Example Usage

### Scenario 1: CV/Resume (Quick Overview)

```
Style: Concise
Tokens: 512
Temperature: 0.3
→ Brief professional summary
```

### Scenario 2: Research Paper (Detailed)

```
Style: Comprehensive
Tokens: 4096
Temperature: 0.5
→ Detailed academic summary
```

### Scenario 3: Meeting Notes (Key Points)

```
Style: Bullet Points
Tokens: 1024
Temperature: 0.4
→ Organized action items
```

## 🛠️ Troubleshooting

### "Connection refused"

→ Pastikan backend running di port 5000

### "API key not found"

→ Check `backend\.env` file ada dan berisi key yang valid

### "No module named 'flask'"

→ Pastikan virtual environment activated

### Frontend error saat install

→ Delete `node_modules` & `package-lock.json`, run `npm install` lagi

## 📁 File Structure

```
pdf-summarize/
├── backend/
│   ├── app.py              # Flask API (DONE ✅)
│   ├── requirements.txt    # Dependencies (DONE ✅)
│   └── .env               # Your API key
├── frontend/
│   ├── pages/
│   │   └── index.tsx      # Main UI (DONE ✅)
│   ├── package.json       # Dependencies (DONE ✅)
│   └── ...config files    # All configs (DONE ✅)
├── setup.ps1              # Auto setup script (DONE ✅)
└── README.md              # Full documentation (DONE ✅)
```

## 🎨 Tech Stack

**Backend:**

- Flask (API)
- Google Generative AI (Gemini)
- PyPDF2 (PDF parsing)

**Frontend:**

- Next.js 14
- TypeScript
- Tailwind CSS
- Axios

## 💡 Tips

1. **Start with Concise** style untuk test cepat
2. **Temperature 0.7** recommended untuk balanced results
3. **Token 2048-4096** sweet spot untuk most PDFs
4. PDF URL harus **publicly accessible**

## ⚡ Next Improvements (Optional)

Kalau mau develop lebih lanjut:

- [ ] Save summary history
- [ ] Support multiple languages
- [ ] Export to PDF/DOCX
- [ ] Batch processing
- [ ] Compare summaries

---

**Happy Summarizing! 📚✨**
