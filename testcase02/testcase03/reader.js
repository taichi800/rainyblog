/* reader.js */
(function(){
  'use strict';

  var html = document.documentElement;
  var body = document.body;
  var KEY  = 'reader:settings';

  function $(id){ return document.getElementById(id); }
  function on(el, type, handler){ if (el) el.addEventListener(type, handler, false); }
  function setVar(k, v){ html.style.setProperty(k, v); }
  function getVar(n, fallback){
    var v = window.getComputedStyle(html).getPropertyValue(n);
    v = v ? v.trim() : '';
    return v || fallback;
  }
  var prefersReducedMotion = false;
  try { prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){}

  var qq = null;
  var defaults, state;

  function init(){
    // Cache elements
    qq = {
      theme: $('theme'),
      size: $('size'),
      sizeOut: $('sizeOut'),
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
      status: $('status'),
      quick: $('quick'),
      moreSummary: (function(){ var s = document.querySelector('details.tools > summary'); return s || null; })()
    };

    // Defaults from current tokens
    defaults = {
      theme: (body.className.match(/theme-\w+/) || ['theme-light'])[0],
      mag: html.getAttribute('data-mag') || '',
      imgmode: html.getAttribute('data-img-mode') || 'normal',
      focus: body.classList.contains('focus-mode'),
      family: getVar('--reader-font-family', 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'),
      size: parseFloat(getVar('--reader-font-size', '1')) || 1.0,
      measure: parseInt(getVar('--reader-max-width', '45ch'), 10) || 45,
      leading: parseFloat(getVar('--reader-line-height', '1.6')) || 1.6,
      align: getVar('--reader-text-align', 'left') || 'left',
      lspace: parseFloat(getVar('--reader-letter-spacing', '0')) || 0,
      wspace: parseFloat(getVar('--reader-word-spacing', '0')) || 0
    };
    state = Object.assign({}, defaults);

    // Load stored state
    try {
      var raw = sessionStorage.getItem(KEY) || localStorage.getItem(KEY);
      if (raw){
        var saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') state = Object.assign({}, state, saved);
      }
    } catch(e){}

    render();
    bind();

    // Simple debug hook to confirm JS ran
    html.setAttribute('data-js-ready', '1');
  }

  function render(){
    // Theme
    body.classList.remove('theme-light','theme-dark','theme-sepia','theme-gray','theme-high-contrast');
    body.classList.add(state.theme);

    // Magnification and image mode
    if (state.mag) html.setAttribute('data-mag', state.mag);
    else html.removeAttribute('data-mag');
    html.setAttribute('data-img-mode', state.imgmode);

    // Focus mode toggle
    if (state.focus) body.classList.add('focus-mode'); else body.classList.remove('focus-mode');
    if (qq && qq.focusBtn) qq.focusBtn.setAttribute('aria-pressed', state.focus ? 'true' : 'false');

    // Tokens
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

    // Reflect to inputs
    if (!qq) return;
    if (qq.theme)   qq.theme.value = state.theme;
    if (qq.mag)     qq.mag.value = state.mag;
    if (qq.imgmode) qq.imgmode.value = state.imgmode;
    if (qq.family)  qq.family.value = state.family;
    if (qq.size)    qq.size.value = state.size;
    if (qq.measure) qq.measure.value = state.measure;
    if (qq.leading) qq.leading.value = state.leading;
    if (qq.align)   qq.align.value = state.align;
  }

  function say(msg){
    if (!qq || !qq.status) return;
    qq.status.textContent = msg;
    clearTimeout(say._t);
    say._t = setTimeout(function(){ qq.status.textContent = ''; }, 2000);
  }

  function bind(){
    // Quick bar
    on(qq.theme, 'change', function(e){ state.theme = e.target.value; render(); });

    on(qq.size, 'input', function(e){
      state.size = +e.target.value;
      setVar('--reader-font-size', state.size + 'rem');
      if (qq.sizeOut) qq.sizeOut.textContent = state.size.toFixed(2) + 'rem';
    });

    on(qq.measure, 'input', function(e){
      state.measure = parseInt(e.target.value, 10);
      setVar('--reader-max-width', state.measure + 'ch');
      if (qq.measureOut) qq.measureOut.textContent = state.measure + 'ch';
    });

    on(qq.focusBtn, 'click', function(){
      state.focus = !state.focus;
      render();
    });

    // More panel
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

    // Storage
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

    // Keyboard shortcuts
    document.addEventListener('keydown', function(ev){
      var tag = ev.target && ev.target.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (ev.key === '+' || ev.key === '='){
        ev.preventDefault();
        state.size = Math.min(1.75, +(state.size + 0.0625).toFixed(4));
        render();
        return;
      }
      if (ev.key === '-' || ev.key === '_'){
        ev.preventDefault();
        state.size = Math.max(0.75, +(state.size - 0.0625).toFixed(4));
        render();
        return;
      }
      if (ev.key === '['){
        ev.preventDefault();
        state.measure = Math.max(40, state.measure - 1);
        render();
        return;
      }
      if (ev.key === ']'){
        ev.preventDefault();
        state.measure = Math.min(80, state.measure + 1);
        render();
        return;
      }
      if (String(ev.key).toLowerCase() === 'f'){
        ev.preventDefault();
        state.focus = !state.focus;
        render();
        return;
      }
      if (qq.quick && (ev.key === 'Home' || ev.key === 'End')){
        ev.preventDefault();
        var opts = prefersReducedMotion ? {} : { behavior: 'smooth' };
        if (ev.key === 'Home') qq.quick.scrollTo(Object.assign({ left: 0 }, opts));
        if (ev.key === 'End')  qq.quick.scrollTo(Object.assign({ left: qq.quick.scrollWidth }, opts));
      }
      if (ev.key === 'Escape' && qq.moreSummary){
        var detailsEl = qq.moreSummary.parentElement;
        if (detailsEl && detailsEl.open){ detailsEl.open = false; }
      }
    }, false);

    // Aria-expanded sync
    if (qq.moreSummary){
      var detailsEl = qq.moreSummary.parentElement;
      if (detailsEl){
        detailsEl.addEventListener('toggle', function(){
          qq.moreSummary.setAttribute('aria-expanded', detailsEl.open ? 'true' : 'false');
        });
      }
    }
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
