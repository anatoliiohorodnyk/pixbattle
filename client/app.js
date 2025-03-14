const PIXEL_SIZE = 16;
const GRID_SIZE = 64;

let isMouseOverCanvas = false;
let pixels = {};  // Ініціалізуємо pixels як пустий об'єкт

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const cursorPos = document.getElementById('cursorPos');
const socket = io(window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin);

// Додаємо обробку помилок підключення
socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    alert('Помилка підключення до сервера. Спробуйте оновити сторінку.');
});

// Нова змінна для лічильника
let userPixelCount = 0;
let showGrid = true;

canvas.width = PIXEL_SIZE * GRID_SIZE;
canvas.height = PIXEL_SIZE * GRID_SIZE;
canvas.style.cursor = 'crosshair';

// Новий код для курсора
document.addEventListener('mousemove', (e) => {
    if (!isMouseOverCanvas) return;
  
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Оновлення координат
    const x = Math.floor(mouseX / PIXEL_SIZE);
    const y = Math.floor(mouseY / PIXEL_SIZE);
    
    document.getElementById('cursorX').textContent = x;
    document.getElementById('cursorY').textContent = y;
    
    // Примусове оновлення курсора
    canvas.style.cursor = 'crosshair';
  });

// Новий код для сітки
document.getElementById('gridToggle').addEventListener('change', (e) => {
    showGrid = e.target.checked;
    draw();
});

// Обробники для відстеження входу/виходу з canvas
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

// Відображення позиції курсора
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);
    cursorPos.textContent = `${x}, ${y}`;
});

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