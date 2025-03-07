const PIXEL_SIZE = 16;
const GRID_SIZE = 640;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const socket = io(process.env.SERVER_URL || 'http://localhost:3000');

canvas.width = PIXEL_SIZE * GRID_SIZE;
canvas.height = PIXEL_SIZE * GRID_SIZE;

let pixels = {};

// Оновлення полотна
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    Object.entries(pixels).forEach(([index, color]) => {
        const x = (index % GRID_SIZE) * PIXEL_SIZE;
        const y = Math.floor(index / GRID_SIZE) * PIXEL_SIZE;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
    });
}

// Обробник кліків
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);
    const index = y * GRID_SIZE + x;
    console.log('Sending:', {index, color: colorPicker.value}); // <--- Додати
    
    socket.emit('updatePixel', {
        index: index,
        color: colorPicker.value
    });
});

// Socket.io listeners
socket.on('init', (initialPixels) => {
    pixels = initialPixels;
    draw();
});

socket.on('pixelUpdated', (data) => {
    pixels[data.index] = data.color;
    draw();
});