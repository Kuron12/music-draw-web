window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('draw-canvas');
  const ctx = canvas.getContext('2d');
  // カラーピッカーの色を受け取る
  const colorPicker = document.getElementById('color-picker');
  // 消しゴムボタンを受け取る
  const eraserButton  = document.getElementById('eraser-button');

  let isDrawing = false;
  let lastX = 0, lastY = 0;
  let eraser = false;
  ctx.lineWidth = 5;
  ctx.strokeStyle = colorPicker.value;
  ctx.fillStyle = colorPicker.value;

  ctx.globalCompositeOperation = 'source-over';

  // カラーピッカーの色に変える
  colorPicker.addEventListener('input', (e) => {
    ctx.strokeStyle = e.target.value;
    ctx.fillStyle   = e.target.value;
  });

  // 消しゴムボタンでモード切り替え
  eraserButton.addEventListener('click', () => {
    eraser = !eraser;
    eraserButton.classList.toggle('active', eraser);

    if (eraser) {
      // 消しゴム：描画モードを「消す」に
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      // ブラシ：元に戻す
      ctx.globalCompositeOperation = 'source-over';
    }
  });

  // マウスがクリックされた時
  canvas.addEventListener('mousedown', (e) => {
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
  });

  // マウスを動かしたとき
  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
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

  // マウスを離したとき／キャンバスから出たとき
  ['mouseup','mouseout'].forEach(evt =>
    canvas.addEventListener(evt, () => { isDrawing = false; })
  );

  console.log('Ready to draw!');
});