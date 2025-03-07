const express = require('express');
const socketIo = require('socket.io');
const Redis = require('ioredis');
const app = express();
const port = process.env.PORT || 3000;

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const io = socketIo(server, {
  cors: {
    origin: "http://158.180.239.114" || "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

// Новий код для лічильника користувачів
let usersCount = 0;

io.on('connection', async (socket) => {
  usersCount++;
  io.emit('usersCount', usersCount);
  
  socket.on('disconnect', () => {
    usersCount--;
    io.emit('usersCount', usersCount);
  });

  const pixels = await redis.get('pixels');
  socket.emit('init', JSON.parse(pixels || '{}'));

  socket.on('updatePixel', async (data) => {
    const currentData = await redis.get('pixels');
    let pixels = {};
    
    try {
        pixels = JSON.parse(currentData || '{}');
    } catch (e) {
        console.error('Redis data corrupted, resetting:', e);
        await redis.set('pixels', '{}');
    }
    
    data.userId = socket.id; // Додаємо ID користувача
    const newPixels = {...pixels, [data.index]: data.color};
    
    await redis.set('pixels', JSON.stringify(newPixels));
    io.emit('pixelUpdated', data);
  });
});

app.get('/health', (req, res) => res.status(200).send('OK'));