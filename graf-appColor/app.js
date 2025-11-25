// Robust RGB ⇄ Hex viewer with DOMContentLoaded and null-safe bindings
document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  const rRange = $('rRange');
  const vRange = $('vRange');
  const aRange = $('aRange');
  const rNum   = $('rNum');
  const vNum   = $('vNum');
  const aNum   = $('aNum');
  const rVal   = $('rVal');
  const vVal   = $('vVal');
  const aVal   = $('aVal');

  const preview     = $('preview');
  const previewLbl  = $('previewLabel');
  const hexBadge    = $('hexBadge');
  const rgbText     = $('rgbText');
  const copyBtn     = $('copyBtn');
  const resetBtn    = $('resetBtn');
  const randomBtn   = $('randomBtn');
  const colorPicker = $('colorPicker');
  const themeToggle = $('themeToggle');
  const body = document.body;

  // Guard: if essential nodes are missing, stop
  if (!rRange || !vRange || !aRange || !preview) {
    console.error('[RGB App] Elementos esenciales no encontrados.');
    return;
  }

  // Utils
  const clamp255 = v => Math.max(0, Math.min(255, Number.isFinite(v) ? v : 0));
  const toHex2 = v => clamp255(v).toString(16).toUpperCase().padStart(2, '0');
  const toInt  = v => clamp255(parseInt(v, 10));

  function hexToRgb(hex) {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex).trim());
    if (!m) return { r: 0, g: 0, b: 0 };
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
  }

  function srgbToLinear(c) {
    c = c / 255;
    return (c <= 0.04045) ? (c / 12.92) : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function luminance(r,g,b) {
    const R = srgbToLinear(r);
    const G = srgbToLinear(g);
    const B = srgbToLinear(b);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }

  function updateFromValues(r, g, b) {
    r = toInt(r); g = toInt(g); b = toInt(b);

    // Sync inputs (if present)
    if (rRange) rRange.value = r;
    if (vRange) vRange.value = g;
    if (aRange) aRange.value = b;
    if (rNum)   rNum.value = r;
    if (vNum)   vNum.value = g;
    if (aNum)   aNum.value = b;
    if (rVal)   rVal.textContent = r;
    if (vVal)   vVal.textContent = g;
    if (aVal)   aVal.textContent = b;

    const hex = `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`;
    const rgb = `rgb(${r}, ${g}, ${b})`;

    // Apply color
    preview.style.backgroundColor = hex;
    if (rgbText)  rgbText.textContent = rgb;
    if (hexBadge) hexBadge.textContent = hex;
    if (previewLbl) previewLbl.textContent = hex;

    // Sync color picker
    if (colorPicker && colorPicker.value.toUpperCase() !== hex) {
      colorPicker.value = hex;
    }

    // Auto contrast for text/border
    const L = luminance(r,g,b);
    const textColor = (L > 0.5) ? '#000000' : '#FFFFFF';
    const borderColor = (L > 0.7) ? '#adb5bd' : '#444';
    preview.style.borderColor = borderColor;
    if (previewLbl) {
      previewLbl.style.color = textColor;
      previewLbl.style.backgroundColor = (L > 0.5) ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
    }

    // Persist color
    try {
      const payload = JSON.parse(localStorage.getItem('rgb-picker')) || {};
      payload.r = r; payload.g = g; payload.b = b;
      localStorage.setItem('rgb-picker', JSON.stringify(payload));
    } catch {}
  }

  // Handlers for sliders and numeric inputs
  [rRange, vRange, aRange].forEach(el => {
    el.addEventListener('input', () => {
      updateFromValues(rRange.value, vRange.value, aRange.value);
    });
  });

  [rNum, vNum, aNum].forEach(el => {
    el && el.addEventListener('input', () => {
      updateFromValues(rNum.value, vNum.value, aNum.value);
    });
  });

  // Handler for color picker
  if (colorPicker) {
    colorPicker.addEventListener('input', () => {
      const { r, g, b } = hexToRgb(colorPicker.value);
      updateFromValues(r, g, b);
    });
  }

  // Copy button
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const hex = (hexBadge?.textContent || '').trim();
      try {
        await navigator.clipboard.writeText(hex);
        copyBtn.textContent = 'Copiado';
        setTimeout(() => (copyBtn.textContent = 'Copiar'), 900);
      } catch {
        const t = document.createElement('textarea');
        t.value = hex;
        document.body.appendChild(t);
        t.select();
        document.execCommand('copy');
        document.body.removeChild(t);
        copyBtn.textContent = 'Copiado';
        setTimeout(() => (copyBtn.textContent = 'Copiar'), 900);
      }
    });
  }

  // Buttons
  if (resetBtn) resetBtn.addEventListener('click', () => updateFromValues(0,0,0));
  if (randomBtn) randomBtn.addEventListener('click', () => {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    updateFromValues(r,g,b);
  });

  // Theme toggle with persistence
  function applyTheme(mode) {
    body.setAttribute('data-bs-theme', mode);
    const lightSpan = document.querySelector('#themeToggle .theme-light');
    const darkSpan  = document.querySelector('#themeToggle .theme-dark');
    if (lightSpan && darkSpan) {
      if (mode === 'dark') {
        lightSpan.classList.add('d-none');
        darkSpan.classList.remove('d-none');
      } else {
        darkSpan.classList.add('d-none');
        lightSpan.classList.remove('d-none');
      }
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const mode = body.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(mode);
      try {
        const payload = JSON.parse(localStorage.getItem('rgb-picker')) || {};
        payload.theme = mode;
        localStorage.setItem('rgb-picker', JSON.stringify(payload));
      } catch {}
    });
  }

  // Init from localStorage or defaults
  let initial = {r:0, g:0, b:0, theme:'light'};
  try {
    const saved = JSON.parse(localStorage.getItem('rgb-picker'));
    if (saved) {
      if (Number.isFinite(saved.r) && Number.isFinite(saved.g) && Number.isFinite(saved.b)) {
        initial.r = saved.r; initial.g = saved.g; initial.b = saved.b;
      }
      if (saved.theme === 'dark' || saved.theme === 'light') {
        initial.theme = saved.theme;
      }
    }
  } catch {}
  applyTheme(initial.theme);
  updateFromValues(initial.r, initial.g, initial.b);
});
