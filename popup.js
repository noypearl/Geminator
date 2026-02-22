// ── Globals ──
let autoCopy = false;

// ── Init ──
document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  const stored = await chrome.storage.local.get(['autoCopy', 'defaultSourceLang', 'defaultTargetLang', 'optimizerLevel']);
  if (stored.autoCopy) {
    autoCopy = true;
    document.getElementById('autoCopyToggle').checked = true;
  }
  // Restore default languages
  if (stored.defaultSourceLang) {
    document.getElementById('sourceLang').value = stored.defaultSourceLang;
  }
  if (stored.defaultTargetLang) {
    document.getElementById('targetLang').value = stored.defaultTargetLang;
  }
  // Restore optimizer slider level (also updates labels + description via updateSliderUI later)
  if (stored.optimizerLevel != null) {
    document.getElementById('optimizerLevel').value = stored.optimizerLevel;
  }

  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  // Info panel toggle
  document.getElementById('infoBtn').addEventListener('click', () => {
    const infoPanel = document.getElementById('infoPanel');
    const settingsPanel = document.getElementById('settingsPanel');
    // Close settings if open
    if (settingsPanel.classList.contains('visible')) settingsPanel.classList.remove('visible');
    infoPanel.classList.toggle('visible');
  });

  // Settings panel toggle
  document.getElementById('settingsBtn').addEventListener('click', () => {
    const settingsPanel = document.getElementById('settingsPanel');
    const infoPanel = document.getElementById('infoPanel');
    // Close info if open
    if (infoPanel.classList.contains('visible')) infoPanel.classList.remove('visible');
    settingsPanel.classList.toggle('visible');
  });

  // Auto-copy toggle
  document.getElementById('autoCopyToggle').addEventListener('change', async (e) => {
    autoCopy = e.target.checked;
    await chrome.storage.local.set({ autoCopy });
  });

  // Generate buttons
  document.getElementById('generateTextBtn').addEventListener('click', generateText);
  document.getElementById('translateBtn').addEventListener('click', translateText);
  document.getElementById('summarizeBtn').addEventListener('click', summarizePage);
  document.getElementById('qaBtn').addEventListener('click', askAboutPage);

  // Swap languages
  document.getElementById('swapLangsBtn').addEventListener('click', () => {
    const btn = document.getElementById('swapLangsBtn');
    const src = document.getElementById('sourceLang');
    const tgt = document.getElementById('targetLang');
    const tmp = src.value;
    src.value = tgt.value;
    tgt.value = tmp;
    // Spin the swap icon
    const svg = btn.querySelector('svg');
    svg.style.transform = 'rotate(180deg)';
    setTimeout(() => { svg.style.transform = ''; }, 350);
  });

  // Copy buttons
  document.getElementById('copyTextBtn').addEventListener('click', copyText);
  document.getElementById('copyTranslateBtn').addEventListener('click', copyTranslation);
  document.getElementById('copyTldrBtn').addEventListener('click', () => copyFromElement('tldrResult', 'copyTldrBtn'));
  document.getElementById('copyQaBtn').addEventListener('click', () => copyFromElement('qaResult', 'copyQaBtn'));

  // Optimizer buttons
  document.getElementById('optimizeBtn').addEventListener('click', optimizePrompt);
  document.getElementById('copyOptimizerBtn').addEventListener('click', () => copyFromElement('optimizerResult', 'copyOptimizerBtn'));
  document.getElementById('critiqueToggleBtn').addEventListener('click', () => {
    document.getElementById('critiqueSection').classList.toggle('visible');
  });

  // Optimizer slider — highlight active label + dynamic description
  const optimizerSlider = document.getElementById('optimizerLevel');
  const sliderLabels = document.querySelectorAll('.slider-labels span');
  const sliderDescText = document.getElementById('sliderDescText');

  const LEVEL_DESCRIPTIONS = [
    'Quick cleanup — improves clarity and removes ambiguity',
    'Adds persona, constraints, and a brief critique',
    'Full structure with template variables and reasoning steps',
    'Maximum detail with few-shot examples and all techniques'
  ];

  const LEVEL_COLORS = [
    { thumb: '#a8c7fa', glow: 'rgba(168, 199, 250, 0.25)', accent: '#a8c7fa' },  // pastel blue
    { thumb: '#c2a8fa', glow: 'rgba(194, 168, 250, 0.25)', accent: '#c2a8fa' },  // pastel purple
    { thumb: '#f2a8c7', glow: 'rgba(242, 168, 199, 0.25)', accent: '#f2a8c7' },  // pastel pink
    { thumb: '#f5c5a3', glow: 'rgba(245, 197, 163, 0.25)', accent: '#f5c5a3' }   // pastel peach
  ];

  let currentLevel = -1;
  const sliderGroup = document.querySelector('.optimizer-level-group');

  function updateSliderUI(value) {
    const v = parseInt(value, 10);
    sliderLabels.forEach(lbl => {
      lbl.classList.toggle('active', lbl.dataset.level === String(v));
    });

    // Update pastel colors
    const colors = LEVEL_COLORS[v] || LEVEL_COLORS[0];
    optimizerSlider.style.setProperty('--thumb-color', colors.thumb);
    optimizerSlider.style.setProperty('--glow-color', colors.glow);
    sliderGroup.style.setProperty('--slider-accent', colors.accent);

    const desc = LEVEL_DESCRIPTIONS[v] || LEVEL_DESCRIPTIONS[1];
    if (currentLevel !== v && currentLevel !== -1) {
      // Fade out, swap text, fade in
      sliderDescText.classList.add('fading');
      setTimeout(() => {
        sliderDescText.textContent = desc;
        sliderDescText.classList.remove('fading');
      }, 150);
    } else {
      sliderDescText.textContent = desc;
    }
    currentLevel = v;
  }

  optimizerSlider.addEventListener('input', (e) => {
    updateSliderUI(e.target.value);
    chrome.storage.local.set({ optimizerLevel: parseInt(e.target.value, 10) });
  });

  // Clicking a label jumps the slider to that level
  sliderLabels.forEach(lbl => {
    lbl.addEventListener('click', () => {
      const val = lbl.dataset.level;
      optimizerSlider.value = val;
      updateSliderUI(val);
      chrome.storage.local.set({ optimizerLevel: parseInt(val, 10) });
    });
  });

  // Sync slider UI with the (possibly restored) value
  updateSliderUI(optimizerSlider.value);
});

