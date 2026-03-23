const newsText = document.getElementById("newsText");
const summarizeBtn = document.getElementById("summarizeBtn");
const summaryOutput = document.getElementById("summaryOutput");
const summaryAudioPlayer = document.getElementById("summaryAudioPlayer");
const summarySpeakBtn = document.getElementById("summarySpeakBtn");
const explanationOutput = document.getElementById("explanationOutput");
const explanationAudioPlayer = document.getElementById("explanationAudioPlayer");
const explanationSpeakBtn = document.getElementById("explanationSpeakBtn");
const questionInput = document.getElementById("questionInput");
const askBtn = document.getElementById("askBtn");
const clearChatBtn = document.getElementById("clearChatBtn");
const closeChatBtn = document.getElementById("closeChatBtn");
const chatOutput = document.getElementById("chatOutput");
const chatWindow = document.getElementById("chatWindow");
const chatCard = document.getElementById("chatCard");
const chatLauncher = document.getElementById("chatLauncher");
const chatBackdrop = document.getElementById("chatBackdrop");
const pauseBtn = document.getElementById("pauseBtn");
const voiceBtn = document.getElementById("voiceBtn");
const audioPlayer = document.getElementById("audioPlayer");
const statusEl = document.getElementById("status");
const wordCountEl = document.getElementById("wordCount");
const readTimeEl = document.getElementById("readTime");
const selectedModeEl = document.getElementById("selectedMode");
// Custom language dropdown
const langDropdownWrap = document.getElementById("langDropdownWrap");
const langDropdownBtn = document.getElementById("langDropdownBtn");
const langDropdownPanel = document.getElementById("langDropdownPanel");
const langSelectedText = document.getElementById("langSelectedText");
let currentOutputLanguage = "english";
const openCameraBtn = document.getElementById("openCameraBtn");
const scanCameraOption = document.getElementById("scanCameraOption");
const uploadPhotoOption = document.getElementById("uploadPhotoOption");
const cameraQuickMenu = document.getElementById("cameraQuickMenu");
const cameraQuickOptions = document.getElementById("cameraQuickOptions");
const imageInput = document.getElementById("imageInput");
const cameraModal = document.getElementById("cameraModal");
const closeCameraBtn = document.getElementById("closeCameraBtn");
const cameraVideo = document.getElementById("cameraVideo");
const cameraCanvas = document.getElementById("cameraCanvas");
const captureBtn = document.getElementById("captureBtn");
const userTypeModal = document.getElementById("userTypeModal");
const userTypeButtons = document.querySelectorAll(".user-type-btn");

// Initialize pause button as disabled by default
if (pauseBtn) pauseBtn.disabled = true;
// Inline mode buttons removed - mode selection via navbar CTA

// Navbar elements
const hamburgerBtn = document.getElementById("hamburgerBtn");
const mobileDrawer = document.getElementById("mobileDrawer");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const drawerLinks = document.querySelectorAll(".drawer-link");
const settingsBtn = document.getElementById("settingsBtn");
const appTitle = document.getElementById("appTitle");
const appSubtitle = document.getElementById("appSubtitle");
const inputHeading = document.getElementById("inputHeading");
const explanationHeading = document.getElementById("explanationHeading");
const anchorImg = document.getElementById("anchorImg");
const voiceHeading = document.getElementById("voiceHeading");
const voiceBtnText = document.getElementById("voiceBtnText");
const voiceHint = document.getElementById("voiceHint");
const voiceBtnIcon = document.querySelector(".voice-btn-icon");
const storybookView = document.getElementById("storybookView");
const storyLeftPage = document.getElementById("storyLeftPage");
const storyRightPage = document.getElementById("storyRightPage");
const storyLeftText = document.getElementById("storyLeftText");
const storyRightText = document.getElementById("storyRightText");
const morningQuoteTrack = document.getElementById("morningQuoteTrack");
const morningDateTime = document.getElementById("morningDateTime");
const morningGreetingPopup = document.getElementById("morningGreetingPopup");
const morningGreetingTitle = document.getElementById("morningGreetingTitle");
const morningGreetingText = document.getElementById("morningGreetingText");

let latestExplanation = "";
let activeMode = "";
let userType = localStorage.getItem("userType") || null;
let typingBubbleEl = null;
let latestResponseLanguage = "en";
let chatHistory = [];
let chatNewsFingerprint = "";
let audioCtx = null;
let cameraStream = null;
let morningQuoteIndex = 0;

