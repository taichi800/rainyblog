/* =========================================================
   dukr3g reader.js  —  numeric type-in synced to sliders
   + custom theme with hex + color window, persisted
   ========================================================= */
(function(){
  'use strict';

  // ---------- DOM roots ----------
  const html   = document.documentElement;
  const KEY    = 'reader:settings';

  // ---------- Elements ----------
  const openBtn = document.getElementById('dukr3g-open');
  const dlg     = document.getElementById('dukr3g-dialog');
  const title   = document.getElementById('dukr3g-dialog-title');
  const btnBack = document.getElementById('dukr3g-btn-back');
  const btnClose= document.getElementById('dukr3g-btn-close');
  const status  = document.getElementById('dukr3g-status');

  // Views
  const V = {
    menu:    document.getElementById('dukr3g-view-menu'),
    display: document.getElementById('dukr3g-view-display'),
    tts:     document.getElementById('dukr3g-view-tts')
  };

  // Menu tiles
  const goDisplay = document.getElementById('dukr3g-go-display');
  const goTTS     = document.getElementById('dukr3g-go-tts');

  // Display controls
  const theme       = document.getElementById('dukr3g-theme');

  const sizeNum     = document.getElementById('dukr3g-size-num');
  const size        = document.getElementById('dukr3g-size');         // 0.30..3.00
  const sizeOut     = document.getElementById('dukr3g-size-out');

  const measureNum  = document.getElementById('dukr3g-measure-num');
  const measure     = document.getElementById('dukr3g-measure');      // 40..121
  const measureOut  = document.getElementById('dukr3g-measure-out');

  const leadingNum  = document.getElementById('dukr3g-leading-num');
  const leading     = document.getElementById('dukr3g-leading');      // 1.00..2.50
  const leadingOut  = document.getElementById('dukr3g-leading-out');

  // Custom color fieldset
  const customBox = document.getElementById('dukr3g-custom-colors');

  // Hex + color mappings: [hexId, colorId, cssVar]
  const FIELDS = [
    ['dukr3g-user-text-hex',    'dukr3g-user-text',    '--dukr3g-user-text'],
    ['dukr3g-user-bg-hex',      'dukr3g-user-bg',      '--dukr3g-user-bg'],
    ['dukr3g-user-link-hex',    'dukr3g-user-link',    '--dukr3g-user-link'],
    ['dukr3g-user-visited-hex', 'dukr3g-user-visited', '--dukr3g-user-visited'],
    ['dukr3g-ral-ink-hex',      'dukr3g-ral-ink',      '--dukr3g-ral-ink'],
    ['dukr3g-ral-bg-hex',       'dukr3g-ral-bg',       '--dukr3g-ral-bg']
  ];

  // ---------- Utilities ----------
  function say(msg){
    if (!status) return;
    status.textContent = msg;
    if (say._t) clearTimeout(say._t);
    say._t = setTimeout(function(){ status.textContent = ''; }, 1100);
  }

  function setVar(name, val){
    html.style.setProperty(name, val);
  }

  function clampToRange(inputEl, v){
    const min = parseFloat(inputEl.min);
    const max = parseFloat(inputEl.max);
    if (Number.isFinite(min)) v = Math.max(v, min);
    if (Number.isFinite(max)) v = Math.min(v, max);
    return v;
  }

  function bindNumAndRange(numEl, rangeEl, applyFn){
    if (!numEl || !rangeEl) return;

    function decimals(step){
      const s = String(step || '');
      const i = s.indexOf('.');
      return i < 0 ? 0 : (s.length - i - 1);
    }

    function fromNum(){
      let v = parseFloat(numEl.value);
      if (Number.isNaN(v)) return;
      v = clampToRange(rangeEl, v);
      numEl.value  = v.toFixed(decimals(rangeEl.step));
      rangeEl.value= String(v);
      applyFn();
    }
    function fromRange(){
      let v = parseFloat(rangeEl.value);
      v = clampToRange(rangeEl, v);
      numEl.value = v.toFixed(decimals(rangeEl.step));
      applyFn();
    }

    numEl.addEventListener('change', fromNum);
    numEl.addEventListener('blur', fromNum);
    numEl.addEventListener('keydown', function(e){
      if (e.key === 'Enter'){ e.preventDefault(); fromNum(); }
    });
    rangeEl.addEventListener('input', fromRange);
    rangeEl.addEventListener('change', fromRange);

    // Initialize number from range default
    fromRange();
  }

  function removeThemeClasses(){
    const toDrop = Array.from(html.classList).filter(c => c.startsWith('dukr3g-theme-'));
    toDrop.forEach(c => html.classList.remove(c));
  }

  function applyThemeClass(name){
    removeThemeClasses();
    if (name) html.classList.add(name);
  }

  function toggleCustomBox(){
    if (!customBox || !theme) return;
    customBox.hidden = theme.value !== 'dukr3g-theme-custom';
  }

  function normalizeHex(s){
    if (!s) return null;
    s = s.trim();
    if (s[0] !== '#') s = '#'+s;
    const m3 = /^#([0-9a-fA-F]{3})$/.exec(s);
    if (m3){
      const t = m3[1];
      s = '#' + t[0]+t[0] + t[1]+t[1] + t[2]+t[2];
    }
    return /^#([0-9a-fA-F]{6})$/.test(s) ? s.toUpperCase() : null;
  }

  function syncOutputFor(id, val){
    const out = document.querySelector('output[for="'+id+'"]');
    if (out) out.textContent = val;
  }

  function setColor(hexId, colorId, cssVar, hex){
    const hexEl = document.getElementById(hexId);
    const colEl = document.getElementById(colorId);
    if (!hex) return;

    if (hexEl) hexEl.value = hex;
    if (colEl) colEl.value = hex;

    setVar(cssVar, hex);
    // Output mirrors the hex field id
    syncOutputFor(hexId, hex);
  }

  function persist(){
    try{
      const state = JSON.parse(localStorage.getItem(KEY) || '{}');
      state.theme = theme ? theme.value : state.theme;
      state.colors = state.colors || {};
      for (const [hexId, , cssVar] of FIELDS){
        const el = document.getElementById(hexId);
        if (el) state.colors[cssVar] = el.value;
      }
      localStorage.setItem(KEY, JSON.stringify(state));
    }catch(e){}
  }

  function restore(){
    try{
      const saved = JSON.parse(localStorage.getItem(KEY) || '{}');

      // Theme
      const savedTheme = saved.theme || (Array.from(html.classList).find(c => c.startsWith('dukr3g-theme-'))) || 'dukr3g-theme-light';
      applyThemeClass(savedTheme);
      if (theme) theme.value = savedTheme;

      // Colors
      if (saved.colors){
        for (const [hexId, colorId, cssVar] of FIELDS){
          const hex = normalizeHex(saved.colors[cssVar]);
          const fallback = document.getElementById(colorId)?.value || '#000000';
          setColor(hexId, colorId, cssVar, hex || fallback);
        }
      } else {
        // Initial paint from existing input defaults
        for (const [hexId, colorId, cssVar] of FIELDS){
          const def = document.getElementById(colorId)?.value || '#000000';
          setColor(hexId, colorId, cssVar, def);
        }
      }

      toggleCustomBox();
    }catch(e){}
  }

  // ---------- View switcher ----------
  function showView(name){
    for (const key of Object.keys(V)){
      const on = key === name;
      V[key].classList.toggle('dukr3g-current', on);
      V[key].hidden = !on;
    }
    if (name === 'menu'){
      btnBack.hidden = true;
      title.textContent = 'Reader Tools';
      dlg.setAttribute('aria-labelledby', 'dukr3g-h-menu');
      if (goDisplay) goDisplay.focus();
    } else if (name === 'display'){
      btnBack.hidden = false;
      title.textContent = 'Display';
      dlg.setAttribute('aria-labelledby', 'dukr3g-h-display');
      if (theme) theme.focus();
    } else if (name === 'tts'){
      btnBack.hidden = false;
      title.textContent = 'Text to Speech';
      dlg.setAttribute('aria-labelledby', 'dukr3g-h-tts');
      if (tPlay) tPlay.focus();
    }
  }

  // ---------- Open/close ----------
  function openDialog(){
    if (!dlg || dlg.open) return;
    dlg.showModal();
    if (openBtn) openBtn.setAttribute('aria-expanded','true');
    html.setAttribute('data-dukr3g-open','1');
    showView('menu');
    dlg.addEventListener('close', function(){
      if (openBtn){ openBtn.setAttribute('aria-expanded','false'); openBtn.focus(); }
      html.removeAttribute('data-dukr3g-open');
    }, { once: true });
  }
  function closeDialog(){
    if (!dlg || !dlg.open) return;
    dlg.close();
    say('Closed');
  }

  // ---------- Bind opener and shortcuts ----------
  if (openBtn) openBtn.addEventListener('click', openDialog);
  document.addEventListener('keydown', function(e){
    if (e.altKey && (e.key === 'r' || e.key === 'R')){ e.preventDefault(); openDialog(); }
  });

  if (btnClose) btnClose.addEventListener('click', closeDialog);

  // Menu tile actions
  if (goDisplay) goDisplay.addEventListener('click', function(){ showView('display'); });
  if (goTTS)     goTTS.addEventListener('click',     function(){ showView('tts'); });
  if (btnBack)   btnBack.addEventListener('click',   function(){ showView('menu'); });

  // Dialog internal shortcuts
  if (dlg){
    dlg.addEventListener('keydown', function(e){
      if (e.key === 'Escape'){ e.preventDefault(); closeDialog(); }
      if (e.key === 'd' || e.key === 'D'){ e.preventDefault(); showView('display'); }
      if (e.key === 't' || e.key === 'T'){ e.preventDefault(); showView('tts'); }
    });
  }

  // ---------- DISPLAY: theme ----------
  if (theme){
    theme.addEventListener('change', function(){
      applyThemeClass(theme.value);
      toggleCustomBox();
      persist();
      const label = theme.options[theme.selectedIndex].text;
      say('Theme ' + label);
    });
  }

  // ---------- DISPLAY apply fns ----------
  function applySize(){
    if (!size || !sizeOut) return;
    let v = parseFloat(size.value);
    v = clampToRange(size, v);
    setVar('--dukr3g-scale', v.toFixed(2));
    sizeOut.value = v.toFixed(2);
    size.setAttribute('aria-valuetext', '×' + v.toFixed(2));
    say('Font size ×' + v.toFixed(2));
  }
  function applyMeasure(){
    if (!measure || !measureOut) return;
    let v = parseInt(measure.value, 10);
    v = clampToRange(measure, v);
    setVar('--dukr3g-measure', v);
    measureOut.value = String(v);
    measure.setAttribute('aria-valuetext', v + ' characters');
    say('Measure ' + v + ' ch');
  }
  function applyLeading(){
    if (!leading || !leadingOut) return;
    let v = parseFloat(leading.value);
    v = clampToRange(leading, v);
    setVar('--dukr3g-leading', v.toFixed(2));
    leadingOut.value = v.toFixed(2);
    leading.setAttribute('aria-valuetext', v.toFixed(2));
    say('Line height ' + v.toFixed(2));
  }

  // Bind number↔range pairs
  bindNumAndRange(sizeNum,    size,    applySize);
  bindNumAndRange(measureNum, measure, applyMeasure);
  bindNumAndRange(leadingNum, leading, applyLeading);

  // Initialize outputs from CSS defaults
  applySize(); applyMeasure(); applyLeading();

  // ---------- Custom theme wiring ----------
  // Reveal controls only for Custom; keep hex and color inputs in sync; persist.
function bindCustomColor(hexId, colorId, cssVar){
  const hexEl = document.getElementById(hexId);
  const colEl = document.getElementById(colorId);
  if (!hexEl && !colEl) return;

  function apply(hex){
    const v = normalizeHex(hex);
    if (!v) return;

    // If user starts editing custom colors while not on Custom, switch.
    if (theme && theme.value !== 'dukr3g-theme-custom'){
      theme.value = 'dukr3g-theme-custom';
      applyThemeClass('dukr3g-theme-custom');
      toggleCustomBox();
    }

    setColor(hexId, colorId, cssVar, v);
    persist();
  }

  if (hexEl){
    hexEl.addEventListener('change', function(){ apply(hexEl.value); });
    hexEl.addEventListener('input',  function(){ const v = normalizeHex(hexEl.value); if (v) apply(v); });
  }
  if (colEl){
    colEl.addEventListener('input', function(){ apply(colEl.value); });
  }
}


  FIELDS.forEach(function(row){ bindCustomColor(row[0], row[1], row[2]); });

  // ---------- TTS ----------
  const tPlay      = document.getElementById('dukr3g-tts-play');
  const tPause     = document.getElementById('dukr3g-tts-pause');
  const tStop      = document.getElementById('dukr3g-tts-stop');

  const tRateNum   = document.getElementById('dukr3g-tts-rate-num');
  const tRate      = document.getElementById('dukr3g-tts-rate');       // 0.10..10.00
  const tRateOut   = document.getElementById('dukr3g-tts-rate-out');

  const tPitchNum  = document.getElementById('dukr3g-tts-pitch-num');
  const tPitch     = document.getElementById('dukr3g-tts-pitch');      // 0.10..5.00
  const tPitchOut  = document.getElementById('dukr3g-tts-pitch-out');

  const tVoice     = document.getElementById('dukr3g-tts-voice');

  const hasSpeech = 'speechSynthesis' in window;
  let utter = null;

  function initVoices(){
    if (!hasSpeech || !tVoice) return;
    const voices = window.speechSynthesis.getVoices();
    tVoice.innerHTML = '';
    for (let i = 0; i < voices.length; i++){
      const v = voices[i];
      const opt = document.createElement('option');
      opt.value = v.name;
      opt.textContent = v.name + ' (' + v.lang + ')' + (v.default ? ' default' : '');
      tVoice.appendChild(opt);
      if (v.default) tVoice.selectedIndex = i;
    }
  }
  if (hasSpeech){
    initVoices();
    window.speechSynthesis.onvoiceschanged = initVoices;
  }

  function getArticleText(){
    const art = document.querySelector('main article');
    return art ? art.innerText.trim() : '';
    // If you later need sentence- or node-level highlighting, hook here.
  }

  function applyTTSOutputs(){
    if (!tRate || !tRateOut || !tPitch || !tPitchOut) return;
    const rate  = clampToRange(tRate,  parseFloat(tRate.value));
    const pitch = clampToRange(tPitch, parseFloat(tPitch.value));
    tRateOut.value  = rate.toFixed(2) + 'x';
    tPitchOut.value = pitch.toFixed(2);
    tRate.setAttribute('aria-valuetext', rate.toFixed(2) + ' times');
    tPitch.setAttribute('aria-valuetext', pitch.toFixed(2));
  }

  bindNumAndRange(tRateNum,  tRate,  applyTTSOutputs);
  bindNumAndRange(tPitchNum, tPitch, applyTTSOutputs);
  applyTTSOutputs();

if (tPlay) tPlay.addEventListener('click', function(){
  if (!hasSpeech){ say('Speech not supported'); return; }

  // Prepare DOM once so we can track words
  prepareReadable();
  const text = rl.plain || getArticleText();
  if (!text){ say('Nothing to read'); return; }

  // If already speaking, resume
  if (utter && speechSynthesis.speaking){
    speechSynthesis.resume();
    say('Resumed');
    return;
  }

  const rate  = clampToRange(tRate,  parseFloat(tRate.value));
  const pitch = clampToRange(tPitch, parseFloat(tPitch.value));

  utter = new SpeechSynthesisUtterance(text);
  utter.rate  = rate;
  utter.pitch = pitch;

  const want = tVoice && tVoice.value;
  const sel  = speechSynthesis.getVoices().find(x => x.name === want);
  if (sel) utter.voice = sel;

  // Word-level boundary events
  utter.onboundary = function(e){
    if (!rl.prepared) return;
    if (e.name === 'word' || e.charIndex >= 0){
      const idx = findWordByCharIndex(e.charIndex);
      if (idx !== -1) highlightWord(idx);
    }
  };
  utter.onend = function(){
    clearHighlight();
  };
  utter.onerror = function(){
    clearHighlight();
  };

  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
  say('Reading started');
});


  if (tPause) tPause.addEventListener('click', function(){
    if (!hasSpeech) return;
    if (speechSynthesis.speaking){
      speechSynthesis.pause();
      say('Paused');
    }
  });

if (tStop) tStop.addEventListener('click', function(){
  if (!hasSpeech) return;
  speechSynthesis.cancel();
  clearHighlight();
  say('Stopped');
});

  // ===== Read-aloud word tracker =====
let rl = {
  prepared: false,
  words: [],        // [{node: <span.dukr3g-w>, start: n, end: n}, ...]
  plain: '',        // concatenated text used for utterance
  lastIdx: -1
};

/* Walk article, wrap words with spans, and build a linear index that
   matches the utterance text we will feed to speechSynthesis. */
function prepareReadable(){
  const art = document.querySelector('main article');
  if (!art || rl.prepared) return;

  rl.words = [];
  rl.plain = '';

  const walker = document.createTreeWalker(art, NodeFilter.SHOW_TEXT, {
    acceptNode(node){
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const wordRe = /([^\s]+)|(\s+)/g; // capture words and whitespace
  let n;
  while ((n = walker.nextNode())){
    const text = n.nodeValue;
    const frag = document.createDocumentFragment();
    let m;

    while ((m = wordRe.exec(text))){
      const token = m[0];
      const isSpace = /^\s+$/.test(token);

      if (isSpace){
        frag.appendChild(document.createTextNode(token));
        rl.plain += token;
      }else{
        const span = document.createElement('span');
        span.className = 'dukr3g-w';
        span.textContent = token;
        // Record range positions in the concatenated plain string
        const start = rl.plain.length;
        const end   = start + token.length;
        rl.words.push({ node: span, start, end });
        rl.plain += token;
        frag.appendChild(span);
      }
    }
    n.parentNode.replaceChild(frag, n);
  }

  rl.prepared = true;
}

/* Binary search over rl.words to find index by utterance charIndex */
function findWordByCharIndex(charIndex){
  let lo = 0, hi = rl.words.length - 1, ans = -1;
  while (lo <= hi){
    const mid = (lo + hi) >> 1;
    const w = rl.words[mid];
    if (charIndex < w.start) hi = mid - 1;
    else if (charIndex >= w.end) lo = mid + 1;
    else { ans = mid; break; }
  }
  return ans;
}

function clearHighlight(){
  if (rl.lastIdx >= 0){
    const w = rl.words[rl.lastIdx];
    if (w && w.node){
      w.node.classList.remove('dukr3g-ral-ink', 'dukr3g-ral-bg');
    }
    rl.lastIdx = -1;
  }
}

function highlightWord(i){
  if (i < 0 || i >= rl.words.length) return;
  if (i === rl.lastIdx) return;
  clearHighlight();
  const w = rl.words[i];
  w.node.classList.add('dukr3g-ral-ink', 'dukr3g-ral-bg');

  // Keep the current word comfortably in view
  const rect = w.node.getBoundingClientRect();
  const pad = 64; // px visual margin
  const needScroll = rect.top < pad || rect.bottom > (window.innerHeight - pad);
  if (needScroll) w.node.scrollIntoView({ block: 'center', inline: 'nearest' });

  rl.lastIdx = i;
}


  // ---------- Startup ----------
  // Guard for dialog support
  if (!(window.HTMLDialogElement && dlg && typeof dlg.showModal === 'function')){
    console.warn('dukr3g: <dialog> not fully supported in this browser.');
  }

  // Restore theme and custom colors, then ensure controls reflect state
  restore();
})();