// ── Helpers ──
function setStatus(id, msg) {
  const el = document.getElementById(id);
  if (msg && msg !== 'Done!') {
    el.innerHTML = msg + '<span class="loading-dots"><span></span><span></span><span></span></span>';
  } else {
    el.textContent = msg;
  }
}

function showResult(areaId) {
  document.getElementById(areaId).classList.add('visible');
}

function setBtnLoading(btn, loading) {
  if (loading) {
    btn.classList.add('loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

async function autoCopyResult(text) {
  if (!autoCopy || !text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    console.error('Auto-copy failed:', e);
  }
}

function flashCopied(btn) {
  btn.classList.add('copied');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> Copied!';
  setTimeout(() => {
    btn.classList.remove('copied');
    btn.innerHTML = originalHTML;
  }, 1500);
}

// ── Text Generation ──
async function generateText() {
  const prompt = document.getElementById('textPrompt').value.trim();
  const status = 'textStatus';
  const resultDiv = document.getElementById('textResult');
  const btn = document.getElementById('generateTextBtn');

  if (!prompt) {
    setStatus(status, 'Please enter a prompt.');
    return;
  }

  setBtnLoading(btn, true);
  resultDiv.textContent = '';
  document.getElementById('textResultArea').classList.remove('visible');
  setStatus(status, 'Checking API...');

  try {
    if (typeof LanguageModel === 'undefined') {
      throw new Error('Chrome built-in AI is not available. Please enable the required flags in chrome://flags.');
    }

    setStatus(status, 'Checking model availability...');
    const availability = await LanguageModel.availability();

    if (availability === 'unavailable') {
      throw new Error('Built-in model unavailable. Please check chrome://flags for Prompt API.');
    }

    setStatus(status, 'Creating session...');
    const session = await LanguageModel.create({
      expectedOutputLanguages: ['en'],
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          setStatus(status, `Downloading model... ${Math.round(e.loaded / e.total * 100)}%`);
        });
      }
    });

    setStatus(status, 'Generating response...');

    const result = await session.prompt(prompt);
    resultDiv.textContent = result;
    showResult('textResultArea');
    setStatus(status, 'Done!');
    await autoCopyResult(result);
    session.destroy();
  } catch (e) {
    setStatus(status, 'Error occurred.');
    resultDiv.textContent = e.message;
    showResult('textResultArea');
    console.error('Text generation error:', e);
  } finally {
    setBtnLoading(btn, false);
  }
}

