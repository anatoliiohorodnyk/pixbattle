const express = require('express');
const { Server } = require('socket.io');
const Redis = require('ioredis');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const redis = new Redis(process.env.REDIS_URL);
const port = process.env.PORT || 3000;

let usersCount = 0;

// Функція для логування з часовою міткою
function log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
}

io.on('connection', async (socket) => {
    usersCount++;
    io.emit('usersCount', usersCount);
    log(`Новий користувач підключився (${socket.id}). Всього користувачів: ${usersCount}`);

    try {
        const pixels = await redis.get('pixels');
        socket.emit('init', JSON.parse(pixels || '{}'));
    } catch (error) {
        log(`Помилка при ініціалізації для ${socket.id}: ${error.message}`);
        socket.emit('init', {});
    }

    socket.on('updatePixel', async (data) => {
        try {
            const pixels = await redis.get('pixels');
            const currentPixels = JSON.parse(pixels || '{}');
            const newPixels = { ...currentPixels, [data.index]: data.color };
            await redis.set('pixels', JSON.stringify(newPixels));
            
            data.userId = socket.id;
            io.emit('pixelUpdated', data);
            log(`Оновлено піксель ${data.index} користувачем ${socket.id}`);
        } catch (error) {
            log(`Помилка при оновленні пікселя: ${error.message}`);
            socket.emit('error', 'Не вдалося оновити піксель');
        }
    });

    socket.on('clearCanvas', async () => {
        try {
            await redis.set('pixels', '{}');
            io.emit('canvasCleared');
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