const DAY_QUOTES = {
  morning: [
    "☀️ Good morning! Small steps in learning today create big wins tomorrow.",
    "🌤️ Fresh morning, fresh mindset: read, reflect, and rise.",
    "📰 Good morning! Informed minds make better decisions.",
    "✨ Start your morning with clarity, curiosity, and confidence.",
    "🌅 Every morning is a new chance to understand the world better.",
  ],
  afternoon: [
    "🌞 Good afternoon! Stay focused—your best work can still happen today.",
    "📘 Afternoon check-in: one clear idea can change your whole day.",
    "⚡ Good afternoon! Keep momentum going with smart, informed choices.",
    "🧠 Midday wisdom: pause, learn, and move forward stronger.",
    "🌼 Good afternoon! Progress is built one steady step at a time.",
  ],
  evening: [
    "🌙 Good evening! Reflect on what you learned and grow tomorrow.",
    "✨ Evening calm: clarity comes when you slow down and review.",
    "📰 Good evening! End your day informed and inspired.",
    "🌆 Evening insight: small lessons today become big wins later.",
    "💫 Good evening! Recharge your mind with meaningful knowledge.",
  ],
};

const PROFILE_UI = {
  kid: {
    title: "Story News World",
    subtitle: "A magical storyteller explains today's news 🌈",
    inputHeading: "Story Input",
    explanationHeading: "Story Time",
    generateLabel: "Tell me the story",
    newsPlaceholder: "Paste news and I will turn it into a fun story...",
    questionPlaceholder: "Ask the storyteller anything...",
    anchorSrc: "/static/anchor-kid-mascot.svg",
    anchorAlt: "Friendly cartoon storyteller mascot",
    voiceHeading: "Storyteller Voice",
    voiceButtonLabel: "Story Buddy",
    voiceHint: "Tap to hear a magical bedtime narration ✨",
    voiceIcon: "🧸",
  },
  student: {
    title: "AI News Studio",
    subtitle: "Understand news in a clear, structured way",
    inputHeading: "News Input",
    explanationHeading: "Explanation",
    generateLabel: "Generate",
    newsPlaceholder: "Paste your news...",
    questionPlaceholder: "Ask a question about the news...",
    anchorSrc: "/static/anchor-female.svg",
    anchorAlt: "AI anchor",
    voiceHeading: "Story Mode",
    voiceButtonLabel: "Play Story",
    voiceHint: "A quick narrative version of your latest explanation.",
    voiceIcon: "🎙️",
  },
  professional: {
    title: "AI News Desk",
    subtitle: "Concise insights for professional decisions",
    inputHeading: "Briefing Input",
    explanationHeading: "Executive Explanation",
    generateLabel: "Generate",
    newsPlaceholder: "Paste your briefing or article...",
    questionPlaceholder: "Ask a focused question...",
    anchorSrc: "/static/anchor-female.svg",
    anchorAlt: "AI anchor",
    voiceHeading: "Story Mode",
    voiceButtonLabel: "Play Briefing",
    voiceHint: "Narrated insight for rapid review.",
    voiceIcon: "📣",
  },
};

// Removed: syncInlineModeButtons function - mode buttons deleted from UI

function applyProfileContent(type) {
  const profile = PROFILE_UI[type] || PROFILE_UI.student;
  if (appTitle) appTitle.textContent = profile.title;
  if (appSubtitle) appSubtitle.textContent = profile.subtitle;
  if (inputHeading) inputHeading.textContent = profile.inputHeading;
  if (explanationHeading) explanationHeading.textContent = profile.explanationHeading;
  if (summarizeBtn) summarizeBtn.textContent = profile.generateLabel;
  if (newsText) newsText.placeholder = profile.newsPlaceholder;
  if (questionInput) questionInput.placeholder = profile.questionPlaceholder;
  if (anchorImg) {
    anchorImg.src = profile.anchorSrc;
    anchorImg.alt = profile.anchorAlt;
  }
  if (voiceHeading) voiceHeading.textContent = profile.voiceHeading;
  if (voiceBtnText) voiceBtnText.textContent = profile.voiceButtonLabel;
  if (voiceHint) voiceHint.textContent = profile.voiceHint;
  if (voiceBtnIcon) voiceBtnIcon.textContent = profile.voiceIcon || "🎙️";

  if (storybookView) {
    storybookView.setAttribute("aria-hidden", type === "kid" ? "false" : "true");
  }
}

function setVoiceButtonState(state = "idle") {
  if (!voiceBtn) return;

  voiceBtn.classList.remove("is-generating", "is-playing");
  if (pauseBtn) pauseBtn.disabled = state !== "playing";
  if (state === "generating") {
    voiceBtn.classList.add("is-generating");
    return;
  }
  if (state === "playing") {
    voiceBtn.classList.add("is-playing");
  }
}