// ── Translation ──
const LANG_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
  pt: 'Portuguese', nl: 'Dutch', ru: 'Russian', ja: 'Japanese', ko: 'Korean',
  zh: 'Chinese', ar: 'Arabic', hi: 'Hindi', tr: 'Turkish', pl: 'Polish',
  vi: 'Vietnamese', th: 'Thai', id: 'Indonesian', uk: 'Ukrainian', he: 'Hebrew'
};

async function translateText() {
  const input = document.getElementById('translateInput').value.trim();
  const sourceLang = document.getElementById('sourceLang').value;
  const targetLang = document.getElementById('targetLang').value;
  const status = 'translateStatus';
  const resultDiv = document.getElementById('translateResult');
  const btn = document.getElementById('translateBtn');

  if (!input) {
    setStatus(status, 'Please enter text to translate.');
    return;
  }

  if (sourceLang === targetLang) {
    setStatus(status, 'Source and target languages must be different.');
    return;
  }

  // Auto-save chosen languages as default
  chrome.storage.local.set({ defaultSourceLang: sourceLang, defaultTargetLang: targetLang });

  setBtnLoading(btn, true);
  resultDiv.textContent = '';
  document.getElementById('translateResultArea').classList.remove('visible');
  setStatus(status, 'Translating...');

  try {
    // Try Chrome built-in Translator API first (Chrome 138+)
    if (typeof Translator !== 'undefined') {
      setStatus(status, 'Using built-in translator...');

      const translator = await Translator.create({
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            setStatus(status, `Downloading language pack... ${Math.round(e.loaded / e.total * 100)}%`);
          });
        }
      });

      const result = await translator.translate(input);
      resultDiv.textContent = result;
      showResult('translateResultArea');
      setStatus(status, 'Done!');
      await autoCopyResult(result);
      translator.destroy();
      return;
    }

    // Fallback: use LanguageModel (Prompt API) for translation
    if (typeof LanguageModel !== 'undefined') {
      setStatus(status, 'Using AI model for translation...');
      const availability = await LanguageModel.availability();

      if (availability !== 'unavailable') {
        const session = await LanguageModel.create({
          monitor(m) {
            m.addEventListener('downloadprogress', (e) => {
              setStatus(status, `Downloading model... ${Math.round(e.loaded / e.total * 100)}%`);
            });
          }
        });

        const prompt = `Translate the following text from ${LANG_NAMES[sourceLang]} to ${LANG_NAMES[targetLang]}. Only output the translation, nothing else:\n\n${input}`;
        const result = await session.prompt(prompt);
        resultDiv.textContent = result;
        showResult('translateResultArea');
        setStatus(status, 'Done!');
        await autoCopyResult(result);
        session.destroy();
        return;
      }
    }

    throw new Error('Chrome built-in AI is not available. Please enable the required flags in chrome://flags.');
  } catch (e) {
    setStatus(status, 'Error occurred.');
    resultDiv.textContent = e.message;
    showResult('translateResultArea');
    console.error('Translation error:', e);
  } finally {
    setBtnLoading(btn, false);
  }
}

// ── Copy Functions ──
async function copyTranslation() {
  const text = document.getElementById('translateResult').textContent;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    flashCopied(document.getElementById('copyTranslateBtn'));
  } catch (e) {
    console.error('Copy failed:', e);
  }
}

async function copyText() {
  const text = document.getElementById('textResult').textContent;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    flashCopied(document.getElementById('copyTextBtn'));
  } catch (e) {
    console.error('Copy failed:', e);
  }
}

async function copyFromElement(resultId, btnId) {
  const text = document.getElementById(resultId).textContent;
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    flashCopied(document.getElementById(btnId));
  } catch (e) {
    console.error('Copy failed:', e);
  }
}

// ── TL;DR: Page content extraction ──
let pageContent = '';

async function getPageContent() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error('No active tab found.');

  document.getElementById('pageTitle').textContent = tab.title || 'Untitled page';

  if (!chrome.scripting) {
    throw new Error('Scripting API unavailable. Please go to chrome://extensions, remove and re-add the extension, then try again.');
  }

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const clone = document.cloneNode(true);
      clone.querySelectorAll('script, style, noscript, iframe, svg, nav, footer, header').forEach(el => el.remove());
      return clone.body?.innerText?.trim() || '';
    }
  });

  const text = results?.[0]?.result;
  if (!text) throw new Error('Could not extract page content. The page may be restricted.');

  // Truncate to ~8000 chars to stay within model limits
  return text.length > 8000 ? text.substring(0, 8000) + '...' : text;
}

