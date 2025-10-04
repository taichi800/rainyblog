/* =========================================================
   dukr3g reader.js  —  consolidated, namespaced, accessible
   ========================================================= */
(function(){
  'use strict';

  const html   = document.documentElement;

  // Elements
  const openBtn = document.getElementById('dukr3g-open');
  const dlg     = document.getElementById('dukr3g-dialog');
  const title   = document.getElementById('dukr3g-dialog-title');
  const btnBack = document.getElementById('dukr3g-btn-back');
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
  const size        = document.getElementById('dukr3g-size');
  const sizeOut     = document.getElementById('dukr3g-size-out');
  const measure     = document.getElementById('dukr3g-measure');
  const measureOut  = document.getElementById('dukr3g-measure-out');
  const leading     = document.getElementById('dukr3g-leading');
  const leadingOut  = document.getElementById('dukr3g-leading-out');

  // TTS controls
  const tPlay     = document.getElementById('dukr3g-tts-play');
  const tPause    = document.getElementById('dukr3g-tts-pause');
  const tStop     = document.getElementById('dukr3g-tts-stop');
  const tRate     = document.getElementById('dukr3g-tts-rate');
  const tRateOut  = document.getElementById('dukr3g-tts-rate-out');
  const tPitch    = document.getElementById('dukr3g-tts-pitch');
  const tPitchOut = document.getElementById('dukr3g-tts-pitch-out');
  const tVoice    = document.getElementById('dukr3g-tts-voice');

  // Utility: live announcer
  function say(msg){
    if (!status) return;
    status.textContent = msg;
    clearTimeout(say._t);
    say._t = setTimeout(() => { status.textContent = ''; }, 1100);
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

  // Open dialog to Menu, set open flag on <html>
  function openDialog(){
    if (dlg.open) return;
    dlg.showModal();
    openBtn.setAttribute('aria-expanded','true');
    html.setAttribute('data-dukr3g-open','1');
    showView('menu');
    dlg.addEventListener('close', () => {
      openBtn.setAttribute('aria-expanded','false');
      html.removeAttribute('data-dukr3g-open');
      openBtn.focus();
    }, { once: true });
  }

  // Bind opener and global shortcut
  openBtn.addEventListener('click', openDialog);
  document.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'r' || e.key === 'R')) {
      e.preventDefault();
      openDialog();
    }
  });

  // Menu tile actions
  goDisplay.addEventListener('click', () => showView('display'));
  goTTS.addEventListener('click', () => showView('tts'));
  btnBack.addEventListener('click', () => showView('menu'));

  // Dialog internal shortcuts
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') { e.preventDefault(); showView('display'); }
    if (e.key === 't' || e.key === 'T') { e.preventDefault(); showView('tts'); }
  });

  // DISPLAY: theme
  theme.addEventListener('change', () => {
    html.classList.forEach(c => { if (c.startsWith('dukr3g-theme-')) html.classList.remove(c); });
    html.classList.add(theme.value);
    say(`Theme ${theme.options[theme.selectedIndex].text}`);
  });

  // DISPLAY: size
  function applySize(){
    const v = parseFloat(size.value);
    html.style.setProperty('--dukr3g-scale', v.toFixed(2));
    sizeOut.value = v.toFixed(2);
    say(`Font size ×${v.toFixed(2)}`);
  }
  size.addEventListener('input', applySize);
  size.addEventListener('change', applySize);

  // DISPLAY: measure
  function applyMeasure(){
    const v = parseInt(measure.value, 10);
    html.style.setProperty('--dukr3g-measure', v);
    measureOut.value = String(v);
    say(`Measure ${v} ch`);
  }
  measure.addEventListener('input', applyMeasure);
  measure.addEventListener('change', applyMeasure);

  // DISPLAY: leading
  function applyLeading(){
    const v = parseFloat(leading.value);
    html.style.setProperty('--dukr3g-leading', v.toFixed(2));
    leadingOut.value = v.toFixed(2);
    say(`Line height ${v.toFixed(2)}`);
  }
  leading.addEventListener('input', applyLeading);
  leading.addEventListener('change', applyLeading);

  // Initialize outputs from CSS defaults
  applySize(); applyMeasure(); applyLeading();

  // ===== Basic TTS (namespaced) =====
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

  function applyTTSOutputs(){
    tRateOut.value  = parseFloat(tRate.value).toFixed(2) + 'x';
    tPitchOut.value = parseFloat(tPitch.value).toFixed(2);
  }
  tRate.addEventListener('input', applyTTSOutputs);
  tPitch.addEventListener('input', applyTTSOutputs);
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
    utter = new SpeechSynthesisUtterance(text);
    utter.rate  = parseFloat(tRate.value);
    utter.pitch = parseFloat(tPitch.value);
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

  // Optional: light guard for dialog support
  if (!(window.HTMLDialogElement && dlg && typeof dlg.showModal === 'function')){
    console.warn('dukr3g: <dialog> not fully supported in this browser.');
  }
})();