function formatSummaryAsBullets(text) {
  const lines = String(text || "")
    .split(/\n+/)
    .map((line) => line.replace(/^[-•\d.)\s]+/, "").trim())
    .filter(Boolean);

  if (!lines.length) return "• No summary yet.";
  return lines.map((line) => `• ${line}`).join("\n");
}

function toKidStoryText(text) {
  const clean = (text || "")
    .replace(/^[-•*\d.\s]+/gm, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) {
    return "Once upon a time, there was an important event in the world. Our story friend is getting it ready for you.";
  }

  const friendly = clean
    .replace(/government/gi, "leaders")
    .replace(/economy/gi, "money world")
    .replace(/inflation/gi, "rising prices")
    .replace(/interest rates?/gi, "money rules")
    .replace(/policy/gi, "plan")
    .replace(/market/gi, "big bazaar");

  return `Once upon a time, here is today's news adventure. ${friendly} And that's how this chapter helps everyone understand what may happen next.`;
}

function splitStoryPages(text) {
  const parts = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const mid = Math.max(1, Math.ceil(parts.length / 2));
  return {
    left: parts.slice(0, mid).join(" "),
    right: parts.slice(mid).join(" ") || "The End... until the next news adventure ✨",
  };
}

function renderStorybook(storyText) {
  if (!storybookView || !storyLeftText || !storyRightText) return;
  const pages = splitStoryPages(storyText);
  storyLeftText.textContent = pages.left;
  storyRightText.textContent = pages.right;

  [storyLeftPage, storyRightPage].forEach((page) => {
    if (!page) return;
    page.classList.remove("page-flip");
    void page.offsetWidth;
    page.classList.add("page-flip");
  });
}

function setStatus(message, type = "ok") {
  statusEl.textContent = message;
  statusEl.classList.remove("status-ok", "status-error", "status-loading");
  statusEl.classList.add(type === "error" ? "status-error" : type === "loading" ? "status-loading" : "status-ok");
}

function stopAudioPlayer(player) {
  if (!player) return;
  player.pause();
  try {
    player.currentTime = 0;
  } catch (_) {
    // ignore seek errors for not-yet-ready media
  }
}

function stopAllAudioPlayback() {
  stopAudioPlayer(audioPlayer);
  stopAudioPlayer(summaryAudioPlayer);
  stopAudioPlayer(explanationAudioPlayer);

  if (summarySpeakBtn) summarySpeakBtn.classList.remove("playing");
  if (explanationSpeakBtn) explanationSpeakBtn.classList.remove("playing");
  setVoiceButtonState("idle");
}

function stopOtherAudioPlayback(activePlayer) {
  if (activePlayer !== audioPlayer) stopAudioPlayer(audioPlayer);
  if (activePlayer !== summaryAudioPlayer) stopAudioPlayer(summaryAudioPlayer);
  if (activePlayer !== explanationAudioPlayer) stopAudioPlayer(explanationAudioPlayer);

  if (activePlayer !== summaryAudioPlayer && summarySpeakBtn) {
    summarySpeakBtn.classList.remove("playing");
  }
  if (activePlayer !== explanationAudioPlayer && explanationSpeakBtn) {
    explanationSpeakBtn.classList.remove("playing");
  }
  if (activePlayer !== audioPlayer) {
    setVoiceButtonState("idle");
  }
}

function formatMorningDateTime() {
  const now = new Date();
  return now.toLocaleString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getDayPeriod() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  return "evening";
}

function getGreetingLabel(period) {
  if (period === "morning") return "Good Morning";
  if (period === "afternoon") return "Good Afternoon";
  return "Good Evening";
}

function getActiveQuotes() {
  const period = getDayPeriod();
  return DAY_QUOTES[period] || DAY_QUOTES.evening;
}

function updateMorningDateTime() {
  if (!morningDateTime) return;
  morningDateTime.textContent = formatMorningDateTime();
}

function rotateMorningQuote() {
  if (!morningQuoteTrack) return;
  const activeQuotes = getActiveQuotes();
  morningQuoteTrack.textContent = activeQuotes[morningQuoteIndex % activeQuotes.length];
  morningQuoteIndex += 1;
}

function showMorningGreetingPopup() {
  if (!morningGreetingPopup || !morningGreetingText) return;
  const period = getDayPeriod();
  const greeting = getGreetingLabel(period);
  if (morningGreetingTitle) {
    const icon = period === "morning" ? "🌞" : period === "afternoon" ? "☀️" : "🌙";
    morningGreetingTitle.textContent = `${icon} ${greeting}`;
  }
  morningGreetingText.textContent = `${greeting}! ${formatMorningDateTime()}`;
  morningGreetingPopup.classList.add("show");
  morningGreetingPopup.setAttribute("aria-hidden", "false");

  setTimeout(() => {
    morningGreetingPopup.classList.remove("show");
    morningGreetingPopup.setAttribute("aria-hidden", "true");
  }, 3600);
}

