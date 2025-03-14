const PIXEL_SIZE = 16;
const GRID_SIZE = 64;

document.addEventListener('DOMContentLoaded', () => {
    let isMouseOverCanvas = false;
    let pixels = {};  // Ініціалізуємо pixels як пустий об'єкт
    let userPixelCount = 0;
    let showGrid = true;

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const colorPicker = document.getElementById('colorPicker');
    const cursorPos = document.getElementById('cursorPos');
    const onlineCount = document.getElementById('onlineCount');
    const userPixels = document.getElementById('userPixels');

    if (!canvas || !ctx || !colorPicker || !cursorPos || !onlineCount || !userPixels) {
        console.error('Не вдалося знайти необхідні елементи DOM');
        return;
    }

    // Налаштування canvas
    canvas.width = PIXEL_SIZE * GRID_SIZE;
    canvas.height = PIXEL_SIZE * GRID_SIZE;
    canvas.style.cursor = 'crosshair';

    // Підключення до сервера
    const socket = io({
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
    });

    // Обробка помилок підключення
    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        alert('Помилка підключення до сервера. Спробуйте оновити сторінку.');
    });

    socket.on('connect', () => {
        console.log('Connected to server');
    });

    // Оновлення координат курсора
    canvas.addEventListener('mousemove', (e) => {
        if (!isMouseOverCanvas) return;
    
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const x = Math.floor(mouseX / PIXEL_SIZE);
        const y = Math.floor(mouseY / PIXEL_SIZE);
        
        cursorPos.textContent = `${x}, ${y}`;
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
        
        // Малюємо пікселі
        Object.entries(pixels).forEach(([index, color]) => {
            const x = (index % GRID_SIZE) * PIXEL_SIZE;
            const y = Math.floor(index / GRID_SIZE) * PIXEL_SIZE;
            ctx.fillStyle = color;
            ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
        });

        // Малюємо сітку
        if (showGrid) {
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

    // Socket.io події
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