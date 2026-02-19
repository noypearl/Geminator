# ✨ Geminator - Gemini + Chrome = <3

A straight-forward Chrome extension powered by Google's built-in AI APIs. Generate text, translate languages, summarize web pages, and ask questions about any page — all from a beautiful dark-themed popup. 
### No API keys needed.


![Chrome](https://img.shields.io/badge/Chrome-138%2B-blue?logo=googlechrome&logoColor=white)
![Manifest](https://img.shields.io/badge/Manifest-V3-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

### 😱😱😱 Now in the official [Chrome Web Store](https://chromewebstore.google.com/detail/geminator/hpkmeednjmnkioilodiiblpldcmobllc?authuser=0&hl=en-GB)

## 🚀 Features

### 📝 Text Generator
Generate text responses using Chrome's built-in **LanguageModel** (Gemini Nano). Just type a prompt and get an instant response — completely local and free.

<img width="640" height="400" alt="Text Generator Tab" src="https://github.com/user-attachments/assets/22270dfd-9dc0-45ac-a934-db2915abd8a3" />


### 🌐 Translator
Translate text between **20 languages** using Chrome's built-in Translator API 

Supported languages: English, Spanish, French, German, Italian, Portuguese, Dutch, Russian, Japanese, Korean, Chinese, Arabic, Hindi, Turkish, Polish, Vietnamese, Thai, Indonesian, Ukrainian, and Hebrew.

<img width="640" height="400" alt="Translator Tab" src="https://github.com/user-attachments/assets/582cabd2-45a4-4165-8821-f2b7997dbe80" />


### ⚡ TL;DR — Page Summarizer
Summarize any web page with one click.
Before clicking the button:
<img width="640" height="400" alt="TL;DR image" src="https://github.com/user-attachments/assets/ea911bd9-ea3a-4dc2-9b9f-46e8415c98f0" />
<br><br>
After:
<br><br>
<img width="640" height="400" alt="TL;DR result example" src="https://github.com/user-attachments/assets/9b50fa5b-ec30-483b-b526-8314e48a5698" />



After summarizing, you can ask follow-up questions about the page content directly in the extension.

### 🪄 Optimizer
built-in Prompt Architect analyzes your raw prompts, critiques their structure, and automatically transforms them into professional-grade instructions with expert personas and clear constraints.

<img width="640" height="400" alt="Optimizer Tab" src="https://github.com/user-attachments/assets/7bef2a4c-f38b-4cd4-ad2c-60c3e967215f" />

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
   git clone https://github.com/noypearl/geminator.git
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
├── icons/           # Icons for extension  
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
