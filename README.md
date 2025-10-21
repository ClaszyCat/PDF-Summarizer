# PDF Summarizer - Full Stack Application

AI-powered PDF document summarization using **Gemini AI**, built with **Flask** (Backend) and **Next.js** (Frontend).

## ✨ Features

- 📄 **Upload PDF files** or **provide PDF URL**
- 🤖 **AI-powered summarization** using Google Gemini 2.0 Flash
- ⚙️ **Customizable settings**:
  - **Max Token Limit** (256 - 8192 tokens) - Control summary length
  - **Temperature** (0.0 - 1.0) - Control creativity vs consistency
  - **Summary Style** - Comprehensive, Concise, or Bullet Points
- 🎨 **Modern UI** with Tailwind CSS
- ⚡ **Real-time processing** with loading indicators
- 📋 **Copy to clipboard** functionality
- 🛡️ **Error handling** and validation

## 📁 Project Structure

```
pdf-summarize/
├── backend/
│   ├── app.py                 # Flask API server
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables (create this)
│   └── .env.example           # Example env file
├── frontend/
│   ├── pages/
│   │   ├── index.tsx          # Main page
│   │   ├── _app.tsx           # App wrapper
│   │   └── _document.tsx      # Document wrapper
│   ├── styles/
│   │   └── globals.css        # Global styles
│   ├── package.json           # Node dependencies
│   ├── tsconfig.json          # TypeScript config
│   ├── tailwind.config.js     # Tailwind config
│   ├── next.config.js         # Next.js config
│   └── postcss.config.js      # PostCSS config
├── main.py                    # Original CLI script
└── README.md                  # This file
```

## 🚀 Getting Started

### Prerequisites

- **Python 3.8+**
- **Node.js 18+** and **npm**
- **Google Gemini API Key** ([Get it here](https://makersuite.google.com/app/apikey))

### Backend Setup

1. **Navigate to backend folder:**

   ```powershell
   cd backend
   ```

2. **Create virtual environment:**

   ```powershell
   python -m venv venv
   ```

3. **Activate virtual environment:**

   ```powershell
   .\venv\Scripts\Activate.ps1
   ```

4. **Install dependencies:**

   ```powershell
   pip install -r requirements.txt
   ```

5. **Create `.env` file:**

   ```powershell
   Copy-Item .env.example .env
   ```

6. **Edit `.env` and add your Gemini API key:**

   ```
   GOOGLE_GEMINI_KEY=your_actual_api_key_here
   ```

7. **Run the backend server:**

   ```powershell
   python app.py
   ```

   Backend will run on **http://localhost:5000**

### Frontend Setup

1. **Open a NEW terminal** and navigate to frontend folder:

   ```powershell
   cd frontend
   ```

2. **Install dependencies:**

   ```powershell
   npm install
   ```

3. **Run the development server:**

   ```powershell
   npm run dev
   ```

   Frontend will run on **http://localhost:3002**

### Access the Application

Open your browser and go to: **http://localhost:3002**

## 🎯 Usage

### Option 1: Upload PDF File

1. Click "📄 Upload File" tab
2. Select a PDF from your computer
3. Adjust settings (optional):
   - **Summary Style**: Comprehensive, Concise, or Bullet Points
   - **Max Tokens**: 256-8192 (controls summary length)
   - **Temperature**: 0.0-1.0 (controls creativity)
4. Click "✨ Generate Summary"

### Option 2: PDF URL

1. Click "🔗 PDF URL" tab
2. Paste the URL of a publicly accessible PDF
3. Adjust settings (optional)
4. Click "✨ Generate Summary"

### Settings Explained

#### 📊 Max Output Tokens

- **256-1024**: Very short summaries (quick overview)
- **1024-4096**: Medium summaries (balanced)
- **4096-8192**: Long, detailed summaries

💡 **Tip**: Even with token limits, the prompt is optimized to ensure summaries remain coherent and readable, not just truncated.

#### 🌡️ Temperature

- **0.0-0.3**: Focused and consistent (best for factual documents)
- **0.4-0.7**: Balanced (recommended)
- **0.8-1.0**: Creative and varied (for diverse interpretations)

#### 📝 Summary Style

- **Comprehensive**: Detailed multi-paragraph summary
- **Concise**: Brief overview (3-4 paragraphs)
- **Bullet Points**: Organized key points

## 🛠️ API Endpoints

### POST `/api/summarize`

Summarize a PDF document.

**Request (multipart/form-data):**

```javascript
{
  file: File,                    // OR pdf_url: string
  max_tokens: number,            // 256-8192 (default: 8192)
  temperature: number,           // 0.0-1.0 (default: 0.7)
  summary_style: string          // 'comprehensive' | 'concise' | 'bullet'
}
```

**Response:**

```json
{
  "success": true,
  "summary": "Generated summary text...",
  "metadata": {
    "text_length": 15000,
    "max_tokens": 4096,
    "temperature": 0.7,
    "summary_style": "comprehensive"
  }
}
```

### GET `/api/health`

Check if backend is running.

**Response:**

```json
{
  "status": "ok",
  "message": "Backend is running"
}
```

## 📦 Technologies Used

### Backend

- **Flask** - Web framework
- **Flask-CORS** - Cross-origin resource sharing
- **Google Generative AI** - Gemini AI integration
- **PyPDF2** - PDF text extraction
- **Requests** - HTTP library for downloading PDFs

### Frontend

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

## 🔧 Troubleshooting

### Backend Issues

**"GOOGLE_GEMINI_KEY not found"**

- Make sure you created `.env` file in the `backend` folder
- Verify the API key is correct

**"Module not found"**

- Make sure virtual environment is activated
- Run `pip install -r requirements.txt` again

### Frontend Issues

**"Cannot find module"**

- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

**"Connection refused"**

- Make sure backend is running on port 5000
- Check if another application is using port 5000

## 📝 Development Tips

### Running Both Servers Simultaneously

**Terminal 1 (Backend):**

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python app.py
```

**Terminal 2 (Frontend):**

```powershell
cd frontend
npm run dev
```

### Testing the API Directly

You can test the backend API using curl or Postman:

```powershell
# Health check
curl http://localhost:5000/api/health

# Summarize (with file)
curl -X POST http://localhost:5000/api/summarize `
  -F "file=@path/to/your.pdf" `
  -F "max_tokens=2048" `
  -F "temperature=0.7" `
  -F "summary_style=comprehensive"
```

## 🎨 Customization

### Change Backend Port

Edit `backend/app.py` line 237:

```python
app.run(debug=True, port=5001)  # Change to 5001
```

Also update `frontend/pages/index.tsx` line 5:

```typescript
const API_URL = "http://localhost:5001"; // Match backend port
```

### Change Frontend Port

The frontend is configured to run on port 3002. To change it, edit `frontend/package.json`:

```json
"dev": "next dev -p 3002"  // Change 3002 to your desired port
```

## 📄 License

This project is open source and available for educational purposes.

## 🤝 Contributing

Feel free to fork, improve, and submit pull requests!

## 💡 Future Enhancements

- [ ] Support for multiple file formats (DOCX, TXT)
- [ ] Save summaries to database
- [ ] User authentication
- [ ] Batch processing
- [ ] Export summaries to PDF/DOCX
- [ ] Multi-language support
- [ ] Summary comparison feature

## 📞 Support

If you encounter any issues, please check:

1. All dependencies are installed
2. Virtual environment is activated (backend)
3. API key is correctly set in `.env`
4. Both servers are running
5. No port conflicts

---

Made with ❤️ using Gemini AI, Flask & Next.js
