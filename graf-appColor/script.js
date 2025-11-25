// script.js
document.addEventListener('DOMContentLoaded', () => {
  // Elementos
  const rRange = document.getElementById('rRange');
  const gRange = document.getElementById('gRange');
  const bRange = document.getElementById('bRange');

  const rNumber = document.getElementById('rNumber');
  const gNumber = document.getElementById('gNumber');
  const bNumber = document.getElementById('bNumber');

  const rValue = document.getElementById('rValue');
  const gValue = document.getElementById('gValue');
  const bValue = document.getElementById('bValue');

  const hexCode = document.getElementById('hexCode'); // sin #
  const hexText = document.getElementById('hexText');
  const rgbText = document.getElementById('rgbText');
  const colorBox = document.getElementById('colorBox');
  const preview = document.getElementById('preview');

  const copyBtn = document.getElementById('copyBtn');
  const randomBtn = document.getElementById('randomBtn');

  const decimalInput = document.getElementById('decimalInput');
  const colorPicker = document.getElementById('colorPicker');

  // Helpers
  function clampInt(v, min, max) {
    v = Number(v);
    if (!Number.isFinite(v) || isNaN(v)) return min;
    return Math.min(max, Math.max(min, Math.round(v)));
  }

  function toHex(n) {
    const v = clampInt(n, 0, 255);
    const h = v.toString(16).toUpperCase();
    return h.length === 1 ? '0' + h : h;
  }

  function padHex(h) {
    h = h.replace('#', '').trim();
    if (h.length === 3) {
      return h.split('').map(c => c + c).join('').toUpperCase();
    }
    return h.padStart(6, '0').toUpperCase();
  }

  function hexToRgb(hex) {
    if (!hex) return null;
    hex = padHex(hex);
    if (!/^[0-9A-F]{6}$/.test(hex)) return null;
    const r = parseInt(hex.substring(0,2), 16);
    const g = parseInt(hex.substring(2,4), 16);
    const b = parseInt(hex.substring(4,6), 16);
    return { r, g, b };
  }

  function rgbToDecimal(r, g, b) {
    return ((r & 0xFF) << 16) + ((g & 0xFF) << 8) + (b & 0xFF);
  }

  function decimalToRgb(dec) {
    dec = clampInt(dec, 0, 16777215);
    const r = (dec >> 16) & 0xFF;
    const g = (dec >> 8) & 0xFF;
    const b = dec & 0xFF;
    return { r, g, b };
  }

  function setTextContrast(r,g,b) {
    // Luminance simple: si fondo claro, texto oscuro
    const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
    const textColor = luminance > 0.6 ? '#071024' : '#ffffff';
    preview.style.color = textColor;
  }

  // Actualiza UI a partir de r,g,b
  function updateFromRGB(r, g, b) {
    r = clampInt(r,0,255); g = clampInt(g,0,255); b = clampInt(b,0,255);

    // ranges y números
    rRange.value = r; gRange.value = g; bRange.value = b;
    rNumber.value = r; gNumber.value = g; bNumber.value = b;
    rValue.textContent = r; gValue.textContent = g; bValue.textContent = b;

    // textos
    const hex = `${toHex(r)}${toHex(g)}${toHex(b)}`;
    const rgbStr = `rgb(${r}, ${g}, ${b})`;

    rgbText.textContent = rgbStr;
    hexText.textContent = `#${hex}`;
    hexCode.value = hex;
    colorBox.style.backgroundColor = `#${hex}`;
    colorPicker.value = `#${hex}`;

    decimalInput.value = rgbToDecimal(r,g,b);

    setTextContrast(r,g,b);
  }

  function updateFromDecimal(dec) {
    if (dec === '' || dec === null) return;
    const d = clampInt(Number(dec), 0, 16777215);
    const { r, g, b } = decimalToRgb(d);
    updateFromRGB(r, g, b);
  }

  function updateFromHexInput(raw) {
    if (!raw) return;
    const rgb = hexToRgb(raw);
    if (!rgb) return;
    updateFromRGB(rgb.r, rgb.g, rgb.b);
  }

  // Lectura de los sliders actuales y actualización
  function triggerFromRanges() {
    const r = clampInt(rRange.value, 0, 255);
    const g = clampInt(gRange.value, 0, 255);
    const b = clampInt(bRange.value, 0, 255);
    updateFromRGB(r,g,b);
  }

  // Sincronizar range <-> number
  function attachSync(rangeEl, numberEl) {
    rangeEl.addEventListener('input', () => {
      numberEl.value = rangeEl.value;
      triggerFromRanges();
    });
    numberEl.addEventListener('input', () => {
      let v = numberEl.value;
      if (v === '') return;
      v = clampInt(Number(v), 0, 255);
      numberEl.value = v;
      rangeEl.value = v;
      triggerFromRanges();
    });
    // normalizar al perder foco
    numberEl.addEventListener('blur', () => {
      if (numberEl.value === '') numberEl.value = 0;
      numberEl.value = clampInt(Number(numberEl.value), 0, 255);
      rangeEl.value = numberEl.value;
      triggerFromRanges();
    });
  }

  attachSync(rRange, rNumber);
  attachSync(gRange, gNumber);
  attachSync(bRange, bNumber);

  // decimal input
  decimalInput.addEventListener('change', () => updateFromDecimal(decimalInput.value));
  decimalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') updateFromDecimal(decimalInput.value);
  });

  // color picker
  colorPicker.addEventListener('input', (e) => {
    updateFromHexInput(e.target.value);
  });

  // hex input (sin #)
  hexCode.addEventListener('change', () => updateFromHexInput(hexCode.value));
  hexCode.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') updateFromHexInput(hexCode.value);
  });

  // copiar hex
  copyBtn.addEventListener('click', async () => {
    const text = `#${hexCode.value.replace('#','')}`;
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'Copiado ✓';
      setTimeout(() => copyBtn.textContent = 'Copiar', 1200);
    } catch (err) {
      // fallback
      const tmp = document.createElement('textarea');
      tmp.value = text;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand('copy');
      tmp.remove();
      copyBtn.textContent = 'Copiado ✓';
      setTimeout(() => copyBtn.textContent = 'Copiar', 1200);
    }
  });

  // aleatorio
  randomBtn.addEventListener('click', () => {
    const r = Math.floor(Math.random()*256);
    const g = Math.floor(Math.random()*256);
    const b = Math.floor(Math.random()*256);
    updateFromRGB(r,g,b);
  });

  // Inicializar color negro
  updateFromRGB(0,0,0);

  // Para depuración (opcional): mostrar los eventos en consola si quieres
  // console.log('RGB app ready');
});
