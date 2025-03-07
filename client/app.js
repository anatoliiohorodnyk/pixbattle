const PIXEL_SIZE = 16;
const GRID_SIZE = 64;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const socket = io('http://158.180.239.114:3000' || 'http://localhost:3000');

// Стан гри
let userPixelCount = 0;
let showGrid = true;
let isDragging = false;
let lastX = 0;
let lastY = 0;
let offsetX = 0;
let offsetY = 0;
let pixels = {};

// Налаштування canvas
canvas.width = PIXEL_SIZE * GRID_SIZE;
canvas.height = PIXEL_SIZE * GRID_SIZE;
canvas.style.cursor = 'crosshair';

// Обробники подій миші
canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0) { // Ліва кнопка
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.style.cursor = 'grabbing';
  }
});

document.addEventListener('mouseup', () => {
  isDragging = false;
  canvas.style.cursor = 'crosshair';
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const deltaX = e.clientX - lastX;
    const deltaY = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    
    offsetX += deltaX;
    offsetY += deltaY;
    
    // Обмеження зсуву
    const maxOffset = GRID_SIZE * PIXEL_SIZE - window.innerWidth;
    offsetX = Math.min(Math.max(offsetX, -maxOffset), maxOffset);
    offsetY = Math.min(Math.max(offsetY, -maxOffset), maxOffset);
    
    canvas.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  } else {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left - offsetX) / PIXEL_SIZE);
    const y = Math.floor((e.clientY - rect.top - offsetY) / PIXEL_SIZE);
    document.getElementById('cursorX').textContent = x;
    document.getElementById('cursorY').textContent = y;
  }
});

// Обробник кліків
canvas.addEventListener('click', (e) => {
  if (isDragging) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left - offsetX) / PIXEL_SIZE);
  const y = Math.floor((e.clientY - rect.top - offsetY) / PIXEL_SIZE);
  const index = y * GRID_SIZE + x;
  
  socket.emit('updatePixel', {
    index: index,
    color: colorPicker.value
  });
});

// Перемикач сітки
document.getElementById('gridToggle').addEventListener('change', (e) => {
  showGrid = e.target.checked;
  draw();
});

// Малювання
function draw() {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(-offsetX, -offsetY);

  // Пікселі
  Object.entries(pixels).forEach(([index, color]) => {
    const x = (index % GRID_SIZE) * PIXEL_SIZE;
    const y = Math.floor(index / GRID_SIZE) * PIXEL_SIZE;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
  });

  // Сітка
  if (showGrid) {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    
    const startCol = Math.floor(offsetX / PIXEL_SIZE);
    const startRow = Math.floor(offsetY / PIXEL_SIZE);
    const endCol = startCol + Math.ceil(window.innerWidth / PIXEL_SIZE) + 1;
    const endRow = startRow + Math.ceil(window.innerHeight / PIXEL_SIZE) + 1;

    for (let i = startCol; i < endCol; i++) {
      ctx.beginPath();
      ctx.moveTo(i * PIXEL_SIZE, startRow * PIXEL_SIZE);
      ctx.lineTo(i * PIXEL_SIZE, endRow * PIXEL_SIZE);
      ctx.stroke();
    }

    for (let i = startRow; i < endRow; i++) {
      ctx.beginPath();
      ctx.moveTo(startCol * PIXEL_SIZE, i * PIXEL_SIZE);
      ctx.lineTo(endCol * PIXEL_SIZE, i * PIXEL_SIZE);
      ctx.stroke();
    }
  }

  ctx.restore();
}

// Сокет-події
socket.on('init', (initialPixels) => {
  pixels = initialPixels;
  draw();
});

socket.on('pixelUpdated', (data) => {
  if (data.userId === socket.id) {
    userPixelCount++;
    document.getElementById('userPixels').textContent = userPixelCount;
  }
  pixels[data.index] = data.color;
  draw();
});

socket.on('usersCount', (count) => {
  document.getElementById('onlineCount').textContent = count;
});

// Перша відмальовка
draw();