function initMorningExperience() {
  rotateMorningQuote();
  updateMorningDateTime();
  showMorningGreetingPopup();

  setInterval(rotateMorningQuote, 7000);
  setInterval(updateMorningDateTime, 1000);
}

function playSlideSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }

  const duration = 0.22;
  const now = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(820, now);
  osc.frequency.exponentialRampToValueAtTime(240, now + duration);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2200, now);
  filter.frequency.exponentialRampToValueAtTime(600, now + duration);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + duration);
}

function playPopupChime() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }

  const now = audioCtx.currentTime;
  const master = audioCtx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.14, now + 0.03);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.44);
  master.connect(audioCtx.destination);

  const toneA = audioCtx.createOscillator();
  toneA.type = "sine";
  toneA.frequency.setValueAtTime(560, now);
  toneA.frequency.exponentialRampToValueAtTime(760, now + 0.16);
  toneA.connect(master);
  toneA.start(now);
  toneA.stop(now + 0.18);

  const toneB = audioCtx.createOscillator();
  toneB.type = "triangle";
  toneB.frequency.setValueAtTime(780, now + 0.12);
  toneB.frequency.exponentialRampToValueAtTime(1020, now + 0.3);
  toneB.connect(master);
  toneB.start(now + 0.12);
  toneB.stop(now + 0.32);
}

function openChatPopup() {
  if (!chatCard || !chatBackdrop) return;
  chatCard.classList.add("open");
  chatBackdrop.classList.add("open");
  chatCard.setAttribute("aria-hidden", "false");
  document.body.classList.add("chat-open");
  playPopupChime();
  questionInput?.focus();
}

function closeChatPopup() {
  if (!chatCard || !chatBackdrop) return;
  chatCard.classList.remove("open");
  chatBackdrop.classList.remove("open");
  chatCard.setAttribute("aria-hidden", "true");
  document.body.classList.remove("chat-open");
}

function closeCameraQuickOptions() {
  if (!cameraQuickOptions || !openCameraBtn) return;
  cameraQuickOptions.classList.remove("open");
  cameraQuickOptions.setAttribute("aria-hidden", "true");
  openCameraBtn.setAttribute("aria-expanded", "false");
}

function toggleCameraQuickOptions() {
  if (!cameraQuickOptions || !openCameraBtn) return;
  const isOpen = cameraQuickOptions.classList.contains("open");
  if (isOpen) {
    closeCameraQuickOptions();
    return;
  }
  cameraQuickOptions.classList.add("open");
  cameraQuickOptions.setAttribute("aria-hidden", "false");
  openCameraBtn.setAttribute("aria-expanded", "true");
}

// ========== CUSTOM LANGUAGE DROPDOWN ==========
function openLangDropdown() {
  if (!langDropdownWrap || !langDropdownBtn) return;
  langDropdownWrap.dataset.open = "true";
  langDropdownBtn.setAttribute("aria-expanded", "true");
}

function closeLangDropdown() {
  if (!langDropdownWrap || !langDropdownBtn) return;
  langDropdownWrap.dataset.open = "false";
  langDropdownBtn.setAttribute("aria-expanded", "false");
}

function toggleLangDropdown() {
  if (langDropdownWrap?.dataset.open === "true") {
    closeLangDropdown();
  } else {
    openLangDropdown();
  }
}

function selectLangOption(value, label) {
  currentOutputLanguage = value;
  if (langSelectedText) langSelectedText.textContent = label;
  document.querySelectorAll(".lang-option").forEach((el) => {
    const active = el.dataset.value === value;
    el.classList.toggle("lang-option-active", active);
    el.setAttribute("aria-selected", active ? "true" : "false");
  });
  closeLangDropdown();
}

if (langDropdownBtn) {
  langDropdownBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleLangDropdown();
  });
}

if (langDropdownPanel) {
  langDropdownPanel.addEventListener("click", (e) => {
    const option = e.target.closest(".lang-option");
    if (!option) return;
    const value = option.dataset.value;
    selectLangOption(value, option.textContent.trim());
  });
}

document.addEventListener("click", (e) => {
  if (langDropdownWrap && !langDropdownWrap.contains(e.target)) {
    closeLangDropdown();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && langDropdownWrap?.dataset.open === "true") {
    closeLangDropdown();
    langDropdownBtn?.focus();
  }
});