// ── TL;DR: Summarize ──
async function summarizePage() {
  const status = 'tldrStatus';
  const resultDiv = document.getElementById('tldrResult');
  const btn = document.getElementById('summarizeBtn');

  setBtnLoading(btn, true);
  resultDiv.textContent = '';
  document.getElementById('tldrResultArea').classList.remove('visible');
  setStatus(status, 'Reading page content...');

  try {
    pageContent = await getPageContent();
    setStatus(status, 'Summarizing...');

    // Try Chrome built-in Summarizer API first (Chrome 138+)
    if (typeof Summarizer !== 'undefined') {
      const summarizer = await Summarizer.create({
        type: 'key-points',
        length: 'medium',
        outputLanguage: 'en',
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            setStatus(status, `Downloading summarizer... ${Math.round(e.loaded / e.total * 100)}%`);
          });
        }
      });

      const summary = await summarizer.summarize(pageContent);
      resultDiv.textContent = summary;
      showResult('tldrResultArea');
      setStatus(status, 'Done!');
      await autoCopyResult(summary);
      summarizer.destroy();
      return;
    }

    // Fallback: use LanguageModel (Prompt API)
    if (typeof LanguageModel !== 'undefined') {
      const availability = await LanguageModel.availability();

      if (availability !== 'unavailable') {
        setStatus(status, 'Using AI model to summarize...');
        const session = await LanguageModel.create({
          expectedOutputLanguages: ['en'],
          monitor(m) {
            m.addEventListener('downloadprogress', (e) => {
              setStatus(status, `Downloading model... ${Math.round(e.loaded / e.total * 100)}%`);
            });
          }
        });

        const prompt = `Provide a concise TL;DR summary of the following web page content. Use bullet points for key points:\n\n${pageContent}`;
        const summary = await session.prompt(prompt);
        resultDiv.textContent = summary;
        showResult('tldrResultArea');
        setStatus(status, 'Done!');
        await autoCopyResult(summary);
        session.destroy();
        return;
      }
    }

    throw new Error('Chrome built-in AI is not available. Please enable the required flags in chrome://flags.');
  } catch (e) {
    setStatus(status, 'Error occurred.');
    resultDiv.textContent = e.message;
    showResult('tldrResultArea');
    console.error('Summarize error:', e);
  } finally {
    setBtnLoading(btn, false);
  }
}

