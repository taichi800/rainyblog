(function(){
  const html = document.documentElement;

  // Elements
  const openBtn = document.getElementById('reader-open');
  const dlg     = document.getElementById('reader-dialog');
  const title   = document.getElementById('dialog-title');
  const btnBack = document.getElementById('btn-back');
  const status  = document.getElementById('status');

  // Views
  const V = {
    menu: document.getElementById('view-menu'),
    display: document.getElementById('view-display'),
    tts: document.getElementById('view-tts')
  };

  // Menu tiles
  const goDisplay = document.getElementById('go-display');
  const goTTS     = document.getElementById('go-tts');

  // Display controls
  const theme       = document.getElementById('theme-select');
  const size        = document.getElementById('size-range');
  const sizeOut     = document.getElementById('size-out');
  const measure     = document.getElementById('measure-range');
  const measureOut  = document.getElementById('measure-out');
  const leading     = document.getElementById('leading-range');
  const leadingOut  = document.getElementById('leading-out');

  // TTS controls
  const tPlay  = document.getElementById('tts-play');
  const tPause = document.getElementById('tts-pause');
  const tStop  = document.getElementById('tts-stop');
  const tRate  = document.getElementById('tts-rate-range');
  const tRateOut = document.getElementById('tts-rate-out');
  const tPitch = document.getElementById('tts-pitch-range');
  const tPitchOut = document.getElementById('tts-pitch-out');
  const tVoice = document.getElementById('tts-voice-select');

  // Live announcer
  function say(msg){
    if (!status) return;
    status.textContent = msg;
    clearTimeout(say._t);
    say._t = setTimeout(() => { status.textContent = ''; }, 1100);
  }

  // View switcher
  function showView(name){
    Object.keys(V).forEach(k => {
      const on = k === name;
      V[k].classList.toggle('current', on);
      V[k].hidden = !on;
    });
    if (name === 'menu'){
      btnBack.hidden = true;
      title.textContent = 'Reader Tools';
      dlg.setAttribute('aria-labelledby', 'h-menu');
      goDisplay.focus();
    } else if (name === 'display'){
      btnBack.hidden = false;
      title.textContent = 'Display';
      dlg.setAttribute('aria-labelledby', 'h-display');
      theme.focus();
    } else if (name === 'tts'){
      btnBack.hidden = false;
      title.textContent = 'Text to Speech';
      dlg.setAttribute('aria-labelledby', 'h-tts');
      tPlay.focus();
    }
  }

  // Open dialog to Menu
  function openDialog(){
    if (dlg.open) return;
    dlg.showModal();
    openBtn.setAttribute('aria-expanded','true');
    showView('menu');
    dlg.addEventListener('close', () => {
      openBtn.setAttribute('aria-expanded','false');
      openBtn.focus();
    }, { once: true });
  }

  // Bind opener and shortcuts
  openBtn.addEventListener('click', openDialog);
  document.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'r' || e.key === 'R')) { e.preventDefault(); openDialog(); }
  });

  // Menu tile actions
  goDisplay.addEventListener('click', () => showView('display'));
  goTTS.addEventListener('click', () => showView('tts'));
  btnBack.addEventListener('click', () => showView('menu'));

  // Keyboard shortcuts inside dialog
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') { e.preventDefault(); showView('display'); }
    if (e.key === 't' || e.key === 'T') { e.preventDefault(); showView('tts'); }
  });

  // DISPLAY: theme
  theme.addEventListener('change', () => {
    html.classList.forEach(c => { if (c.startsWith('theme-')) html.classList.remove(c); });
    html.classList.add(theme.value);
    say(`Theme ${theme.options[theme.selectedIndex].text}`);
  });

  // DISPLAY: size
  function applySize(){
    const v = parseFloat(size.value);
    html.style.setProperty('--scale', v.toFixed(2));
    sizeOut.value = v.toFixed(2);
    say(`Font size ×${v.toFixed(2)}`);
  }
  size.addEventListener('input', applySize);
  size.addEventListener('change', applySize);

  // DISPLAY: measure
  function applyMeasure(){
    const v = parseInt(measure.value, 10);
    html.style.setProperty('--measure', v);
    measureOut.value = String(v);
    say(`Measure ${v} ch`);
  }
  measure.addEventListener('input', applyMeasure);
  measure.addEventListener('change', applyMeasure);

  // DISPLAY: leading
  function applyLeading(){
    const v = parseFloat(leading.value);
    html.style.setProperty('--leading', v.toFixed(2));
    leadingOut.value = v.toFixed(2);
    say(`Line height ${v.toFixed(2)}`);
  }
  leading.addEventListener('input', applyLeading);
  leading.addEventListener('change', applyLeading);

  // Initialize outputs
  applySize(); applyMeasure(); applyLeading();

  // Basic TTS using Web Speech API if available
  const hasSpeech = 'speechSynthesis' in window;
  let utter = null;

  function initVoices(){
    if (!hasSpeech) return;
    const voices = window.speechSynthesis.getVoices();
    tVoice.innerHTML = '';
    voices.forEach((v, i) => {
      const opt = document.createElement('option');
      opt.value = v.name; opt.textContent = `${v.name} (${v.lang})`;
      if (v.default) opt.textContent += ' — default';
      tVoice.appendChild(opt);
      if (v.default) tVoice.selectedIndex = i;
    });
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
    tRateOut.value = parseFloat(tRate.value).toFixed(2) + 'x';
    tPitchOut.value = parseFloat(tPitch.value).toFixed(2);
  }
  tRate.addEventListener('input', applyTTSOutputs);
  tPitch.addEventListener('input', applyTTSOutputs);
  applyTTSOutputs();

  tPlay.addEventListener('click', () => {
    if (!hasSpeech) { say('Speech not supported'); return; }
    const text = getArticleText();
    if (!text) { say('Nothing to read'); return; }
    if (utter && speechSynthesis.speaking){ speechSynthesis.resume(); return; }
    utter = new SpeechSynthesisUtterance(text);
    utter.rate  = parseFloat(tRate.value);
    utter.pitch = parseFloat(tPitch.value);
    const want = tVoice.value;
    const v = speechSynthesis.getVoices().find(x => x.name === want);
    if (v) utter.voice = v;
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
    say('Reading started');
  });

  tPause.addEventListener('click', () => {
    if (!hasSpeech) return;
    if (speechSynthesis.speaking){ speechSynthesis.pause(); say('Paused'); }
  });

  tStop.addEventListener('click', () => {
    if (!hasSpeech) return;
    speechSynthesis.cancel(); say('Stopped');
  });
})();
