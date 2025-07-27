function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  // hsl変換の計算で使う
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s;
  // max と min の中点をとる＝「最も明るい要素と最も暗い要素の平均」が明度
  const l = (max + min) / 2;
  // max === min のとき、RGB 全チャンネルが同じ → 無彩色なので無音に
  if (max === min) {
    h = s = 0;
  } else {
    // 色の強さの差
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}
// 12の音階
const noteFreqs = [
  261.63, 277.18, 293.66, 311.13,
  329.63, 349.23, 369.99, 392.00,
  415.30, 440.00, 466.16, 493.88
];
// lのレベルを8段階に分ける
const levels = Array.from({length: 8}, (_, i) => (i + 1) / 9);
// オクターブの8段階
const multipliers = [0.125, 0.25, 0.5, 1, 2, 4, 8, 16];

function hslToFreq(h, l) {
  h = ((h % 1) + 1) % 1;
  const huePos = h * 12;
  const noteIndex = Math.floor(huePos) % 12;
  const offset = huePos - noteIndex;

  const base = noteFreqs[noteIndex];
  const next = noteFreqs[(noteIndex + 1) % 12];
  const freq0 = base + (next - base) * offset;
  
  let idx = 0, minDiff = Math.abs(l - levels[0]);

  for (let i = 1; i < levels.length; i++) {
    const diff = Math.abs(l - levels[i]);
    if (diff < minDiff) {
      minDiff = diff;
      idx = i;
    }
  }
  return freq0 * multipliers[idx];
}

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('draw-canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  // 今何本の指がキャンバスに乗っているかを追跡する Set
  const activePointers = new Set();
  
  const indCanvas = document.getElementById('indicator-canvas');
  const indCtx    = indCanvas.getContext('2d');
  // カラーピッカーの色を受け取る
  const colorPicker = document.getElementById('color-picker');
  
  const soundPlayButton = document.getElementById('sound-play-button');
  const randomColorButton = document.getElementById('random-color-button');
  const lineWidth = document.getElementById('line-width');
  const speedInput = document.getElementById('speed-input');
  const fileInput   = document.getElementById('file-input');
  const downloadBtn = document.getElementById('download-button');
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  let columnIndex = 0;      // 今どの列を鳴らすか
  let timerId = null;       // setTimeout の ID
  let duration = parseFloat(speedInput.value);

  function playOneColumn(x) {
    // まずインジケーターをクリア＆描画 ──
    indCtx.clearRect(0, 0, canvas.width, canvas.height);
    indCtx.beginPath();
    indCtx.strokeStyle = 'black';
    indCtx.lineWidth = 1;
    // x 座標の中心になるように 0.5px オフセットするとシャープに出ます
    indCtx.moveTo(x + 0.5, 0);
    indCtx.lineTo(x + 0.5, canvas.height);
    indCtx.stroke();

    // カウント → 周波数＆振幅設定（最適化パターン）
    const colorCounts = {};
    const { height } = canvas;
    const col = ctx.getImageData(x, 0, 1, height).data;
    for (let y = 0; y < height; y++) {
      const i = y * 4;
      const key = `${col[i]},${col[i+1]},${col[i+2]}`;
      colorCounts[key] = (colorCounts[key] || 0) + 1;
    }

    // オシレーター＋GainNode で和音再生
    for (const [key, count] of Object.entries(colorCounts)) {
      const [r, g, b] = key.split(',').map(Number);
      const [h, s, l] = rgbToHsl(r, g, b);
      if (s === 0) continue;

      const freq = hslToFreq(h, l);
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = count / height;

      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gainNode).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    }
  }

  function loopPlay() {
    playOneColumn(columnIndex);
    // 次の列へ（右端超えたら 0 に戻す）
    columnIndex = (columnIndex + 1) % canvas.width;
    // duration 秒後にまた呼び出し
    timerId = setTimeout(loopPlay, duration * 1000);
  }

  function applyRandomColor() {
    // 0x000000～0xFFFFFF の間で乱数を作って16進6桁に
    const randomColor =
      '#' +
      Math.floor(Math.random() * 0x1000000)
        .toString(16)
        .padStart(6, '0');
    colorPicker.value = randomColor;
    ctx.strokeStyle = randomColor;
    ctx.fillStyle = randomColor;
    console.log('Random color →', randomColor);
  }

  // 初期ブラシ設定
  let currentLineWidth = parseFloat(lineWidth.value) || 50;
  ctx.lineWidth = currentLineWidth;
  ctx.strokeStyle = colorPicker.value;
  ctx.fillStyle = colorPicker.value;

  ctx.globalCompositeOperation = 'source-over';

  // 色んなボタン
  // 色選択
  colorPicker.addEventListener('input', (e) => {
    ctx.strokeStyle = e.target.value;
    ctx.fillStyle   = e.target.value;
  });
  // ランダムカラー切り替え (rキー)
  window.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 'r') applyRandomColor();
  });
  // ランダムカラー切り替え（ボタン）
  randomColorButton.addEventListener('click', applyRandomColor);
  // 線の幅を変える
  lineWidth.addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) currentLineWidth = v;
    ctx.lineWidth = currentLineWidth;
  });
  // 速さを変える
  speedInput.addEventListener('input', e => {
    const v = parseFloat(e.target.value);
    if (!isNaN(v)) duration = v;
  });

  // ── 外部画像読み込み ──
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        // キャンバス全体にフィットさせて描画
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  // ── キャンバス画像保存 ──
  downloadBtn.addEventListener('click', () => {
    // DataURL を生成
    const dataURL = canvas.toDataURL('image/png');
    // 仮のリンクを作ってクリック
    const link = document.createElement('a');
    link.href    = dataURL;
    link.download = 'canvas.png';
    link.click();
  });
  
  // 描画方法
  let isDrawing = false, lastX = 0, lastY = 0;
  // マウスがクリックされた時
  canvas.addEventListener('pointerdown', (e) => {
    activePointers.add(e.pointerId);
    if (activePointers.size === 1) {
      isDrawing = true;
      // 描きはじめの位置をセット
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // 線の太さ分の四角い点を塗りつぶす
      const size = ctx.lineWidth;
      ctx.fillRect(x - size/2, y - size/2, size, size);
      
      lastX = x;
      lastY = y;
    } else {
    // マルチタッチ → 描画抑制
    isDrawing = false;
    }
  });

  // マウスを動かしたとき
  canvas.addEventListener('pointermove', (e) => {
    if (!isDrawing || activePointers.size > 1) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastX = x;
    lastY = y;
  });
  // 指が離れた時
  const endPointer = e => {
    activePointers.delete(e.pointerId);
    if (isDrawing && activePointers.size === 0) {
      // 最後の指が離れたら描画終了
      isDrawing = false;
    }
  };

  // マウスを離したとき／キャンバスから出たとき
  ['pointerup','pointerout','pointercancel'].forEach(evt =>
    canvas.addEventListener(evt, endPointer)
  );

  console.log('Ready to draw!');

  // サウンドトグル
  soundPlayButton.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const isPlaying = soundPlayButton.classList.toggle('active');
    if (isPlaying) {
      // 再生開始：ループ呼び出し
      columnIndex = 0;       // 最初は左端から
      loopPlay();
    } else {
      // 再生停止：タイマーをクリア
      clearTimeout(timerId);
    }
  });
});