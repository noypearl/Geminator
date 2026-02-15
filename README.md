# ✨ Geminator

A sleek Chrome extension powered by Google's built-in AI APIs. Generate text, translate languages, summarize web pages, and ask questions about any page — all from a beautiful dark-themed popup. No API keys needed.

![Chrome](https://img.shields.io/badge/Chrome-138%2B-blue?logo=googlechrome&logoColor=white)
![Manifest](https://img.shields.io/badge/Manifest-V3-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🚀 Features

### 📝 Text Generator
Generate text responses using Chrome's built-in **LanguageModel** (Gemini Nano). Just type a prompt and get an instant response — completely local and free.

### 🌐 Translator
Translate text between **20 languages** using Chrome's built-in AI:
1. Chrome built-in **Translator API** (native)
2. Chrome **LanguageModel** (Prompt API) fallback

Supported languages: English, Spanish, French, German, Italian, Portuguese, Dutch, Russian, Japanese, Korean, Chinese, Arabic, Hindi, Turkish, Polish, Vietnamese, Thai, Indonesian, Ukrainian, and Hebrew.

### ⚡ TL;DR — Page Summarizer
Summarize any web page with one click:
1. Chrome built-in **Summarizer API** (native)
2. Chrome **LanguageModel** fallback

After summarizing, ask follow-up questions about the page content directly in the extension.

### 🖼️ Image Generator
*Coming soon* — Will be available when a free image generation API is released by Google.

---

## 🎨 Design

- **Dark theme** inspired by Google Gemini's UI
- Smooth animations for tab switching, loading states, and result reveals
- Shimmer effect on buttons while waiting for responses
- Animated loading dots on status messages
- Clean, modern interface with rounded components and subtle transitions

---

## ⚙️ Settings

- **Auto-copy to clipboard** — Toggle to automatically copy generated output to your clipboard

---

## 📦 Installation

### From source (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/geminator.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the cloned folder
5. The Geminator icon will appear in your extensions bar

### Enable Chrome Built-in AI (required)

1. Make sure you're on **Chrome 138+** (or Chrome Canary/Dev)
2. Go to `chrome://flags/#optimization-guide-on-device-model` → Set to **Enabled BypassPerfRequirement**
3. Go to `chrome://flags/#prompt-api-for-gemini-nano` → Set to **Enabled**
4. Optionally enable `chrome://flags/#summarization-api-for-gemini-nano` and `chrome://flags/#translation-api` for native summarization and translation
5. Restart Chrome

> **Note:** All AI features run locally on your device via Chrome's built-in Gemini Nano model. No API keys or cloud services required.

---

## 🗂️ Project Structure

```
geminator/
├── manifest.json    # Chrome extension manifest (MV3)
├── popup.html       # UI layout and styles
├── popup.js         # All extension logic
└── README.md
```

---

## 🔑 Permissions

| Permission | Reason |
|---|---|
| `storage` | Save settings locally |
| `activeTab` | Read the current tab's content for TL;DR summarization |
| `scripting` | Inject content script to extract page text |

---

## 🛠️ Tech Stack

- **Chrome Extension Manifest V3**
- **Chrome Built-in AI APIs** — LanguageModel, Translator, Summarizer
- **Vanilla HTML/CSS/JS** — zero dependencies, no API keys

---

## 📄 License

MIT License — feel free to use, modify, and distribute.
