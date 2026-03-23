import os
import re
from pathlib import Path
from typing import Optional
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from gtts import gTTS
import requests
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
TEMPLATES_DIR = BASE_DIR / "templates"
AUDIO_DIR = STATIC_DIR / "audio"

STATIC_DIR.mkdir(exist_ok=True)
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="AI-Native Interactive News Platform")

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


def _read_env_file_key(file_path: Path, key_name: str) -> Optional[str]:
	if not file_path.exists():
		return None

	for raw_line in file_path.read_text(encoding="utf-8").splitlines():
		line = raw_line.strip()
		if not line or line.startswith("#") or "=" not in line:
			continue

		name, value = line.split("=", 1)
		if name.strip() != key_name:
			continue

		clean_value = value.strip().strip('"').strip("'")
		return clean_value or None

	return None


LANGUAGE_ALIASES = {
	"english": "en",
	"en": "en",
	"hindi": "hi",
	"hi": "hi",
	"spanish": "es",
	"es": "es",
	"french": "fr",
	"fr": "fr",
	"german": "de",
	"de": "de",
	"japanese": "ja",
	"ja": "ja",
	"arabic": "ar",
	"ar": "ar",
	"portuguese": "pt",
	"pt": "pt",
	"italian": "it",
	"it": "it",
}

LANGUAGE_LABELS = {
	"en": "English",
	"hi": "Hindi",
	"es": "Spanish",
	"fr": "French",
	"de": "German",
	"ja": "Japanese",
	"ar": "Arabic",
	"pt": "Portuguese",
	"it": "Italian",
}


def normalize_language(language: Optional[str]) -> Optional[str]:
	if not language:
		return None
	key = language.strip().lower()
	if key in {"", "auto", "same", "default"}:
		return None
	return LANGUAGE_ALIASES.get(key)


def detect_language_code(text: str) -> str:
	# Basic script-based detection for demo use.
	for ch in text:
		code = ord(ch)
		if 0x0900 <= code <= 0x097F:
			return "hi"  # Devanagari
		if 0x0600 <= code <= 0x06FF:
			return "ar"  # Arabic
		if 0x3040 <= code <= 0x30FF or 0x4E00 <= code <= 0x9FFF:
			return "ja"  # Japanese (incl. common CJK ranges)
	return "en"


def resolve_output_language(requested_language: Optional[str], reference_text: str) -> str:
	return normalize_language(requested_language) or detect_language_code(reference_text)


def build_language_instruction(language_code: Optional[str], default_mode: str) -> str:
	if not language_code:
		return default_mode
	lang_code = language_code
	label = LANGUAGE_LABELS.get(lang_code, "English")
	return f"Write the response in {label}."


def get_groq_api_key() -> Optional[str]:
	api_key = os.getenv("GROQ_API_KEY")
	if not api_key:
		api_key = _read_env_file_key(BASE_DIR / ".env", "GROQ_API_KEY")
	return api_key


def call_groq(prompt: str) -> str:
	api_key = get_groq_api_key()
	if not api_key:
		raise HTTPException(
			status_code=400,
			detail="GROQ_API_KEY is not set. Add GROQ_API_KEY in environment or .env file.",
		)

	# Try multiple model ids to handle account/project differences.
	model_candidates = [
		"llama-3.1-8b-instant",
		"llama-3.3-70b-versatile",
		"llama3-8b-8192",
	]

	try:
		last_error_text = ""
		for model_name in model_candidates:
			url = "https://api.groq.com/openai/v1/chat/completions"
			payload = {
				"model": model_name,
				"messages": [{"role": "user", "content": prompt}],
				"temperature": 0.3,
			}
			headers = {
				"Authorization": f"Bearer {api_key}",
				"Content-Type": "application/json",
			}
			resp = requests.post(url, json=payload, headers=headers, timeout=45)

			if resp.status_code == 404:
				last_error_text = resp.text
				continue

			if resp.status_code == 429:
				raise HTTPException(
					status_code=429,
					detail="Groq quota/rate limit exceeded. Check Groq plan limits and retry.",
				)
			if resp.status_code == 401 or resp.status_code == 403:
				raise HTTPException(
					status_code=401,
					detail="Invalid GROQ_API_KEY. Create a new Groq API key and update .env.",
				)
			if resp.status_code >= 400:
				raise HTTPException(status_code=500, detail=f"Groq request failed: {resp.text}")

			data = resp.json()
			choices = data.get("choices") or []
			if not choices:
				raise HTTPException(status_code=500, detail="Groq request failed: empty response.")

			text = ((choices[0].get("message") or {}).get("content") or "").strip()
			if not text:
				raise HTTPException(status_code=500, detail="Groq request failed: no text returned.")

			return text

		raise HTTPException(
			status_code=500,
			detail=(
				"No supported Groq model was found for this API key/project. "
				f"Last error: {last_error_text}"
			),
		)
	except HTTPException:
		raise
	except requests.RequestException as exc:
		raise HTTPException(status_code=500, detail=f"Groq network error: {exc}") from exc


def call_llm(prompt: str) -> str:
	return call_groq(prompt)


class NewsInput(BaseModel):
	news_text: str = Field(..., min_length=20)
	mode: Optional[str] = Field(default="student", description="kid | student | professional")
	output_language: Optional[str] = Field(default="auto")


