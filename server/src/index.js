const express = require('express');
const socketIo = require('socket.io');
const Redis = require('ioredis');
const app = express();
const port = process.env.PORT || 3000;

// Підключення до Redis для зберігання стану
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Конфігурація сервера
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Socket.io з CORS
const io = socketIo(server, {
  cors: {
    origin: "http://158.180.239.114" || "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

// Обробка пікселів
io.on('connection', async (socket) => {
  // Відправляємо початковий стан
  console.log('Client connected:', socket.id); // <--- Додати
  const pixels = await redis.get('pixels');
  socket.emit('init', JSON.parse(pixels || '{}'));

  // Оновлення пікселя
  socket.on('updatePixel', async (data) => {
    console.log('Received pixel:', data);
    
    // Отримуємо поточні дані з Redis
    const currentData = await redis.get('pixels');
    let pixels = {};
    
    try {
        pixels = JSON.parse(currentData || '{}');
    } catch (e) {
        console.error('Redis data corrupted, resetting:', e);
        await redis.set('pixels', '{}');
    }
    
    // Оновлюємо дані
    const newPixels = {...pixels, [data.index]: data.color};
    // Зберігаємо назад у Redis
    await redis.set('pixels', JSON.stringify(newPixels));
    io.emit('pixelUpdated', data);
});
});

// Health check для Docker/K8s
app.get('/health', (req, res) => res.status(200).send('OK'));