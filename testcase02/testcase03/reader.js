<script>
(() => {
  'use strict';

  // ---------- Elements and helpers ----------
  const html = document.documentElement;
  const body = document.body;
  const KEY  = 'reader:settings';

  const $  = (id) => document.getElementById(id);
  const qq = {
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
    moreSummary: document.querySelector('details.tools > summary'),
  };

  const setVar = (k, v) => html.style.setProperty(k, v);
  const getVar = (n, fallback) => {
    const v = getComputedStyle(html).getPropertyValue(n).trim();
    return v || fallback;
  };
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Defaults from tokens ----------
  const defaults = Object.freeze({
    theme: body.className.match(/theme-\w+/)?.[0] || 'theme-light',
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
  });

  let state = { ...defaults };

  // ---------- Render ----------
  function render() {
    // Theme and structural toggles
    body.classList.remove('theme-light','theme-dark','theme-sepia','theme-gray','theme-high-contrast');
    body.classList.add(state.theme);

    if (state.mag) html.setAttribute('data-mag', state.mag);
    else html.removeAttribute('data-mag');

    html.setAttribute('data-img-mode', state.imgmode);

    body.classList.toggle('focus-mode', !!state.focus);
    if (qq.focusBtn) qq.focusBtn.setAttribute('aria-pressed', state.focus ? 'true' : 'false');

    // Tokens
    setVar('--reader-font-family', state.family);

    setVar('--reader-font-size', state.size + 'rem');
    if (qq.sizeOut) qq.sizeOut.value = state.size.toFixed(2) + 'rem';

    setVar('--reader-max-width', state.measure + 'ch');
    if (qq.measureOut) qq.measureOut.value = state.measure + 'ch';

    setVar('--reader-line-height', state.leading);
    if (qq.leadingOut) qq.leadingOut.value = state.leading.toFixed(2);

    setVar('--reader-text-align', state.align);
    setVar('--reader-letter-spacing', state.lspace + 'em');
    setVar('--reader-word-spacing', state.wspace + 'em');

    // Inputs
    if (qq.theme) qq.theme.value = state.theme;
    if (qq.mag) qq.mag.value = state.mag;
    if (qq.imgmode) qq.imgmode.value = state.imgmode;
    if (qq.family) qq.family.value = state.family;
    if (qq.size) qq.size.value = state.size;
    if (qq.measure) qq.measure.value = state.measure;
    if (qq.leading) qq.leading.value = state.leading;
    if (qq.align) qq.align.value = state.align;
  }

  // ---------- Status helper ----------
  function say(msg){
    if (!qq.status) return;
    qq.status.textContent = msg;
    clearTimeout(say._t);
    say._t = setTimeout(() => { qq.status.textContent = ''; }, 2000);
  }

  // ---------- Bindings ----------
  // Quick bar
  qq.theme?.addEventListener('change', e => { state.theme = e.target.value; render(); });
  qq.size?.addEventListener('input', e => {
    state.size = +e.target.value;
    setVar('--reader-font-size', state.size + 'rem');
    if (qq.sizeOut) qq.sizeOut.value = state.size.toFixed(2) + 'rem';
  });
  qq.measure?.addEventListener('input', e => {
    state.measure = parseInt(e.target.value, 10);
    setVar('--reader-max-width', state.measure + 'ch');
    if (qq.measureOut) qq.measureOut.value = state.measure + 'ch';
  });
  qq.focusBtn?.addEventListener('click', () => { state.focus = !state.focus; render(); });

  // More panel
  qq.mag?.addEventListener('change', e => { state.mag = e.target.value; render(); });
  qq.imgmode?.addEventListener('change', e => { state.imgmode = e.target.value; render(); });
  qq.family?.addEventListener('change', e => { state.family = e.target.value; render(); });
  qq.leading?.addEventListener('input', e => {
    state.leading = +e.target.value;
    setVar('--reader-line-height', state.leading);
    if (qq.leadingOut) qq.leadingOut.value = state.leading.toFixed(2);
  });
  qq.align?.addEventListener('change', e => {
    state.align = e.target.value;
    setVar('--reader-text-align', state.align);
  });

  qq.lspace?.addEventListener('input', e => {
    state.lspace = +e.target.value;
    setVar('--reader-letter-spacing', state.lspace + 'em');
  });
  qq.wspace?.addEventListener('input', e => {
    state.wspace = +e.target.value;
    setVar('--reader-word-spacing', state.wspace + 'em');
  });

  // Storage
  qq.saveSession?.addEventListener('click', () => {
    try { sessionStorage.setItem(KEY, JSON.stringify(state)); say('Saved for this tab.'); }
    catch { say('Could not save to session.'); }
  });
  qq.savePersist?.addEventListener('click', () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); say('Saved as device default.'); }
    catch { say('Could not save to device.'); }
  });
  qq.reset?.addEventListener('click', () => {
    state = { ...defaults };
    try { sessionStorage.removeItem(KEY); } catch {}
    try { localStorage.removeItem(KEY); } catch {}
    render();
    say('Reset.');
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (ev) => {
    // Ignore when user is typing in controls
    if (['INPUT','SELECT','TEXTAREA'].includes(ev.target.tagName)) return;

    // Zoom
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

    // Measure
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

    // Focus mode
    if (ev.key.toLowerCase() === 'f'){
      ev.preventDefault();
      state.focus = !state.focus;
      render();
      return;
    }

    // Quick-strip navigation
    if (qq.quick && (ev.key === 'Home' || ev.key === 'End')){
      ev.preventDefault();
      const opts = prefersReducedMotion ? {} : { behavior: 'smooth' };
      if (ev.key === 'Home') qq.quick.scrollTo({ left: 0, ...opts });
      if (ev.key === 'End')  qq.quick.scrollTo({ left: qq.quick.scrollWidth, ...opts });
    }

    // Close More panel with Escape
    if (ev.key === 'Escape'){
      const detailsEl = qq.moreSummary?.parentElement;
      if (detailsEl?.open){ detailsEl.open = false; }
    }
  });

  // Keep summary aria-expanded in sync
  if (qq.moreSummary){
    const detailsEl = qq.moreSummary.parentElement;
    detailsEl.addEventListener('toggle', () => {
      qq.moreSummary.setAttribute('aria-expanded', detailsEl.open ? 'true' : 'false');
    });
  }

  // ---------- Load and first render ----------
  (function load(){
    const raw = sessionStorage.getItem(KEY) || localStorage.getItem(KEY);
    if (raw){
      try {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') state = { ...state, ...saved };
      } catch { /* ignore corrupt storage */ }
    }
    render();
  })();

})();
</script>