function appendChatBubble(text, role) {
  if (!chatWindow) return;

  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = text;
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function resetChatThread(showMessage = true) {
  chatHistory = [];
  if (!chatWindow) return;
  chatWindow.innerHTML = "";
  if (showMessage) {
    appendChatBubble("Ask a question about the news to start.", "ai");
  }
}

function showTypingBubble() {
  if (!chatWindow) return;

  removeTypingBubble();

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble ai typing";
  bubble.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  typingBubbleEl = bubble;
}

function removeTypingBubble() {
  if (typingBubbleEl && typingBubbleEl.parentNode) {
    typingBubbleEl.parentNode.removeChild(typingBubbleEl);
  }
  typingBubbleEl = null;
}

function showResult(el) {
  if (!el) return;
  el.style.opacity = "0.35";
  el.style.transform = "translateY(6px)";
  requestAnimationFrame(() => {
    el.style.transition = "opacity 260ms ease, transform 260ms ease";
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  });
}

function setButtonLoading(button, isLoading, loadingText) {
  if (!button.dataset.originalText) {
    button.dataset.originalText = button.textContent;
  }
  button.disabled = isLoading;
  button.textContent = isLoading ? loadingText : button.dataset.originalText;
}

function updateStats() {
  const text = newsText.value.trim();
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const readMinutes = words ? Math.max(1, Math.ceil(words / 200)) : 0;
  wordCountEl.textContent = String(words);
  readTimeEl.textContent = `${readMinutes} min`;
}

function setActiveMode(mode) {
  activeMode = mode;
  selectedModeEl.textContent = mode ? mode[0].toUpperCase() + mode.slice(1) : "None";
  
  // Apply adaptive UI mode to body
  document.body.classList.remove("mode-child", "mode-student", "mode-professional");
  if (mode) {
    document.body.classList.add(`mode-${mode}`);
  }
}

async function postJSON(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Request failed");
  }
  return data;
}

function selectedLanguage() {
  return currentOutputLanguage || null;
}

function selectedLanguageRaw() {
  return currentOutputLanguage || "english";
}

async function extractTextFromImage(source) {
  if (!window.Tesseract) {
    throw new Error("OCR library not loaded. Refresh and try again.");
  }

  const result = await window.Tesseract.recognize(source, "eng");
  return (result?.data?.text || "").trim();
}

async function openCameraModal() {
  if (!cameraModal || !cameraVideo) return;
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    cameraVideo.srcObject = cameraStream;
    cameraModal.classList.add("open");
    cameraModal.setAttribute("aria-hidden", "false");
    setStatus("Camera opened. Align newspaper and capture.", "ok");
  } catch (err) {
    setStatus(`Camera error: ${err.message}`, "error");
  }
}

function stopCameraStream() {
  if (!cameraStream) return;
  cameraStream.getTracks().forEach((track) => track.stop());
  cameraStream = null;
}

function closeCameraModal() {
  if (!cameraModal) return;
  cameraModal.classList.remove("open");
  cameraModal.setAttribute("aria-hidden", "true");
  stopCameraStream();
}

async function captureAndExtract() {
  if (!cameraVideo || !cameraCanvas) return;
  if (!cameraVideo.videoWidth || !cameraVideo.videoHeight) {
    setStatus("Camera is not ready yet.", "error");
    return;
  }

  const ctx = cameraCanvas.getContext("2d");
  cameraCanvas.width = cameraVideo.videoWidth;
  cameraCanvas.height = cameraVideo.videoHeight;
  ctx.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);

  try {
    setButtonLoading(captureBtn, true, "Extracting...");
    setStatus("Extracting text from captured image...", "loading");
    const extracted = await extractTextFromImage(cameraCanvas);
    if (!extracted) {
      setStatus("No readable text found. Try a clearer image.", "error");
      return;
    }
    newsText.value = [newsText.value.trim(), extracted].filter(Boolean).join("\n\n");
    updateStats();
    closeCameraModal();
    setStatus("Text extracted from camera image.", "ok");
  } catch (err) {
    setStatus(`OCR failed: ${err.message}`, "error");
  } finally {
    setButtonLoading(captureBtn, false);
  }
}

