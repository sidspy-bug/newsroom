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
# Use a writable location for generated audio (Vercel /tmp in serverless)
AUDIO_DIR = Path(os.getenv("AUDIO_DIR", "/tmp/newsroom-audio"))
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

NEWSAPI_SUPPORTED_LANGUAGE_CODES = {
	"ar",
	"de",
	"en",
	"es",
	"fr",
	"he",
	"it",
	"nl",
	"no",
	"pt",
	"ru",
	"sv",
	"ur",
	"zh",
}
NEWSAPI_TRUNCATION_SUFFIX_PATTERN = r"\s*\[\+\d+\s+chars\]$"


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


def get_news_api_key() -> Optional[str]:
	api_key = os.getenv("NEWS_API_KEY")
	if not api_key:
		api_key = _read_env_file_key(BASE_DIR / ".env", "NEWS_API_KEY")
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
	mode: Optional[str] = Field(default="student", description="kid | student | professional")


class VoiceInput(BaseModel):
	text: str = Field(..., min_length=2)
	language: Optional[str] = Field(default="english")


class FetchNewsInput(BaseModel):
	query: Optional[str] = Field(default="latest", max_length=120)
	page_size: int = Field(default=5, ge=1, le=10)
	language: Optional[str] = Field(default="en", min_length=2, max_length=10)


KID_RESTRICTED_PATTERNS = [
	r"\b(behead(?:ed|ing)?|decapitat(?:e|ed|ion))\b",
	r"\b(dismember(?:ed|ment)?|mutilat(?:e|ed|ion))\b",
	r"\b(tortur(?:e|ed|ing)|massacre|slaughter)\b",
	r"\brap(?:e|ed|es|ing|ist[s]?)\b",
	r"\b(sexual assault|molest(?:ed|ing|ers?|ation)?)\b",
	r"\b(porn|pornograph(?:y|ic)|explicit nudity|nude scene)\b",
	r"\b(graphic violence|gore|bloodbath)\b",
	# Mass violence events
	r"\b(mass shooting|mass murder|mass killing|mass casualty|mass stabbing)\b",
	r"\b(serial killer|killing spree|murder spree|rampage killing)\b",
	# Murder and homicide
	r"\b(murder(?:ed|er|ous|ers)?|homicide|manslaughter)\b",
	# Shootings
	r"\b(shoot(?:ing|er|ings|ers)|gunfire|gunshot|shot dead|shot and killed|gunned down|open fire)\b",
	r"\b(gun(?:man|men|woman|women)|armed attack|drive.by shooting)\b",
	# Bombing and terrorism
	r"\b(bomb(?:ing|ings|blast|blasts|ed)?|suicide bomb(?:er|ing)?|car bomb|explosive device)\b",
	r"\b(terror(?:ist|ists|ism)|terrorist attack|jihad(?:ist)?)\b",
	# Suicide and self-harm
	r"\b(suicide|suicidal|self.harm|self harm|took (?:his|her|their) (?:own )?life)\b",
	# Child exploitation and abuse
	r"\b(child abuse|child sexual abuse|child exploitation|child trafficking)\b",
	r"\b(pedophil(?:e|ia|ic)|grooming|sex(?:ual)? exploitation|human trafficking)\b",
	# Stabbing and bladed attacks
	r"\b(stab(?:bed|bing|bings)|knife attack|machete attack|sword attack)\b",
	# Domestic and sexual violence
	r"\b(domestic violence|domestic abuse|sexual violence|gang rap(?:e[ds]?|ing)|sex crime)\b",
	# Execution and lynching
	r"\b(execut(?:e|ed|ion)|lynching|lynched|hanging death)\b",
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
				"This news includes brutal or sexual adult content and cannot be summarized or explained in Kid mode. "
				"Please switch to Student or Professional mode."
			),
		)


def build_chat_behavior_instruction(mode: str) -> str:
	if mode == "kid":
		return (
			"Use a gentle, kid-friendly tone with short, clear sentences. "
			"Avoid scary, graphic, or explicit details."
		)
	if mode == "student":
		return "Use a clear, educational tone with simple explanations."
	if mode == "professional":
		return (
			"Use a professional, precise tone with clear reasoning and practical depth."
		)
	return "Use a clear, neutral tone with concise and practical explanations."


@app.get("/")
def index() -> FileResponse:
	return FileResponse(TEMPLATES_DIR / "index.html")


@app.get("/health")
def health() -> dict[str, str]:
	return {"status": "ok"}


