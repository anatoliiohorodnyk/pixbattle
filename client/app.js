const PIXEL_SIZE = 16;
const GRID_SIZE = 64;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const socket = io('http://158.180.239.114:3000' || 'http://localhost:3000');

let userPixelCount = 0;
let showGrid = true;
let pixels = {};

// Налаштування canvas
canvas.width = PIXEL_SIZE * GRID_SIZE;
canvas.height = PIXEL_SIZE * GRID_SIZE;
canvas.style.cursor = 'crosshair';

// Обробник руху миші
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);
    document.getElementById('cursorX').textContent = x;
    document.getElementById('cursorY').textContent = y;
});

// Перемикач сітки
document.getElementById('gridToggle').addEventListener('change', (e) => {
    showGrid = e.target.checked;
    draw();
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Малювання пікселів
    Object.entries(pixels).forEach(([index, color]) => {
        const x = (index % GRID_SIZE) * PIXEL_SIZE;
        const y = Math.floor(index / GRID_SIZE) * PIXEL_SIZE;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
    });

    // Сітка
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

// Сокет-події
socket.on('init', (initialPixels) => {
    pixels = initialPixels;
    draw();
});

socket.on('pixelUpdated', (data) => {
    if(data.userId === socket.id) {
        userPixelCount++;
        document.getElementById('userPixels').textContent = userPixelCount;
    }
    pixels[data.index] = data.color;
    draw();
});

socket.on('usersCount', (count) => {
    document.getElementById('onlineCount').textContent = count;
});

draw();