const express = require('express');
const { Server } = require('socket.io');
const Redis = require('ioredis');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const redis = new Redis(process.env.REDIS_URL);
const port = process.env.PORT || 3000;

const GRID_SIZE = 128;
const BACKGROUND_COLOR = 'rgb(202, 227, 255)';

let usersCount = 0;

// Функція для логування з часовою міткою
function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}

// Функція для створення початкового стану полотна
function createInitialCanvas() {
    const pixels = {};
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const index = y * GRID_SIZE + x;
            pixels[index] = BACKGROUND_COLOR;
        }
    }
    return pixels;
}

io.on('connection', async (socket) => {
    usersCount++;
    io.emit('usersCount', usersCount);
    log(`Новий користувач підключився (${socket.id}). Всього користувачів: ${usersCount}`);

    try {
        let pixels = await redis.get('pixels');
        if (!pixels) {
            pixels = JSON.stringify(createInitialCanvas());
            await redis.set('pixels', pixels);
        }
        socket.emit('pixels', JSON.parse(pixels));
    } catch (error) {
        log(`Помилка при ініціалізації для ${socket.id}: ${error.message}`);
        socket.emit('pixels', createInitialCanvas());
    }

    socket.on('pixel', async (data) => {
        try {
            const pixels = await redis.get('pixels');
            const currentPixels = JSON.parse(pixels || '{}');
            const newPixels = { ...currentPixels, [data.index]: data.color };
            await redis.set('pixels', JSON.stringify(newPixels));
            
            io.emit('pixel', data);
            log(`Оновлено піксель ${data.index} користувачем ${socket.id}`);
        } catch (error) {
            log(`Помилка при оновленні пікселя: ${error.message}`);
            socket.emit('error', 'Не вдалося оновити піксель');
        }
    });

    socket.on('clear', async () => {
        try {
            const initialCanvas = createInitialCanvas();
            await redis.set('pixels', JSON.stringify(initialCanvas));
            io.emit('pixels', initialCanvas);
            log(`Полотно очищено користувачем ${socket.id}`);
        } catch (error) {
            log(`Помилка при очищенні полотна: ${error.message}`);
            socket.emit('error', 'Не вдалося очистити полотно');
        }
    });

    socket.on('disconnect', () => {
        usersCount--;
        io.emit('usersCount', usersCount);
        log(`Користувач відключився (${socket.id}). Залишилось користувачів: ${usersCount}`);
    });
});

// Обробка помилок Redis
redis.on('error', (error) => {
    log(`Помилка Redis: ${error.message}`);
});

// Маршрут для перевірки здоров'я сервера
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        usersCount
    });
});

server.listen(port, () => {
    log(`Сервер запущено на порту ${port}`);
});

// Додаємо обробку помилок для express
app.use((err, req, res, next) => {
    console.error('Express error:', err);
    res.status(500).send('Internal Server Error');
});