/* reader.js */
(function () {
  'use strict';

  // ---------- DOM and helpers ----------
  var html = document.documentElement;
  var body = document.body;
  var KEY  = 'reader:settings';

  function $(id){ return document.getElementById(id); }
  function on(el, type, handler){ if (el) el.addEventListener(type, handler, false); }
  function setVar(k, v){ html.style.setProperty(k, v); }
  function getVar(n, fallback){
    try {
      var v = getComputedStyle(html).getPropertyValue(n);
      v = v ? v.trim() : '';
      return v || fallback;
    } catch(e){ return fallback; }
  }
  function clamp(x, lo, hi){
    x = +x;
    if (isNaN(x)) return lo;
    return Math.max(lo, Math.min(hi, x));
  }

  var prefersReducedMotion = false;
  try {
    prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch(e){}

  // ---------- State ----------
  var qq = null;
  var defaults, state;

  // ---------- Status and announcements ----------
  // Visual status + aria-live region
  function say(msg){
    if (qq && qq.status) {
      qq.status.textContent = msg;
      clearTimeout(say._t);
      say._t = setTimeout(function(){ qq.status.textContent = ''; }, 2000);
    }
    if (qq && qq.ariaLive){
      qq.ariaLive.textContent = '';
      setTimeout(function(){ qq.ariaLive.textContent = msg; }, 10);
    }
  }
  // Deduplicate brief announcements
  var _sayLast = { msg: '', ts: 0 };
  function sayOnce(msg, windowMs){
    var now = Date.now();
    var win = windowMs || 800;
    if (_sayLast.msg === msg && (now - _sayLast.ts) < win) return;
    _sayLast.msg = msg;
    _sayLast.ts = now;
    say(msg);
  }

  // ---------- TTS subsystem ----------
  var tts = {
    synth: window.speechSynthesis || null,
    voices: [],
    utterance: null,
    chunks: [],
    index: 0,
    contentSelector: 'main h1, main h2, main h3, main p, main li, main blockquote',
    highlightClass: 'tts-current',

    init: function(){
      if (!tts.synth) return;
      function updateVoices(){
        tts.voices = tts.synth.getVoices() || [];
        tts.populateVoiceList();
      }
      updateVoices();
      if (typeof tts.synth.onvoiceschanged !== 'undefined'){
        tts.synth.onvoiceschanged = updateVoices;
      }
    },

    populateVoiceList: function(){
      if (!qq || !qq.voiceSelect) return;
      var sel = qq.voiceSelect;
      sel.innerHTML = '';
      tts.voices.forEach(function(voice){
        var opt = document.createElement('option');
        opt.textContent = voice.name + ' (' + voice.lang + ')';
        opt.value = voice.name;
        if (state.ttsVoice && state.ttsVoice === voice.name) opt.selected = true;
        sel.appendChild(opt);
      });
    },

    prepare: function(){
      tts.clearHighlights();
      tts.chunks = [];
      tts.index = 0;
      var nodes = document.querySelectorAll(tts.contentSelector);
      nodes.forEach(function(el){
        var text = el.textContent.replace(/\s+/g, ' ').trim();
        if (text.length > 0) tts.chunks.push({ el: el, text: text });
      });
      say(tts.chunks.length ? ('Prepared ' + tts.chunks.length + ' blocks.') : 'No readable content found.');
    },

    highlight: function(){
      tts.clearHighlights();
      if (!tts.chunks.length) return;
      var cur = tts.chunks[tts.index];
      if (cur && cur.el){
        cur.el.classList.add(tts.highlightClass);
        try {
          cur.el.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'center'
          });
        } catch(e){}
      }
    },

    clearHighlights: function(){
      document.querySelectorAll('.' + tts.highlightClass).forEach(function(el){
        el.classList.remove(tts.highlightClass);
      });
    },

    currentVoice: function(){
      if (!qq || !qq.voiceSelect || !tts.voices.length) return null;
      var name = qq.voiceSelect.value || state.ttsVoice || '';
      var v = tts.voices.find(function(vo){ return vo.name === name; });
      return v || null;
    },

    speakCurrent: function(){
      if (!tts.synth || !tts.chunks.length) return;
      if (tts.synth.speaking) return;

      var item = tts.chunks[tts.index];
      if (!item) return;

      var u = new SpeechSynthesisUtterance(item.text);
      u.rate  = clamp(state.ttsRate, 0.5, 2.0);
      u.pitch = clamp(state.ttsPitch, 0.1, 2.0);
      if (state.ttsLang) u.lang = state.ttsLang;
      var voice = tts.currentVoice();
      if (voice) u.voice = voice;

      u.onstart = function(){
        tts.highlight();
        sayOnce('Playing.');
      };
      u.onend = function(){
        tts.index += 1;
        if (tts.index < tts.chunks.length){
          tts.speakCurrent();
        } else {
          tts.stop();
          sayOnce('End of document.');
        }
      };
      u.onerror = function(){ sayOnce('TTS error.'); };

      tts.utterance = u;
      try { tts.synth.speak(u); } catch(e){ sayOnce('Could not start TTS.'); }
    },

    play: function(){
      if (!tts.synth) return;
      if (!tts.chunks.length) tts.prepare();
      if (tts.synth.paused){
        try { tts.synth.resume(); } catch(e){}
        sayOnce('Resumed.');
        return;
      }
      if (!tts.synth.speaking){
        tts.speakCurrent();
      }
    },

    pause: function(){
      if (tts.synth && tts.synth.speaking && !tts.synth.paused){
        try { tts.synth.pause(); } catch(e){}
        sayOnce('Paused.');
      }
    },

    stop: function(){
      if (tts.synth){
        try { tts.synth.cancel(); } catch(e){}
      }
      tts.utterance = null;
      tts.clearHighlights();
      tts.index = 0;
      sayOnce('Stopped.');
    },

    rewind: function(){
      if (!tts.chunks.length) return;
      if (tts.synth && tts.synth.speaking) tts.stop();
      tts.index = Math.max(0, tts.index - 1);
      tts.play();
      sayOnce('Rewind.');
    },

    fastForward: function(){
      if (!tts.chunks.length) return;
      if (tts.synth && tts.synth.speaking) tts.stop();
      tts.index = Math.min(tts.chunks.length - 1, tts.index + 1);
      tts.play();
      sayOnce('Fast forward.');
    }
  };

  // ---------- Toolbar toggle with focus restore ----------
  var lastFocus = null;
  function toggleToolbar(desired){
    if (!qq || !qq.toolbar || !qq.toggleBtn) return;
    var willShow = (typeof desired === 'boolean') ? desired : !!qq.toolbar.hidden;
    if (willShow){
      lastFocus = document.activeElement || qq.toggleBtn;
      qq.toolbar.hidden = false;
      qq.toggleBtn.setAttribute('aria-expanded', 'true');
      try {
        var first = qq.toolbar.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (first && typeof first.focus === 'function') first.focus();
      } catch(e){}
      say('Controls shown.');
    } else {
      qq.toolbar.hidden = true;
      qq.toggleBtn.setAttribute('aria-expanded', 'false');
      try {
        var target = qq.toggleBtn || lastFocus;
        if (target && typeof target.focus === 'function') target.focus();
      } catch(e){}
      say('Controls hidden.');
    }
  }

  // ---------- Print subsystem ----------
  function printDocument(){
    var origin = document.activeElement;
    try {
      if (tts && tts.synth && tts.synth.speaking) {
        tts.stop();
        say('TTS paused for printing.');
      }
    } catch(e){}

    var mq = window.matchMedia && window.matchMedia('print');
    function onPrintChange(e){
      if (!e.matches) {
        try { if (origin && typeof origin.focus === 'function') origin.focus(); } catch(e){}
        if (mq && mq.removeEventListener) mq.removeEventListener('change', onPrintChange);
        say('Returned from print dialog.');
      }
    }
    if (mq && mq.addEventListener) mq.addEventListener('change', onPrintChange);

    window.print();
    say('Printing initiated.');
  }

  // ---------- UI init ----------
  function init(){
    qq = {
      theme: $('theme'),
size: [$('size'), $('size-panel')],       // Puts both sliders in an array
sizeOut: [$('sizeOut'), $('sizeOut-panel')], // Both readouts in an array
      measure: $('measure'),
      measureOut: $('measureOut'),
      focusBtn: $('focus'),
      mag: $('mag'),
      imgmode: $('imgmode'),
      family: $('family'),
      leading: $('leading'),
      leadingOut: $('leadingOut'),
      align: $('align'),
      lspace: $('lspace'),
      wspace: $('wspace'),
      saveSession: $('save-session'),
      savePersist: $('save-persist'),
      reset: $('reset'),
      printBtn: $('print-document'),
      status: $('status'),
      quick: $('quick'),

      // toolbar toggle and live region
      toggleBtn: $('toggle-toolbar'),
      ariaLive: $('aria-live'),
      toolbar: $('toolbar'),

      // TTS controls
      playBtn: $('tts-play'),
      pauseBtn: $('tts-pause'),
      stopBtn: $('tts-stop'),
      rewindBtn: $('tts-rewind'),
      ffwdBtn: $('tts-ffwd'),
      rateSlider: $('tts-rate'),
      rateOut: $('tts-rateOut'),
      pitchSlider: $('tts-pitch'),
      pitchOut: $('tts-pitchOut'),
      voiceSelect: $('tts-voice'),

      moreSummary: (function(){ return document.querySelector('details.tools > summary') || null; })()
    };

    defaults = {
      theme: (body.className.match(/theme-\w+/) || ['theme-light'])[0],
      mag: html.getAttribute('data-mag') || '',
      imgmode: html.getAttribute('data-img-mode') || 'normal',
      focus: body.classList.contains('focus-mode'),
      family: getVar('--reader-font-family', 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'),
      size: parseFloat(getVar('--reader-font-size', '1')) || 1.0,
      measure: parseInt(getVar('--reader-max-width', '45'), 10) || 45,
      leading: parseFloat(getVar('--reader-line-height', '1.6')) || 1.6,
      align: getVar('--reader-text-align', 'left') || 'left',
      lspace: parseFloat(getVar('--reader-letter-spacing', '0')) || 0,
      wspace: parseFloat(getVar('--reader-word-spacing', '0')) || 0,

      // TTS defaults
      ttsRate: 1.0,
      ttsPitch: 1.0,
      ttsVoice: '',
      ttsLang: ''
    };
    state = Object.assign({}, defaults);

    try {
      var raw = sessionStorage.getItem(KEY) || localStorage.getItem(KEY);
      if (raw){
        var saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') state = Object.assign(state, saved);
      }
    } catch(e){}

    tts.init();
    render();
    bind();

    html.setAttribute('data-js-ready', '1');
  }

  // ---------- Render ----------
  function render(){
    body.classList.remove('theme-light','theme-dark','theme-sepia','theme-gray','theme-high-contrast');
    body.classList.add(state.theme);

    if (state.mag) html.setAttribute('data-mag', state.mag); else html.removeAttribute('data-mag');
    html.setAttribute('data-img-mode', state.imgmode);

    body.classList.toggle('focus-mode', !!state.focus);
    if (qq && qq.focusBtn) qq.focusBtn.setAttribute('aria-pressed', state.focus ? 'true' : 'false');

    setVar('--reader-font-family', state.family);

    setVar('--reader-font-size', state.size + 'rem');
    if (qq && qq.sizeOut) qq.sizeOut.textContent = state.size.toFixed(2) + 'rem';

    setVar('--reader-max-width', state.measure + 'ch');
    if (qq && qq.measureOut) qq.measureOut.textContent = state.measure + 'ch';

    setVar('--reader-line-height', state.leading);
    if (qq && qq.leadingOut) qq.leadingOut.textContent = state.leading.toFixed(2);

    setVar('--reader-text-align', state.align);
    setVar('--reader-letter-spacing', state.lspace + 'em');
    setVar('--reader-word-spacing', state.wspace + 'em');

    if (!qq) return;
    if (qq.theme)   qq.theme.value = state.theme;
    if (qq.mag)     qq.mag.value = state.mag;
    if (qq.imgmode) qq.imgmode.value = state.imgmode;
    if (qq.family)  qq.family.value = state.family;
    if (qq.size)    qq.size.value = state.size;
    if (qq.measure) qq.measure.value = state.measure;
    if (qq.leading) qq.leading.value = state.leading;
    if (qq.align)   qq.align.value = state.align;

    if (qq.rateSlider) {
      qq.rateSlider.value = state.ttsRate;
      if (qq.rateOut) qq.rateOut.textContent = state.ttsRate.toFixed(2) + 'x';
    }
    if (qq.pitchSlider) {
      qq.pitchSlider.value = state.ttsPitch;
      if (qq.pitchOut) qq.pitchOut.textContent = state.ttsPitch.toFixed(2);
    }
    if (tts.voices.length) tts.populateVoiceList();
    if (qq.voiceSelect && state.ttsVoice){
      var ops = qq.voiceSelect.options;
      for (var i = 0; i < ops.length; i++){
        if (ops[i].value === state.ttsVoice){ ops[i].selected = true; break; }
      }
    }
  }

  // ---------- Bind ----------
  function bind(){
    on(qq.theme, 'change', function(e){ state.theme = e.target.value; render(); });

qq.size.forEach(function(slider, index) {
  if (!slider) return;
  on(slider, 'input', function(e) {
    var val = +e.target.value;
    state.size = val;
    setVar('--reader-font-size', state.size + 'rem');

    // Update both sliders and readouts to stay in sync
    qq.size.forEach(function(s) { if(s) s.value = val; });
    qq.sizeOut.forEach(function(o) { if(o) o.textContent = val.toFixed(2) + 'rem'; });
  });
});

    on(qq.measure, 'input', function(e){
      state.measure = parseInt(e.target.value, 10);
      setVar('--reader-max-width', state.measure + 'ch');
      if (qq.measureOut) qq.measureOut.textContent = state.measure + 'ch';
    });

    on(qq.focusBtn, 'click', function(){
      state.focus = !state.focus;
      render();
      say(state.focus ? 'Focus mode on.' : 'Focus mode off.');
    });

    on(qq.mag, 'change', function(e){ state.mag = e.target.value; render(); });
    on(qq.imgmode, 'change', function(e){ state.imgmode = e.target.value; render(); });
    on(qq.family, 'change', function(e){ state.family = e.target.value; render(); });

    on(qq.leading, 'input', function(e){
      state.leading = +e.target.value;
      setVar('--reader-line-height', state.leading);
      if (qq.leadingOut) qq.leadingOut.textContent = state.leading.toFixed(2);
    });

    on(qq.align, 'change', function(e){
      state.align = e.target.value;
      setVar('--reader-text-align', state.align);
    });

    on(qq.lspace, 'input', function(e){
      state.lspace = +e.target.value;
      setVar('--reader-letter-spacing', state.lspace + 'em');
    });

    on(qq.wspace, 'input', function(e){
      state.wspace = +e.target.value;
      setVar('--reader-word-spacing', state.wspace + 'em');
    });

    on(qq.saveSession, 'click', function(){
      try { sessionStorage.setItem(KEY, JSON.stringify(state)); say('Saved for this tab.'); }
      catch(e){ say('Could not save to session.'); }
    });

    on(qq.savePersist, 'click', function(){
      try { localStorage.setItem(KEY, JSON.stringify(state)); say('Saved as device default.'); }
      catch(e){ say('Could not save to device.'); }
    });

    on(qq.reset, 'click', function(){
      state = Object.assign({}, defaults);
      try { sessionStorage.removeItem(KEY); } catch(e){}
      try { localStorage.removeItem(KEY); } catch(e){}
      render();
      say('Reset.');
    });

    on(qq.printBtn, 'click', printDocument);
    on(qq.toggleBtn, 'click', function(){ toggleToolbar(); });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(ev){
      var tag = ev.target && ev.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || ev.isComposing) return;

      var k = String(ev.key);

      if (k === '+' || k === '='){
        ev.preventDefault();
        state.size = Math.min(1.75, +(state.size + 0.0625).toFixed(4));
        render();
        return;
      }
      if (k === '-' || k === '_'){
        ev.preventDefault();
        state.size = Math.max(0.75, +(state.size - 0.0625).toFixed(4));
        render();
        return;
      }
      if (k === '['){
        ev.preventDefault();
        state.measure = Math.max(40, state.measure - 1);
        render();
        return;
      }
      if (k === ']'){
        ev.preventDefault();
        state.measure = Math.min(80, state.measure + 1);
        render();
        return;
      }

      // Focus mode toggle
      if (k === 'f' || k === 'F' || k === 't' || k === 'T'){
        ev.preventDefault();
        state.focus = !state.focus;
        render();
        say(state.focus ? 'Focus mode on.' : 'Focus mode off.');
        return;
      }

      // Toolbar toggle
      if (k === 'h' || k === 'H'){
        ev.preventDefault();
        toggleToolbar();
        return;
      }

      // TTS hotkeys
      if (!(tts && tts.synth)) return;
      var lc = k.toLowerCase();

      if (lc === 'p'){
        ev.preventDefault();
        if (tts.synth.speaking && !tts.synth.paused){
          tts.pause(); // announces Paused
        } else {
          var wasPaused = !!(tts.synth && tts.synth.paused);
          tts.play();
          sayOnce(wasPaused ? 'Resumed.' : 'Playing.');
        }
        return;
      }
      if (lc === 's'){
        ev.preventDefault();
        tts.stop(); // announces Stopped
        return;
      }
      if (k === 'ArrowLeft'){
        ev.preventDefault();
        tts.rewind(); // announces Rewind
        return;
      }
      if (k === 'ArrowRight'){
        ev.preventDefault();
        tts.fastForward(); // announces Fast forward
        return;
      }
    }, false);

    // Keep summary aria state in sync if present
    if (qq.moreSummary){
      var detailsEl = qq.moreSummary.parentElement;
      if (detailsEl){
        detailsEl.addEventListener('toggle', function(){
          qq.moreSummary.setAttribute('aria-expanded', detailsEl.open ? 'true' : 'false');
        });
      }
    }
  }

  // ---------- Boot ----------
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