// ── Optimizer ──
const OPTIMIZER_PROMPTS = [
  // Level 0 — Simple: concise rewrite, no frills
  `You are a helpful prompt-improvement assistant. Your task is to rewrite the user's prompt so it is clearer, more specific, and better structured. Keep the improved prompt concise — do NOT add examples or lengthy instructions.

Rules:
- Fix ambiguity and vagueness.
- Add any missing context that would help an AI understand the task.
- Do NOT add few-shot examples.
- Do NOT explain your changes.
- Wrap your improved prompt in <LOL_PROMPT> tags. Output ONLY the <LOL_PROMPT> block, nothing else.
`,

  // Level 1 — Standard: adds persona, constraints, brief critique
  `You are a prompt engineer. Analyze the user's prompt and create a clearer, better-structured version.

### Instructions:
1. Rewrite the prompt with a clear role/persona assignment (start with "You are a...").
2. State the objective precisely and add Do/Do Not constraints where helpful.
3. Keep the result focused — do NOT add few-shot examples or template variables.
4. Format your response using these tags:
   - <LOL_CRITIQUE> — a brief analysis (2-4 sentences) of the original prompt's weaknesses.
   - <LOL_PROMPT> — the improved, copy-paste ready prompt.
`,

  // Level 2 — Advanced: adds XML delimiters, template variables, chain-of-thought
  `You are an expert Prompt Engineer. Analyze and transform the user's prompt into a high-performing version using professional techniques.

### Instructions:
1. **Analyze:** Evaluate the original prompt for clarity, persona, constraints, and data separation.
2. **Re-Architect:** Build an improved version with Persona assignment, clear Objective, Do/Do Not constraints, and XML-style delimiters for variable data.
3. **Format:** You MUST wrap your response in the following tags:
   - <LOL_CRITIQUE> — analysis of the original prompt.
   - <LOL_PROMPT> — the improved, copy-paste ready prompt.
   - <LOL_TEMPLATE_VARIABLES> — list and explain any placeholders (e.g., {{DATA}}) used.

### Structural Rules for <LOL_PROMPT>:
- **Persona:** Start with a clear "You are a..." role.
- **Objective:** Precise, action-oriented task statement.
- **Constraints:** Clear "Do/Do Not" boundaries.
- **Delimiters:** Use XML-style tags within the prompt to isolate variable data.
- **Reasoning:** End with a "Think step-by-step" instruction.
`,

  // Level 3 — Expert: full treatment with few-shot examples
  `You are an expert Prompt Engineer specializing in LLM optimization and template architecture. Your task is to analyze, critique, and transform the user-provided prompt into a high-performing, reusable template.

### Instructions:
1. **Analyze:** Evaluate the original prompt for clarity, persona, constraints, and data separation.
2. **Re-Architect:** Build a superior version using professional prompt engineering techniques (Few-Shot examples, Persona assignment, XML delimiters, and Chain-of-Thought).
3. **Format:** You MUST wrap your response in the following tags:
   - wrap the analysis of the original prompt in <LOL_CRITIQUE> tags.
   - wrap the final, improved, copy-paste ready prompt in <LOL_PROMPT> tags.
   - wrap the list and explain the placeholders (e.g., {{DATA}}) used in the improved prompt in <LOL_TEMPLATE_VARIABLES> tags.

### Structural Rules for <LOL_PROMPT>:
- **Persona:** Start with a clear "You are a..." role.
- **Objective:** Precise, action-oriented task statement.
- **Constraints:** Clear "Do/Do Not" boundaries.
- **Delimiters:** Use XML-style tags within the prompt to isolate variable data.
- **Examples:** Include 1-2 few-shot examples if the task is complex.
- **Reasoning:** End with a "Think step-by-step" instruction.
`
];