class ExplainInput(BaseModel):
	news_text: str = Field(..., min_length=20)
	mode: str = Field(..., description="kid | student | professional")
	output_language: Optional[str] = Field(default="auto")


class ChatTurn(BaseModel):
	role: str = Field(..., description="user | assistant")
	message: str = Field(..., min_length=1, max_length=3000)


class ChatInput(BaseModel):
	news_text: str = Field(..., min_length=20)
	question: str = Field(..., min_length=3)
	history: list[ChatTurn] = Field(default_factory=list)
	output_language: Optional[str] = Field(default="auto")


class VoiceInput(BaseModel):
	text: str = Field(..., min_length=2)
	language: Optional[str] = Field(default="english")


KID_RESTRICTED_PATTERNS = [
	r"\b(behead(?:ed|ing)?|decapitat(?:e|ed|ion))\b",
	r"\b(dismember(?:ed|ment)?|mutilat(?:e|ed|ion))\b",
	r"\b(tortur(?:e|ed|ing)|massacre|slaughter)\b",
	r"\b(rape|sexual assault|molest(?:ed|ation)?)\b",
	r"\b(porn|pornograph(?:y|ic)|explicit nudity|nude scene)\b",
	r"\b(graphic violence|gore|bloodbath)\b",
]


def is_restricted_for_kids(news_text: str) -> bool:
	text = news_text.lower()
	for pattern in KID_RESTRICTED_PATTERNS:
		if re.search(pattern, text, flags=re.IGNORECASE):
			return True
	return False


def enforce_kid_safety(mode: str, news_text: str) -> None:
	if mode == "kid" and is_restricted_for_kids(news_text):
		raise HTTPException(
			status_code=403,
			detail=(
				"This news includes brutal or sexual adult content and cannot be summarized in Kid mode. "
				"Please switch to Student or Professional mode."
			),
		)


@app.get("/")
def index() -> FileResponse:
	return FileResponse(TEMPLATES_DIR / "index.html")


@app.get("/health")
def health() -> dict[str, str]:
	return {"status": "ok"}


@app.post("/summarize")
def summarize(payload: NewsInput) -> dict[str, str]:
	mode = (payload.mode or "student").strip().lower()
	if mode not in {"kid", "student", "professional"}:
		mode = "student"

	enforce_kid_safety(mode, payload.news_text)

	resolved_language = resolve_output_language(payload.output_language, payload.news_text)
	language_instruction = build_language_instruction(
		resolved_language,
		"Write in the same language as the input news text.",
	)
	prompt = (
		"Summarize the following news into 3-5 bullet points in simple language.\n\n"
		f"Language instruction: {language_instruction}\n\n"
		f"News:\n{payload.news_text}"
	)
	summary = call_llm(prompt)
	return {"summary": summary, "language": resolved_language}


@app.post("/explain")
def explain(payload: ExplainInput) -> dict[str, str]:
	mode = payload.mode.strip().lower()
	if mode not in {"kid", "student", "professional"}:
		raise HTTPException(status_code=400, detail="Mode must be one of: kid, student, professional")

	enforce_kid_safety(mode, payload.news_text)

	resolved_language = resolve_output_language(payload.output_language, payload.news_text)
	language_instruction = build_language_instruction(
		resolved_language,
		"Write in the same language as the input news text.",
	)

	prompt = (
		"Explain the following news in {mode}:\n"
		"- Kid: very simple with examples\n"
		"- Student: educational and clear\n"
		"- Professional: detailed and technical\n\n"
		f"Language instruction: {language_instruction}\n"
		f"Mode: {mode}\n"
		f"News:\n{payload.news_text}"
	)
	explanation = call_llm(prompt)
	return {
		"mode": mode,
		"explanation": explanation,
		"language": resolved_language,
	}


@app.post("/chat")
def chat(payload: ChatInput) -> dict[str, str]:
	resolved_language = resolve_output_language(payload.output_language, payload.question)
	language_instruction = build_language_instruction(
		resolved_language,
		"Answer in the same language as the question.",
	)

	history_lines: list[str] = []
	for turn in payload.history[-8:]:
		role = turn.role.strip().lower()
		if role not in {"user", "assistant"}:
			continue
		history_lines.append(f"{role}: {turn.message}")
	history_text = "\n".join(history_lines) if history_lines else "(no previous chat)"

	prompt = (
		"Answer the question based only on the given news. "
		"Use short, clear responses. If not related, say you don't know.\n\n"
		f"Language instruction: {language_instruction}\n\n"
		f"News:\n{payload.news_text}\n\n"
		f"Previous chat context:\n{history_text}\n\n"
		f"Question: {payload.question}"
	)
	answer = call_llm(prompt)
	return {"answer": answer, "language": resolved_language}


@app.post("/voice")
def voice(payload: VoiceInput) -> dict[str, str]:
	try:
		voice_lang = normalize_language(payload.language) or detect_language_code(payload.text)
		file_name = f"voice_{uuid4().hex}.mp3"
		file_path = AUDIO_DIR / file_name

		tts = gTTS(text=payload.text, lang=voice_lang)
		tts.save(str(file_path))

		return {"audio_url": f"/static/audio/{file_name}", "language": voice_lang}
	except Exception as exc:
		raise HTTPException(status_code=500, detail=f"Voice generation failed: {exc}") from exc
