window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('draw-canvas');
  const ctx = canvas.getContext('2d');
  // カラーピッカーの色を受け取る
  const colorPicker = document.getElementById('color-picker');
  
  ctx.strokeStyle = colorPicker.value;
  ctx.fillStyle = colorPicker.value;
  
  colorPicker.addEventListener('input', (e) => {
    ctx.strokeStyle = e.target.value;
    ctx.fillStyle   = e.target.value;
  });

  ctx.lineWidth = 5;

  let isDrawing = false;
  let lastX = 0, lastY = 0;
  
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