/* =========================================================
   dukr3g reader.js  —  with numeric type-in synced to sliders
   ========================================================= */
(function(){
  'use strict';

  const html   = document.documentElement;

  // Elements
  const openBtn = document.getElementById('dukr3g-open');
  const dlg     = document.getElementById('dukr3g-dialog');
  const title   = document.getElementById('dukr3g-dialog-title');
  const btnBack = document.getElementById('dukr3g-btn-back');
  const btnClose= document.getElementById('dukr3g-btn-close');   // NEW
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

  // TTS controls
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

  // Live announcer
  function say(msg){
    if (!status) return;
    status.textContent = msg;
    clearTimeout(say._t);
    say._t = setTimeout(() => { status.textContent = ''; }, 1100);
  }

  // Clamp helper
  function clampToRange(inputEl, v){
    const min = parseFloat(inputEl.min);
    const max = parseFloat(inputEl.max);
    if (Number.isFinite(min)) v = Math.max(v, min);
    if (Number.isFinite(max)) v = Math.min(v, max);
    return v;
  }

  // Generic binder: keep a number input and range in sync, call an apply() fn
  function bindNumAndRange(numEl, rangeEl, applyFn){
    // Number -> Range
    function fromNum(){
      let v = parseFloat(numEl.value);
      if (Number.isNaN(v)) return; // ignore incomplete typing
      v = clampToRange(rangeEl, v);
      numEl.value = v.toFixed(rangeEl.step && parseFloat(rangeEl.step) < 1 ? 2 : 0);
      rangeEl.value = String(v);
      applyFn();
    }
    // Range -> Number
    function fromRange(){
      let v = parseFloat(rangeEl.value);
      v = clampToRange(rangeEl, v);
      numEl.value = v.toFixed(rangeEl.step && parseFloat(rangeEl.step) < 1 ? 2 : 0);
      applyFn();
    }
    numEl.addEventListener('change', fromNum);
    numEl.addEventListener('blur', fromNum);
    numEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); fromNum(); } });
    rangeEl.addEventListener('input', fromRange);
    rangeEl.addEventListener('change', fromRange);
    // Initialize number from range default
    fromRange();
  }

  // View switcher
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
      goDisplay.focus();
    } else if (name === 'display'){
      btnBack.hidden = false;
      title.textContent = 'Display';
      dlg.setAttribute('aria-labelledby', 'dukr3g-h-display');
      theme.focus();
    } else if (name === 'tts'){
      btnBack.hidden = false;
      title.textContent = 'Text to Speech';
      dlg.setAttribute('aria-labelledby', 'dukr3g-h-tts');
      tPlay.focus();
    }
  }

  // Open/close helpers
  function openDialog(){
    if (dlg.open) return;
    dlg.showModal();
    if (openBtn) openBtn.setAttribute('aria-expanded','true');
    html.setAttribute('data-dukr3g-open','1');
    showView('menu');
    dlg.addEventListener('close', () => {
      if (openBtn){ openBtn.setAttribute('aria-expanded','false'); openBtn.focus(); }
      html.removeAttribute('data-dukr3g-open');
    }, { once: true });
  }
  function closeDialog(){            // NEW
    if (!dlg.open) return;
    dlg.close();
    say('Closed');
  }

  // Bind opener and shortcuts
  if (openBtn) openBtn.addEventListener('click', openDialog);
  document.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'r' || e.key === 'R')) { e.preventDefault(); openDialog(); }
  });

  // Close button (X)
  if (btnClose) btnClose.addEventListener('click', closeDialog);  // NEW

  // Menu tile actions
  goDisplay.addEventListener('click', () => showView('display'));
  goTTS.addEventListener('click', () => showView('tts'));
  btnBack.addEventListener('click', () => showView('menu'));

  // Dialog internal shortcuts
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'Escape'){ e.preventDefault(); closeDialog(); }   // NEW: Esc closes
    if (e.key === 'd' || e.key === 'D') { e.preventDefault(); showView('display'); }
    if (e.key === 't' || e.key === 'T') { e.preventDefault(); showView('tts'); }
  });

  // DISPLAY: theme
  theme.addEventListener('change', () => {
    html.classList.forEach(c => { if (c.startsWith('dukr3g-theme-')) html.classList.remove(c); });
    html.classList.add(theme.value);
    say(`Theme ${theme.options[theme.selectedIndex].text}`);
  });

  // DISPLAY apply fns
  function applySize(){
    let v = parseFloat(size.value);
    v = clampToRange(size, v);
    html.style.setProperty('--dukr3g-scale', v.toFixed(2));
    sizeOut.value = v.toFixed(2);
    size.setAttribute('aria-valuetext', `×${v.toFixed(2)}`);
    say(`Font size ×${v.toFixed(2)}`);
  }
  function applyMeasure(){
    let v = parseInt(measure.value, 10);
    v = clampToRange(measure, v);
    html.style.setProperty('--dukr3g-measure', v);
    measureOut.value = String(v);
    measure.setAttribute('aria-valuetext', `${v} characters`);
    say(`Measure ${v} ch`);
  }
  function applyLeading(){
    let v = parseFloat(leading.value);
    v = clampToRange(leading, v);
    html.style.setProperty('--dukr3g-leading', v.toFixed(2));
    leadingOut.value = v.toFixed(2);
    leading.setAttribute('aria-valuetext', v.toFixed(2));
    say(`Line height ${v.toFixed(2)}`);
  }

  // Bind number↔range pairs
  bindNumAndRange(sizeNum,    size,    applySize);
  bindNumAndRange(measureNum, measure, applyMeasure);
  bindNumAndRange(leadingNum, leading, applyLeading);

  // Initialize outputs from CSS defaults
  applySize(); applyMeasure(); applyLeading();

  // ===== Basic TTS (with number inputs) =====
  const hasSpeech = 'speechSynthesis' in window;
  let utter = null;

  function initVoices(){
    if (!hasSpeech) return;
    const voices = window.speechSynthesis.getVoices();
    tVoice.innerHTML = '';
    for (let i = 0; i < voices.length; i++){
      const v = voices[i];
      const opt = document.createElement('option');
      opt.value = v.name;
      opt.textContent = v.name + ' (' + v.lang + ')' + (v.default ? ' — default' : '');
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
  }

  // TTS readouts and binding
  function applyTTSOutputs(){
    const rate  = clampToRange(tRate,  parseFloat(tRate.value));
    const pitch = clampToRange(tPitch, parseFloat(tPitch.value));
    tRateOut.value  = rate.toFixed(2) + 'x';
    tPitchOut.value = pitch.toFixed(2);
    tRate.setAttribute('aria-valuetext', rate.toFixed(2) + ' times');
    tPitch.setAttribute('aria-valuetext', pitch.toFixed(2));
  }

  bindNumAndRange(tRateNum,  tRate,  () => { applyTTSOutputs(); });
  bindNumAndRange(tPitchNum, tPitch, () => { applyTTSOutputs(); });
  applyTTSOutputs();

  tPlay.addEventListener('click', () => {
    if (!hasSpeech) { say('Speech not supported'); return; }
    const text = getArticleText();
    if (!text) { say('Nothing to read'); return; }

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

    const want = tVoice.value;
    const sel  = speechSynthesis.getVoices().find(x => x.name === want);
    if (sel) utter.voice = sel;

    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
    say('Reading started');
  });

  tPause.addEventListener('click', () => {
    if (!hasSpeech) return;
    if (speechSynthesis.speaking){
      speechSynthesis.pause();
      say('Paused');
    }
  });

  tStop.addEventListener('click', () => {
    if (!hasSpeech) return;
    speechSynthesis.cancel();
    say('Stopped');
  });

  // Guard for dialog support
  if (!(window.HTMLDialogElement && dlg && typeof dlg.showModal === 'function')){
    console.warn('dukr3g: <dialog> not fully supported in this browser.');
  }
})();
