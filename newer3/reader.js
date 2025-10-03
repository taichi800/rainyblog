(function(){
  const html = document.documentElement;

  // Elements
  const openBtn = document.getElementById('reader-open');
  const panel   = document.getElementById('panel-display');
  const status  = document.getElementById('status');

  const theme       = document.getElementById('theme-select');
  const size        = document.getElementById('size-range');
  const sizeOut     = document.getElementById('size-out');
  const measure     = document.getElementById('measure-range');
  const measureOut  = document.getElementById('measure-out');
  const leading     = document.getElementById('leading-range');
  const leadingOut  = document.getElementById('leading-out');

  // Live announcer
  function say(msg){
    if (!status) return;
    status.textContent = msg;
    clearTimeout(say._t);
    say._t = setTimeout(() => { status.textContent = ''; }, 1100);
  }

  // Open panel
  function openPanel(){
    if (panel.open) return;
    panel.showModal();
    openBtn.setAttribute('aria-expanded','true');
    panel.addEventListener('close', () => {
      openBtn.setAttribute('aria-expanded','false');
      openBtn.focus();
    }, { once: true });
  }

  // Bind opener
  openBtn.addEventListener('click', openPanel);
  document.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'r' || e.key === 'R')) {
      e.preventDefault(); openPanel();
    }
  });

  // Theme change
  theme.addEventListener('change', () => {
    // remove existing theme-* classes
    html.classList.forEach(c => { if (c.startsWith('theme-')) html.classList.remove(c); });
    html.classList.add(theme.value);
    say(`Theme ${theme.options[theme.selectedIndex].text}`);
  });

  // Font size
  function applySize(){
    const v = parseFloat(size.value);
    html.style.setProperty('--scale', v.toFixed(2));
    sizeOut.value = v.toFixed(2);
    say(`Font size ×${v.toFixed(2)}`);
  }
  size.addEventListener('input', applySize);
  size.addEventListener('change', applySize);

  // Measure
  function applyMeasure(){
    const v = parseInt(measure.value, 10);
    html.style.setProperty('--measure', v);
    measureOut.value = String(v);
    say(`Measure ${v} ch`);
  }
  measure.addEventListener('input', applyMeasure);
  measure.addEventListener('change', applyMeasure);

  // Line height
  function applyLeading(){
    const v = parseFloat(leading.value);
    html.style.setProperty('--leading', v.toFixed(2));
    leadingOut.value = v.toFixed(2);
    say(`Line height ${v.toFixed(2)}`);
  }
  leading.addEventListener('input', applyLeading);
  leading.addEventListener('change', applyLeading);

  // Initialize outputs to CSS defaults
  applySize(); applyMeasure(); applyLeading();
})();