summarizeBtn.addEventListener("click", async () => {
  const text = newsText.value.trim();
  const mode = userType || activeMode || "student";
  if (!text) return setStatus("Please paste news text first.", "error");

  try {
    setButtonLoading(summarizeBtn, true, "Generating...");
    setStatus("Generating summary and explanation...", "loading");
    setActiveMode(mode);

    const summaryData = await postJSON("/summarize", {
      news_text: text,
      mode,
      output_language: selectedLanguage(),
    });

    const explainData = await postJSON("/explain", {
      news_text: text,
      mode,
      output_language: selectedLanguage(),
    });

    latestResponseLanguage = explainData.language || summaryData.language || latestResponseLanguage;
    summaryOutput.textContent = formatSummaryAsBullets(summaryData.summary);

    const finalExplanation = mode === "kid" ? toKidStoryText(explainData.explanation) : explainData.explanation;
    explanationOutput.textContent = finalExplanation;
    latestExplanation = finalExplanation;

    if (mode === "kid") {
      renderStorybook(finalExplanation);
    }

    showResult(summaryOutput);
    showResult(explanationOutput);
    setStatus(`Summary and ${mode} explanation ready.`, "ok");
  } catch (err) {
    setStatus(err.message, "error");
  } finally {
    setButtonLoading(summarizeBtn, false);
  }
});

askBtn.addEventListener("click", async () => {
  const text = newsText.value.trim();
  const question = questionInput.value.trim();
  if (!text) return setStatus("Please paste news text first.", "error");
  if (!question) return setStatus("Please enter a question.", "error");

  if (chatNewsFingerprint !== text) {
    chatNewsFingerprint = text;
    resetChatThread(false);
  }

  try {
    appendChatBubble(question, "user");
    chatHistory.push({ role: "user", message: question });
    showTypingBubble();
    questionInput.value = "";
    setButtonLoading(askBtn, true, "Thinking...");
    setStatus("Getting answer...", "loading");
    const data = await postJSON("/chat", {
      news_text: text,
      question,
      history: chatHistory.slice(-8),
      output_language: selectedLanguage(),
      mode: userType || activeMode || "student",
    });
    latestResponseLanguage = data.language || latestResponseLanguage;
    removeTypingBubble();
    appendChatBubble(data.answer, "ai");
    chatHistory.push({ role: "assistant", message: data.answer });
    chatOutput.textContent = data.answer;
    showResult(chatOutput);
    setStatus("Answer ready.", "ok");
  } catch (err) {
    removeTypingBubble();
    setStatus(err.message, "error");
  } finally {
    setButtonLoading(askBtn, false);
  }
});

async function playNarration(text, silentStatus = false) {
  if (!text || text === "No explanation yet.") {
    if (!silentStatus) setStatus("Please generate an explanation first.", "error");
    return;
  }

  try {
    stopOtherAudioPlayback(audioPlayer);
    setVoiceButtonState("generating");
    if (voiceBtn) voiceBtn.disabled = true;
    if (!silentStatus) setStatus("Generating voice...", "loading");
    const data = await postJSON("/voice", {
      text,
      language: selectedLanguageRaw(),
    });
    audioPlayer.src = data.audio_url;
    const started = await audioPlayer.play().then(() => true).catch(() => false);
    setVoiceButtonState(started ? "playing" : "idle");
    if (!silentStatus) setStatus("Voice generated.", "ok");
  } catch (err) {
    if (!silentStatus) setStatus(err.message, "error");
    setVoiceButtonState("idle");
  } finally {
    if (voiceBtn) voiceBtn.disabled = false;
  }
}

voiceBtn.addEventListener("click", async () => {
  if (audioPlayer && !audioPlayer.paused) {
    stopAllAudioPlayback();
    setStatus("Voice playback stopped.", "ok");
    return;
  }
  const text = latestExplanation || explanationOutput.textContent.trim();
  await playNarration(text, false);
});

if (pauseBtn) {
  pauseBtn.addEventListener("click", () => {
    if (audioPlayer && !audioPlayer.paused) {
      audioPlayer.pause();
    }
  });
}

if (audioPlayer) {
  audioPlayer.addEventListener("play", () => setVoiceButtonState("playing"));
  audioPlayer.addEventListener("pause", () => setVoiceButtonState("idle"));
  audioPlayer.addEventListener("ended", () => setVoiceButtonState("idle"));
}

// ========== SUMMARY AUDIO PLAYBACK ==========
async function playSummaryAudio(text) {
  if (!text || text === "No summary yet.") {
    setStatus("Please generate a summary first.", "error");
    return;
  }

  try {
    stopOtherAudioPlayback(summaryAudioPlayer);
    if (summarySpeakBtn) summarySpeakBtn.disabled = true;
    summarySpeakBtn.classList.add("playing");
    setStatus("Generating summary narration...", "loading");
    
    const data = await postJSON("/voice", {
      text,
      language: selectedLanguageRaw(),
    });
    
    summaryAudioPlayer.src = data.audio_url;
    const started = await summaryAudioPlayer.play().then(() => true).catch(() => false);
    
    if (started) {
      setStatus("Summary narration playing.", "ok");
    } else {
      summarySpeakBtn.classList.remove("playing");
      setStatus("Failed to play audio.", "error");
    }
  } catch (err) {
    setStatus(err.message, "error");
    summarySpeakBtn.classList.remove("playing");
  } finally {
    if (summarySpeakBtn) summarySpeakBtn.disabled = false;
  }
}

