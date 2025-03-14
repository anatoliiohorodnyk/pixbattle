const express = require('express');
const { Server } = require('socket.io');
const Redis = require('ioredis');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const port = process.env.PORT || 3000;

let usersCount = 0;

redis.on('error', (error) => {
    console.error('Redis error:', error);
});

io.on('connection', async (socket) => {
    console.log('New client connected:', socket.id);
    usersCount++;
    io.emit('usersCount', usersCount);

    try {
        const pixels = await redis.get('pixels');
        socket.emit('init', JSON.parse(pixels || '{}'));
    } catch (error) {
        console.error('Error sending initial pixels:', error);
        socket.emit('init', {});
    }

    socket.on('updatePixel', async (data) => {
        try {
            const pixels = await redis.get('pixels');
            const currentPixels = JSON.parse(pixels || '{}');
            
            const newPixels = {
                ...currentPixels,
                [data.index]: data.color
            };
            
            await redis.set('pixels', JSON.stringify(newPixels));
            
            data.userId = socket.id;
            io.emit('pixelUpdated', data);
        } catch (error) {
            console.error('Error updating pixel:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        usersCount--;
        io.emit('usersCount', usersCount);
    });
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

// Додаємо обробку помилок для express
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).send('Internal Server Error');
});

app.get('/health', (req, res) => res.status(200).send('OK'));