# AI News Studio (FastAPI + Vanilla JS)

AI-powered, mobile-first news understanding app with adaptive UI for different users.

## ✨ Core Features

### 1) Adaptive Profiles
- **Kid**, **Student**, **Professional** modes
- Profile selector modal + mode persistence using local storage
- Mode-specific tone, placeholders, headings, and anchor behavior

### 2) Multi-Output AI Workflow
- **Summary** generation (bullet-style)
- **Explanation** generation by user mode
- **Story Mode** tab with anchor-focused playback controls

### 3) Audio Experience
- Listen buttons for **Summary** and **Explanation**
- Story Mode has custom **Play Briefing** + **Pause** buttons
- Native audio control menu removed in Story Mode (clean UI)
- Double-tap (double-click) on listen/play buttons stops playback
- Switching tabs automatically stops currently playing audio

### 4) Kid Safety Restriction
- In **Kid mode**, if input appears to include highly brutal or sexual explicit content,
  summary/explanation generation is blocked with a safe warning.

### 5) Morning/Afternoon/Evening UX Layer
- Moving quote strip in header
- Live date/time display
- Time-aware greeting popup:
  - Good Morning / Good Afternoon / Good Evening
- Quotes and greeting change based on user local time

### 6) Chat Assistant
- Ask questions grounded in current news text
- Maintains short rolling context of recent chat turns

### 7) Scan & OCR Input
- Camera capture or image upload from UI
- Text extraction via Tesseract.js on frontend
- Extracted text auto-appends into news input box

### 8) Language-Aware Output
- Output language selector in UI
- Language normalization + auto detection fallback on backend

## 🧱 Tech Stack
- **Backend:** FastAPI
- **Frontend:** HTML, CSS, Vanilla JavaScript
- **LLM Provider:** Groq (OpenAI-compatible chat completion endpoint)
- **Voice:** gTTS (MP3 generation)
- **OCR:** Tesseract.js (browser-side)

## 📁 Project Structure
- `main.py` — FastAPI app and API routes
- `templates/index.html` — main UI layout
- `static/app.js` — frontend logic (tabs, audio, chat, OCR, mode behavior)
- `static/style.css` — styling and responsive design
- `static/audio/` — generated voice files (auto-created)

## 🚀 Setup (Windows PowerShell)
1. Create and activate virtual environment:
   - `python -m venv .venv`
   - `.\.venv\Scripts\Activate.ps1`

2. Install dependencies:
   - `pip install fastapi uvicorn gtts requests`

3. Configure API key:
   - Option A (env var):
     - `$env:GROQ_API_KEY="your_api_key_here"`
   - Option B (`.env` file in project root):
     - `GROQ_API_KEY=your_api_key_here`

4. Run app:
   - `uvicorn main:app --reload`

5. Open:
   - `http://127.0.0.1:8000`

## 🔌 API Endpoints

### `GET /`
- Serves the web app UI.

### `GET /health`
- Health check.

### `POST /summarize`
- Input:
  ```json
  {
    "news_text": "...",
    "mode": "kid|student|professional",
    "output_language": "auto|english|hindi|..."
  }
  ```
- Output:
  ```json
  {
    "summary": "...",
    "language": "en"
  }
  ```

### `POST /explain`
- Input:
  ```json
  {
    "news_text": "...",
    "mode": "kid|student|professional",
    "output_language": "auto|english|hindi|..."
  }
  ```
- Output:
  ```json
  {
    "mode": "student",
    "explanation": "...",
    "language": "en"
  }
  ```

### `POST /chat`
- Input:
  ```json
  {
    "news_text": "...",
    "question": "...",
    "history": [
      { "role": "user", "message": "..." },
      { "role": "assistant", "message": "..." }
    ],
    "output_language": "auto"
  }
  ```
- Output:
  ```json
  {
    "answer": "...",
    "language": "en"
  }
  ```

### `POST /voice`
- Input:
  ```json
  {
    "text": "...",
    "language": "english"
  }
  ```
- Output:
  ```json
  {
    "audio_url": "/static/audio/voice_<id>.mp3",
    "language": "en"
  }
  ```

## ⚠️ Notes
- If `GROQ_API_KEY` is missing/invalid, AI endpoints return clear error details.
- Some IDE warnings about missing imports happen when interpreter is not set to project `.venv`.
- Kid safety filter is pattern-based and intentionally conservative.

## ▲ Vercel Deployment
- `vercel.json` routes all traffic (including `/static/**`) to `main.py` so the FastAPI app serves both UI and APIs.
- Install dependencies from `requirements.txt` so Vercel's Python runtime has FastAPI and supporting packages.