if (summarySpeakBtn) {
  summarySpeakBtn.addEventListener("click", async () => {
    if (summaryAudioPlayer && !summaryAudioPlayer.paused) {
      stopAllAudioPlayback();
      setStatus("Summary audio stopped.", "ok");
      return;
    }
    const text = summaryOutput.textContent.trim();
    await playSummaryAudio(text);
  });
}

if (summaryAudioPlayer) {
  summaryAudioPlayer.addEventListener("play", () => {
    if (summarySpeakBtn) summarySpeakBtn.classList.add("playing");
  });
  summaryAudioPlayer.addEventListener("pause", () => {
    if (summarySpeakBtn) summarySpeakBtn.classList.remove("playing");
  });
  summaryAudioPlayer.addEventListener("ended", () => {
    if (summarySpeakBtn) summarySpeakBtn.classList.remove("playing");
  });
}

// ========== EXPLANATION AUDIO PLAYBACK ==========
async function playExplanationAudio(text) {
  if (!text || text === "No explanation yet.") {
    setStatus("Please generate an explanation first.", "error");
    return;
  }

  try {
    stopOtherAudioPlayback(explanationAudioPlayer);
    if (explanationSpeakBtn) explanationSpeakBtn.disabled = true;
    explanationSpeakBtn.classList.add("playing");
    setStatus("Generating explanation narration...", "loading");
    
    const data = await postJSON("/voice", {
      text,
      language: selectedLanguageRaw(),
    });
    
    explanationAudioPlayer.src = data.audio_url;
    const started = await explanationAudioPlayer.play().then(() => true).catch(() => false);
    
    if (started) {
      setStatus("Explanation narration playing.", "ok");
    } else {
      explanationSpeakBtn.classList.remove("playing");
      setStatus("Failed to play audio.", "error");
    }
  } catch (err) {
    setStatus(err.message, "error");
    explanationSpeakBtn.classList.remove("playing");
  } finally {
    if (explanationSpeakBtn) explanationSpeakBtn.disabled = false;
  }
}

if (explanationSpeakBtn) {
  explanationSpeakBtn.addEventListener("click", async () => {
    if (explanationAudioPlayer && !explanationAudioPlayer.paused) {
      stopAllAudioPlayback();
      setStatus("Explanation audio stopped.", "ok");
      return;
    }
    const text = latestExplanation || explanationOutput.textContent.trim();
    await playExplanationAudio(text);
  });
}

if (explanationAudioPlayer) {
  explanationAudioPlayer.addEventListener("play", () => {
    if (explanationSpeakBtn) explanationSpeakBtn.classList.add("playing");
  });
  explanationAudioPlayer.addEventListener("pause", () => {
    if (explanationSpeakBtn) explanationSpeakBtn.classList.remove("playing");
  });
  explanationAudioPlayer.addEventListener("ended", () => {
    if (explanationSpeakBtn) explanationSpeakBtn.classList.remove("playing");
  });
}

newsText.addEventListener("input", updateStats);
questionInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    askBtn.click();
  }
});

if (clearChatBtn) {
  clearChatBtn.addEventListener("click", () => {
    resetChatThread(true);
    setStatus("Chat cleared.", "ok");
  });
}

if (chatLauncher) {
  chatLauncher.addEventListener("click", openChatPopup);
}

if (closeChatBtn) {
  closeChatBtn.addEventListener("click", closeChatPopup);
}

if (chatBackdrop) {
  chatBackdrop.addEventListener("click", closeChatPopup);
}

if (openCameraBtn) {
  openCameraBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleCameraQuickOptions();
  });
}

if (scanCameraOption) {
  scanCameraOption.addEventListener("click", () => {
    closeCameraQuickOptions();
    openCameraModal();
  });
}

if (uploadPhotoOption && imageInput) {
  uploadPhotoOption.addEventListener("click", () => {
    closeCameraQuickOptions();
    imageInput.click();
  });
}

if (closeCameraBtn) {
  closeCameraBtn.addEventListener("click", closeCameraModal);
}

if (captureBtn) {
  captureBtn.addEventListener("click", captureAndExtract);
}

