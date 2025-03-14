document.addEventListener('DOMContentLoaded', () => {
    const PIXEL_SIZE = 16;
    const GRID_SIZE = 64;

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const colorPicker = document.getElementById('colorPicker');
    const cursorPos = document.getElementById('cursorPos');
    const onlineCount = document.getElementById('onlineCount');
    const userPixels = document.getElementById('userPixels');

    let pixels = {};
    let userPixelCount = 0;

    // Налаштування canvas
    canvas.width = PIXEL_SIZE * GRID_SIZE;
    canvas.height = PIXEL_SIZE * GRID_SIZE;

    // Підключення до сервера
    const socket = io();

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Малюємо пікселі
        Object.entries(pixels).forEach(([index, color]) => {
            const x = (index % GRID_SIZE) * PIXEL_SIZE;
            const y = Math.floor(index / GRID_SIZE) * PIXEL_SIZE;
            ctx.fillStyle = color;
            ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
        });

        // Малюємо сітку
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

    // Обробка кліків
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

    // Оновлення позиції курсора
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
        const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);
        cursorPos.textContent = `${x}, ${y}`;
    });

    // Socket.io події
    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
    });

    socket.on('init', (initialPixels) => {
        pixels = initialPixels;
        draw();
    });

    socket.on('pixelUpdated', (data) => {
        pixels[data.index] = data.color;
        if (data.userId === socket.id) {
            userPixelCount++;
            userPixels.textContent = userPixelCount;
        }
        draw();
    });

    socket.on('usersCount', (count) => {
        onlineCount.textContent = count;
    });
});