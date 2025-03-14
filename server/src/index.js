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
    origin: ["http://158.180.239.114", "http://localhost"],
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

// Додаємо обробку помилок Redis
redis.on('error', (error) => {
  console.error('Redis error:', error);
});

// Новий код для лічильника користувачів
let usersCount = 0;

io.on('connection', async (socket) => {
  console.log('New client connected:', socket.id);
  usersCount++;
  io.emit('usersCount', usersCount);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    usersCount--;
    io.emit('usersCount', usersCount);
  });

  try {
    const pixels = await redis.get('pixels');
    const parsedPixels = JSON.parse(pixels || '{}');
    console.log('Sending initial pixels to client:', socket.id);
    socket.emit('init', parsedPixels);
  } catch (error) {
    console.error('Error sending initial pixels:', error);
    socket.emit('init', {});
  }

  socket.on('updatePixel', async (data) => {
    console.log('Updating pixel:', data);
    try {
      const currentData = await redis.get('pixels');
      let pixels = JSON.parse(currentData || '{}');
      
      data.userId = socket.id;
      const newPixels = {...pixels, [data.index]: data.color};
      
      await redis.set('pixels', JSON.stringify(newPixels));
      io.emit('pixelUpdated', data);
      console.log('Pixel updated successfully');
    } catch (error) {
      console.error('Error updating pixel:', error);
      socket.emit('error', 'Failed to update pixel');
    }
  });
});

// Додаємо обробку помилок для express
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).send('Internal Server Error');
});

app.get('/health', (req, res) => res.status(200).send('OK'));