if (imageInput) {
  imageInput.addEventListener("change", async () => {
    const file = imageInput.files?.[0];
    if (!file) return;
    try {
      setStatus("Extracting text from uploaded image...", "loading");
      const extracted = await extractTextFromImage(file);
      if (!extracted) {
        setStatus("No readable text found in upload.", "error");
      } else {
        newsText.value = [newsText.value.trim(), extracted].filter(Boolean).join("\n\n");
        updateStats();
        setStatus("Text extracted from uploaded image.", "ok");
      }
    } catch (err) {
      setStatus(`OCR failed: ${err.message}`, "error");
    } finally {
      imageInput.value = "";
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeChatPopup();
    closeCameraModal();
    closeCameraQuickOptions();
  }
});

document.addEventListener("click", (event) => {
  if (!cameraQuickMenu || !cameraQuickOptions) return;
  if (!cameraQuickMenu.contains(event.target)) {
    closeCameraQuickOptions();
  }
});

// ============ USER TYPE SELECTION ============

function setUserType(type) {
  userType = type;
  localStorage.setItem("userType", type);
  
  // Update modal UI
  userTypeButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.userType === type);
  });
  
  // Apply user type theme to body
  document.body.classList.remove("mode-child", "mode-student", "mode-professional");
  document.body.classList.add(`mode-${type}`);
  setActiveMode(type);
  applyProfileContent(type);

  if (type === "kid" && latestExplanation) {
    const transformedStory = toKidStoryText(latestExplanation);
    latestExplanation = transformedStory;
    explanationOutput.textContent = transformedStory;
    renderStorybook(transformedStory);
  }

  if (type !== "kid" && audioPlayer) {
    audioPlayer.pause();
    setVoiceButtonState("idle");
  }
  
  // Hide modal
  userTypeModal.setAttribute("aria-hidden", "true");
}

function openUserTypeSelector() {
  userTypeModal.setAttribute("aria-hidden", "false");
}

// Initialize user type on page load
if (userType) {
  setUserType(userType);
} else {
  openUserTypeSelector();
}

// Event listeners for user type buttons
userTypeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.userType;
    setUserType(type);
  });
});

// "Get Started" button opens user type selector modal
const getStartedBtn = document.querySelector(".navbar-cta");
const drawerCTA = document.querySelector(".drawer-cta");

if (getStartedBtn) {
  getStartedBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openUserTypeSelector();
  });
}

if (drawerCTA) {
  drawerCTA.addEventListener("click", (e) => {
    e.preventDefault();
    openUserTypeSelector();
  });
}

// Settings button to change user type
settingsBtn.addEventListener("click", () => {
  openUserTypeSelector();
});

// ========== TAB SWITCHING ==========
const tabBtns = document.querySelectorAll(".tab-btn");
const tabsContainer = document.getElementById("tabsContainer");
const summaryCard = document.getElementById("summaryCard");
const explanationCard = document.getElementById("explanationCard");
const voiceCard = document.getElementById("voiceCard");

function switchTab(tabName) {
  // Stop any active voice when switching tabs
  stopAllAudioPlayback();

  // Update active tab button
  tabBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  // Show/hide content based on tab
  if (tabName === "summary") {
    summaryCard.style.display = "block";
    explanationCard.style.display = "none";
    // Hide anchor card in summary mode
    if (voiceCard) voiceCard.style.display = "none";
  } else if (tabName === "explanation") {
    summaryCard.style.display = "none";
    explanationCard.style.display = "block";
    // Hide anchor card in explanation mode
    if (voiceCard) voiceCard.style.display = "none";
  } else if (tabName === "story") {
    // Story Mode shows only anchor in ALL modes
    summaryCard.style.display = "none";
    explanationCard.style.display = "none";
    if (voiceCard) voiceCard.style.display = "flex";
  }
}

// Add tab button listeners
tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tabName = btn.dataset.tab;
    switchTab(tabName);
  });
});

// Default to summary tab
if (tabsContainer) {
  switchTab("summary");
}

// ========== NAVBAR MOBILE MENU ==========
function toggleMobileMenu() {
  const isOpen = hamburgerBtn.getAttribute("aria-expanded") === "true";
  hamburgerBtn.setAttribute("aria-expanded", !isOpen);
  mobileDrawer.setAttribute("aria-hidden", isOpen);
  drawerBackdrop.setAttribute("aria-hidden", isOpen);
}

function closeMobileMenu() {
  hamburgerBtn.setAttribute("aria-expanded", "false");
  mobileDrawer.setAttribute("aria-hidden", "true");
  drawerBackdrop.setAttribute("aria-hidden", "true");
}

hamburgerBtn.addEventListener("click", toggleMobileMenu);
drawerBackdrop.addEventListener("click", closeMobileMenu);

drawerLinks.forEach((link) => {
  link.addEventListener("click", closeMobileMenu);
});

initMorningExperience();
updateStats();
