const express = require('express');
const { Server } = require('socket.io');
const { createServer } = require('http');
const Redis = require('ioredis');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
let usersCount = 0;

io.on('connection', async (socket) => {
  usersCount++;
  io.emit('usersCount', usersCount);

  // Відправляємо початковий стан
  const pixels = await redis.get('pixels') || '{}';
  socket.emit('init', JSON.parse(pixels));

  socket.on('updatePixel', async (data) => {
    const pixels = JSON.parse(await redis.get('pixels') || '{}');
    pixels[data.index] = data.color;
    await redis.set('pixels', JSON.stringify(pixels));
    io.emit('pixelUpdated', { ...data, userId: socket.id });
  });

  socket.on('disconnect', () => {
    usersCount--;
    io.emit('usersCount', usersCount);
  });
});

const port = process.env.PORT || 3000;
httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 