@app.post("/news/fetch")
def fetch_news(payload: FetchNewsInput) -> dict[str, str | int]:
	api_key = get_news_api_key()
	if not api_key:
		raise HTTPException(
			status_code=400,
			detail="NEWS_API_KEY is not set. Add NEWS_API_KEY in environment or .env file.",
		)

	params: dict[str, str | int] = {
		"apiKey": api_key,
		"pageSize": payload.page_size,
	}
	query = (payload.query or "").strip()
	if query and query.lower() not in {"latest", "top", "headlines"}:
		params["q"] = query
	language = (payload.language or "").strip().lower()
	if language:
		if len(language) < 2:
			raise HTTPException(status_code=400, detail="Language code must have at least 2 characters.")
		language_code = language[:2]
		if language_code not in NEWSAPI_SUPPORTED_LANGUAGE_CODES:
			raise HTTPException(
				status_code=400,
				detail=f"Unsupported NewsAPI language code: {language_code}",
			)
		params["language"] = language_code

	try:
		resp = requests.get(
			"https://newsapi.org/v2/top-headlines",
			params=params,
			timeout=20,
		)
	except requests.RequestException as exc:
		raise HTTPException(status_code=500, detail=f"News API network error: {exc}") from exc

	if resp.status_code in (401, 403):
		raise HTTPException(
			status_code=401,
			detail="Invalid NEWS_API_KEY. Create a new NewsAPI key and update your environment.",
		)
	if resp.status_code == 429:
		raise HTTPException(
			status_code=429,
			detail="News API rate limit exceeded. Please retry later.",
		)
	if resp.status_code >= 400:
		raise HTTPException(status_code=500, detail=f"News API request failed: {resp.text}")

	data = resp.json()
	if data.get("status") != "ok":
		raise HTTPException(
			status_code=500,
			detail=f"News API error: {data.get('message') or 'Unknown error'}",
		)

	articles = data.get("articles") or []
	formatted_articles: list[str] = []
	for article in articles:
		title = (article.get("title") or "").strip()
		description = (article.get("description") or "").strip()
		content = (article.get("content") or "").strip()
		# NewsAPI may append "[+123 chars]" to truncated content; remove this suffix.
		content = re.sub(NEWSAPI_TRUNCATION_SUFFIX_PATTERN, "", content).strip()
		source = ((article.get("source") or {}).get("name") or "").strip()

		parts = [part for part in [title, description, content] if part]
		if not parts:
			continue
		body = " ".join(parts)
		if source:
			body = f"{body} (Source: {source})"
		formatted_articles.append(body)

	if not formatted_articles:
		raise HTTPException(
			status_code=404,
			detail="No news articles found for the requested filters.",
		)

	combined_news = "\n\n".join(
		f"Article {index + 1}: {text}" for index, text in enumerate(formatted_articles)
	)
	return {
		"news_text": combined_news,
		"articles_count": len(formatted_articles),
	}


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
	if mode == "kid":
		prompt = (
			"Summarize the following news for kids using 3-5 short, gentle bullet points. "
			"Focus on positive, helpful, or constructive aspects and skip scary or graphic details. "
			"After the summary, add a mini section titled 'Learning Points' with 2 upbeat lessons or actions a child can remember.\n\n"
			f"Language instruction: {language_instruction}\n\n"
			f"News:\n{payload.news_text}"
		)
	else:
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

	if mode == "kid":
		prompt = (
			"Explain the following news as a gentle story for kids. "
			"Use simple sentences, avoid scary or graphic details, and keep a friendly tone. "
			"Include 2 short 'Learning Points' that highlight positive takeaways or how kids can think about the news.\n\n"
			f"Language instruction: {language_instruction}\n"
			f"Mode: {mode}\n"
			f"News:\n{payload.news_text}"
		)
	else:
		prompt = (
			"Explain the following news in the selected mode:\n"
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
	mode = (payload.mode or "student").strip().lower()
	if mode not in {"kid", "student", "professional"}:
		mode = "student"

	enforce_kid_safety(mode, payload.news_text)

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
	behavior_instruction = build_chat_behavior_instruction(mode)

	prompt = (
		"You are a helpful news assistant that can also answer broader questions. "
		"Prioritize the given news when the question is related to it. "
		"If the question is broader or not directly covered by the news, provide a useful general answer. "
		"State clearly when you are using general knowledge instead of the provided news. "
		"If uncertain, say what is uncertain instead of inventing facts.\n\n"
		f"Style instruction: {behavior_instruction}\n"
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

		return {"audio_url": f"/audio/{file_name}", "language": voice_lang}
	except Exception as exc:
		raise HTTPException(status_code=500, detail=f"Voice generation failed: {exc}") from exc


@app.get("/audio/{file_name}")
def get_audio(file_name: str) -> FileResponse:
	lower_name = file_name.lower()
	if any(sep in file_name for sep in ("/", "\\")) or "%2f" in lower_name or "%5c" in lower_name:
		raise HTTPException(status_code=400, detail="Invalid file name")
	if not re.fullmatch(r"voice_[a-f0-9]{32}\.mp3", file_name):
		raise HTTPException(status_code=400, detail="Invalid file name format")

	file_path = (AUDIO_DIR / file_name).resolve()
	audio_root = AUDIO_DIR.resolve()
	if not file_path.is_relative_to(audio_root):
		raise HTTPException(status_code=400, detail="Invalid file path")
	if not file_path.exists():
		raise HTTPException(status_code=404, detail="Audio file not found")

	return FileResponse(file_path, media_type="audio/mpeg")