function parseOptimizerResponse(raw) {
  function extractTag(text, tag) {
    // 1. Try matching a properly-closed tag pair first
    const closed = new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`, 'i');
    const m1 = text.match(closed);
    if (m1) return m1[1].trim();

    // 2. Fallback: tag is opened but never closed — grab everything from the
    //    opening tag up to the next <LOL_ opening tag or end-of-string.
    const open = new RegExp(`<${tag}>\\s*([\\s\\S]*?)(?=<LOL_|$)`, 'i');
    const m2 = text.match(open);
    return m2 ? m2[1].trim() : '';
  }

  function stripAllLolTags(text) {
    // Remove every opening and closing LOL_* tag (covers CRITIQUE, PROMPT,
    // TEMPLATE_VARIABLES and any future ones).
    return text.replace(/<\/?LOL_[A-Z_]*>/gi, '');
  }

  const prompt = extractTag(raw, 'LOL_PROMPT');
  const critique = extractTag(raw, 'LOL_CRITIQUE');
  const variables = extractTag(raw, 'LOL_TEMPLATE_VARIABLES');

  // If extraction found a prompt, still strip any stray LOL tags that may
  // have leaked inside. If nothing was extracted, clean the whole raw output.
  let finalPrompt = prompt || stripAllLolTags(raw).trim();
  finalPrompt = stripAllLolTags(finalPrompt).trim();

  let finalCritique = critique || 'No critique was provided.';
  finalCritique = stripAllLolTags(finalCritique).trim();

  let finalVariables = variables || '';
  finalVariables = stripAllLolTags(finalVariables).trim();

  return {
    prompt: finalPrompt,
    critique: finalCritique,
    variables: finalVariables
  };
}

async function optimizePrompt() {
  const input = document.getElementById('optimizerInput').value.trim();
  const level = parseInt(document.getElementById('optimizerLevel').value, 10);
  console.log(`input: ${input}, level: ${level}`);

  const status = 'optimizerStatus';
  const resultDiv = document.getElementById('optimizerResult');
  const btn = document.getElementById('optimizeBtn');

  if (!input) {
    setStatus(status, 'Please enter a prompt to optimize.');
    return;
  }

  setBtnLoading(btn, true);
  resultDiv.textContent = '';
  document.getElementById('optimizerResultArea').classList.remove('visible');
  document.getElementById('critiqueSection').classList.remove('visible');
  document.getElementById('variablesSection').classList.remove('visible');
  setStatus(status, 'Checking API...');

  try {
    if (typeof LanguageModel === 'undefined') {
      throw new Error('Chrome built-in AI is not available. Please enable the required flags in chrome://flags.');
    }

    setStatus(status, 'Checking model availability...');
    const availability = await LanguageModel.availability();

    if (availability === 'unavailable') {
      throw new Error('Built-in model unavailable. Please check chrome://flags for Prompt API.');
    }

    setStatus(status, 'Creating session...');
    const session = await LanguageModel.create({
      expectedOutputLanguages: ['en'],
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          setStatus(status, `Downloading model... ${Math.round(e.loaded / e.total * 100)}%`);
        });
      }
    });

    const systemPrompt = OPTIMIZER_PROMPTS[level] || OPTIMIZER_PROMPTS[1];
    setStatus(status, 'Optimizing prompt...');
    const raw = await session.prompt(`${systemPrompt}\n\nPROMPT TO OPTIMIZE: ${input}`);
    console.log(`raw prompt: ${raw}`);
    const parsed = parseOptimizerResponse(raw);

    // Display improved prompt
    resultDiv.textContent = parsed.prompt;
    showResult('optimizerResultArea');

    // Display critique (levels 1+ request it)
    if (level >= 1) {
      document.getElementById('critiqueResult').textContent = parsed.critique;
    }

    // Display variables (levels 2+ request them)
    const variablesBody = document.getElementById('variablesResult');
    variablesBody.innerHTML = '';
    if (level >= 2 && parsed.variables) {
      const lines = parsed.variables.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        lines.forEach(line => {
          const tag = document.createElement('span');
          tag.className = 'var-tag';
          tag.textContent = line;
          variablesBody.appendChild(tag);
        });
        document.getElementById('variablesSection').classList.add('visible');
      }
    }

    // Hide the critique toggle button for Simple level (no critique requested)
    document.getElementById('critiqueToggleBtn').style.display = level >= 1 ? '' : 'none';

    setStatus(status, 'Done!');
    await autoCopyResult(parsed.prompt);
    session.destroy();
  } catch (e) {
    setStatus(status, 'Error occurred.');
    resultDiv.textContent = e.message;
    showResult('optimizerResultArea');
    console.error('Optimizer error:', e);
  } finally {
    setBtnLoading(btn, false);
  }
}

// ── TL;DR: Ask about page ──
async function askAboutPage() {
  const question = document.getElementById('qaInput').value.trim();
  const status = 'qaStatus';
  const resultDiv = document.getElementById('qaResult');
  const btn = document.getElementById('qaBtn');

  if (!question) {
    setStatus(status, 'Please enter a question.');
    return;
  }

  setBtnLoading(btn, true);

  if (!pageContent) {
    try {
      setStatus(status, 'Reading page content...');
      pageContent = await getPageContent();
    } catch (e) {
      setStatus(status, 'Could not read page.');
      resultDiv.textContent = e.message;
      showResult('qaResultArea');
      setBtnLoading(btn, false);
      return;
    }
  }
  resultDiv.textContent = '';
  document.getElementById('qaResultArea').classList.remove('visible');
  setStatus(status, 'Thinking...');

  try {
    if (typeof LanguageModel === 'undefined') {
      throw new Error('Chrome built-in AI is not available. Please enable the required flags in chrome://flags.');
    }

    const availability = await LanguageModel.availability();

    if (availability === 'unavailable') {
      throw new Error('Built-in model unavailable. Please check chrome://flags for Prompt API.');
    }

    const session = await LanguageModel.create({
      expectedOutputLanguages: ['en'],
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          setStatus(status, `Downloading model... ${Math.round(e.loaded / e.total * 100)}%`);
        });
      }
    });

    const prompt = `Based on the following web page content, answer the user's question concisely.\n\nPage content:\n${pageContent}\n\nQuestion: ${question}`;
    const answer = await session.prompt(prompt);
    resultDiv.textContent = answer;
    showResult('qaResultArea');
    setStatus(status, 'Done!');
    await autoCopyResult(answer);
    session.destroy();
  } catch (e) {
    setStatus(status, 'Error occurred.');
    resultDiv.textContent = e.message;
    showResult('qaResultArea');
    console.error('Q&A error:', e);
  } finally {
    setBtnLoading(btn, false);
  }
}
