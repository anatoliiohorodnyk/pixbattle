const PIXEL_SIZE = 16;
const GRID_SIZE = 64;

let isMouseOverCanvas = false;
let isAnimating = false;
let lastCursorState = null;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const socket = io('http://158.180.239.114:3000' || 'http://localhost:3000');

// Нова змінна для лічильника
let userPixelCount = 0;
let showGrid = true;

canvas.width = PIXEL_SIZE * GRID_SIZE;
canvas.height = PIXEL_SIZE * GRID_SIZE;
canvas.style.cursor = 'crosshair';

// Новий код для курсора
document.addEventListener('mousemove', (e) => {
  if (!isMouseOverCanvas) return;
  
  if (!isAnimating) {
    isAnimating = true;
    requestAnimationFrame(() => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Обмеження координат
      const x = Math.min(Math.max(Math.floor(mouseX / PIXEL_SIZE), GRID_SIZE - 1));
      const y = Math.min(Math.max(Math.floor(mouseY / PIXEL_SIZE), GRID_SIZE - 1));
      
      document.getElementById('cursorX').textContent = x;
      document.getElementById('cursorY').textContent = y;
      
      // Примусове оновлення
      canvas.style.cursor = 'crosshair';
      isAnimating = false;
    });
  }
});

canvas.addEventListener('mousemove', () => {
    canvas.style.cursor = 'crosshair';
  });

// Новий код для сітки
document.getElementById('gridToggle').addEventListener('change', (e) => {
    showGrid = e.target.checked;
    draw();
});

// Обробники входу/виходу
canvas.addEventListener('mouseenter', () => {
    isMouseOverCanvas = true;
    canvas.style.cursor = 'crosshair';
  });
  
  canvas.addEventListener('mouseleave', () => {
    isMouseOverCanvas = false;
    canvas.style.cursor = 'default';
  });

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Малювання пікселів
    Object.entries(pixels).forEach(([index, color]) => {
        const x = (index % GRID_SIZE) * PIXEL_SIZE;
        const y = Math.floor(index / GRID_SIZE) * PIXEL_SIZE;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Скидання трансформацій
    });

    // Новий код для сітки
    if(showGrid) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        for(let i = 0; i <= GRID_SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(i * PIXEL_SIZE, 0);
            ctx.lineTo(i * PIXEL_SIZE, canvas.height);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, i * PIXEL_SIZE);
            ctx.lineTo(canvas.width, i * PIXEL_SIZE);
            ctx.stroke();
        }
    }
}

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);
    const index = y * GRID_SIZE + x;
    
    socket.emit('updatePixel', {
        index: index,
        color: colorPicker.value
    });
});

function updateCursor() {
    const rect = canvas.getBoundingClientRect();
    const isInside = (
        mouseX >= 0 && 
        mouseX <= rect.width && 
        mouseY >= 0 && 
        mouseY <= rect.height
    );
    
    if (isInside && lastCursorState !== 'crosshair') {
        canvas.style.cursor = 'crosshair';
        lastCursorState = 'crosshair';
    } else if (!isInside && lastCursorState !== 'default') {
        canvas.style.cursor = 'default';
        lastCursorState = 'default';
    }
    
    requestAnimationFrame(updateCursor);
}

// Запустити анімаційний цикл
updateCursor();

// Новий код для статистики
socket.on('pixelUpdated', (data) => {
    if(data.userId === socket.id) {
        userPixelCount++;
        document.getElementById('userPixels').textContent = userPixelCount;
    }
    pixels[data.index] = data.color;
    draw();
});

socket.on('init', (initialPixels) => {
    pixels = initialPixels;
    draw();
});

// Новий код для лічильника онлайн
socket.on('usersCount', (count) => {
    document.getElementById('onlineCount').textContent = count;
});